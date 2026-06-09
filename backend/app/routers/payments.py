from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, extract
from typing import Optional, List
from datetime import date
import uuid
from ..database import get_db
from ..auth import get_current_user
from ..schemas import PaymentCreate, PaymentUpdate, PaymentResponse, EnrollmentUpdate
from .. import models

router = APIRouter(prefix="/api/payments", tags=["缴费管理"])


@router.get("", response_model=List[PaymentResponse])
def list_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    month: Optional[int] = None,
    year: Optional[int] = None,
    status: Optional[str] = None,
    enrollment_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Payment).options(
        joinedload(models.Payment.enrollment).joinedload(models.Enrollment.student),
        joinedload(models.Payment.enrollment).joinedload(models.Enrollment.course)
    )
    if enrollment_id:
        query = query.filter(models.Payment.enrollment_id == enrollment_id)
    if status:
        query = query.filter(models.Payment.status == status)
    if year:
        query = query.filter(extract('year', models.Payment.payment_date) == year)
    if month:
        query = query.filter(extract('month', models.Payment.payment_date) == month)
    return query.order_by(models.Payment.payment_date.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=PaymentResponse, status_code=201)
def create_payment(
    payment_data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    enrollment = db.query(models.Enrollment).filter(
        models.Enrollment.id == payment_data.enrollment_id
    ).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="报名记录不存在")

    if not payment_data.receipt_number:
        payment_dict = payment_data.model_dump()
        payment_dict["receipt_number"] = f"RCP-{date.today().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"
    else:
        payment_dict = payment_data.model_dump()

    payment = models.Payment(**payment_dict)
    db.add(payment)

    # Update enrollment fee_paid and payment_status
    enrollment.fee_paid = (enrollment.fee_paid or 0) + payment_data.amount
    if enrollment.fee_paid >= enrollment.fee_due:
        enrollment.payment_status = models.PaymentStatus.paid
    else:
        enrollment.payment_status = models.PaymentStatus.partial

    db.commit()
    db.refresh(payment)
    return payment


@router.get("/summary")
def get_payment_summary(
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    today = date.today()
    target_year = year or today.year
    target_month = month or today.month

    total_revenue = db.query(func.sum(models.Payment.amount)).filter(
        extract('year', models.Payment.payment_date) == target_year,
        extract('month', models.Payment.payment_date) == target_month,
        models.Payment.status == models.PaymentStatus.paid
    ).scalar() or 0.0

    pending_count = db.query(func.count(models.Enrollment.id)).filter(
        models.Enrollment.payment_status == models.PaymentStatus.pending,
        models.Enrollment.status == models.EnrollmentStatus.active
    ).scalar() or 0

    overdue_count = db.query(func.count(models.Enrollment.id)).filter(
        models.Enrollment.payment_status == models.PaymentStatus.overdue,
        models.Enrollment.status == models.EnrollmentStatus.active
    ).scalar() or 0

    total_due = db.query(func.sum(models.Enrollment.fee_due)).filter(
        models.Enrollment.status == models.EnrollmentStatus.active
    ).scalar() or 0.0

    total_paid = db.query(func.sum(models.Enrollment.fee_paid)).filter(
        models.Enrollment.status == models.EnrollmentStatus.active
    ).scalar() or 0.0

    return {
        "monthly_revenue": round(total_revenue, 2),
        "pending_payments": pending_count,
        "overdue_payments": overdue_count,
        "total_due": round(total_due, 2),
        "total_paid": round(total_paid, 2),
        "outstanding": round(total_due - total_paid, 2),
        "year": target_year,
        "month": target_month
    }


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    payment = db.query(models.Payment).options(
        joinedload(models.Payment.enrollment).joinedload(models.Enrollment.student),
        joinedload(models.Payment.enrollment).joinedload(models.Enrollment.course)
    ).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="缴费记录不存在")
    return payment


@router.put("/{payment_id}", response_model=PaymentResponse)
def update_payment(
    payment_id: int,
    payment_data: PaymentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in [models.UserRole.admin, models.UserRole.receptionist]:
        raise HTTPException(status_code=403, detail="权限不足")
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="缴费记录不存在")
    for field, value in payment_data.model_dump(exclude_unset=True).items():
        setattr(payment, field, value)
    db.commit()
    db.refresh(payment)
    return payment


@router.delete("/{payment_id}", status_code=204)
def delete_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="权限不足")
    payment = db.query(models.Payment).filter(models.Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="缴费记录不存在")
    db.delete(payment)
    db.commit()


@router.get("/enrollments/unpaid")
def get_unpaid_enrollments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    enrollments = db.query(models.Enrollment).options(
        joinedload(models.Enrollment.student),
        joinedload(models.Enrollment.course)
    ).filter(
        models.Enrollment.status == models.EnrollmentStatus.active,
        models.Enrollment.payment_status.in_([
            models.PaymentStatus.pending,
            models.PaymentStatus.overdue,
            models.PaymentStatus.partial
        ])
    ).all()
    return enrollments
