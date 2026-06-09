from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional, List
from ..database import get_db
from ..auth import get_current_user
from ..schemas import StudentCreate, StudentUpdate, StudentResponse, StudentWithEnrollments, EnrollmentCreate, EnrollmentResponse
from .. import models

router = APIRouter(prefix="/api/students", tags=["学生管理"])


@router.get("", response_model=List[StudentResponse])
def list_students(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = None,
    center_point: Optional[str] = None,
    age_group: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Student)
    if search:
        query = query.filter(
            or_(
                models.Student.name.ilike(f"%{search}%"),
                models.Student.name_en.ilike(f"%{search}%"),
                models.Student.parent_name.ilike(f"%{search}%"),
                models.Student.parent_phone.ilike(f"%{search}%"),
            )
        )
    if center_point:
        query = query.filter(models.Student.center_point == center_point)
    if age_group:
        query = query.filter(models.Student.age_group == age_group)
    if status:
        query = query.filter(models.Student.status == status)
    return query.order_by(models.Student.created_at.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=StudentResponse, status_code=201)
def create_student(
    student_data: StudentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    student = models.Student(**student_data.model_dump())
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.get("/{student_id}", response_model=StudentWithEnrollments)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    student = db.query(models.Student).options(
        joinedload(models.Student.enrollments).joinedload(models.Enrollment.course)
    ).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="学生不存在")
    return student


@router.put("/{student_id}", response_model=StudentResponse)
def update_student(
    student_id: int,
    student_data: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="学生不存在")
    for field, value in student_data.model_dump(exclude_unset=True).items():
        setattr(student, field, value)
    db.commit()
    db.refresh(student)
    return student


@router.delete("/{student_id}", status_code=204)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="权限不足")
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="学生不存在")
    db.delete(student)
    db.commit()


@router.post("/{student_id}/enroll", response_model=EnrollmentResponse, status_code=201)
def enroll_student(
    student_id: int,
    enrollment_data: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="学生不存在")
    course = db.query(models.Course).filter(models.Course.id == enrollment_data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    existing = db.query(models.Enrollment).filter(
        models.Enrollment.student_id == student_id,
        models.Enrollment.course_id == enrollment_data.course_id,
        models.Enrollment.status == models.EnrollmentStatus.active
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="学生已报名该课程")
    enrollment_dict = enrollment_data.model_dump()
    enrollment_dict["student_id"] = student_id
    if enrollment_dict.get("fee_due", 0) == 0:
        enrollment_dict["fee_due"] = course.fee_monthly
    enrollment = models.Enrollment(**enrollment_dict)
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.get("/{student_id}/attendance")
def get_student_attendance(
    student_id: int,
    course_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Attendance).filter(models.Attendance.student_id == student_id)
    if course_id:
        query = query.filter(models.Attendance.course_id == course_id)
    records = query.order_by(models.Attendance.date.desc()).limit(60).all()
    total = len(records)
    present = sum(1 for r in records if r.status == models.AttendanceStatus.present)
    late = sum(1 for r in records if r.status == models.AttendanceStatus.late)
    absent = sum(1 for r in records if r.status == models.AttendanceStatus.absent)
    return {
        "records": records,
        "summary": {
            "total": total,
            "present": present,
            "late": late,
            "absent": absent,
            "attendance_rate": round((present + late) / total * 100, 1) if total > 0 else 0
        }
    }
