from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_
from typing import Optional, List
from datetime import date, timedelta
from ..database import get_db
from ..auth import get_current_user
from ..schemas import AttendanceCreate, AttendanceUpdate, AttendanceResponse, AttendanceBulkCreate
from .. import models

router = APIRouter(prefix="/api/attendance", tags=["考勤管理"])


@router.get("", response_model=List[AttendanceResponse])
def list_attendance(
    course_id: Optional[int] = None,
    student_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    attendance_date: Optional[date] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Attendance).options(
        joinedload(models.Attendance.student)
    )
    if course_id:
        query = query.filter(models.Attendance.course_id == course_id)
    if student_id:
        query = query.filter(models.Attendance.student_id == student_id)
    if attendance_date:
        query = query.filter(models.Attendance.date == attendance_date)
    if date_from:
        query = query.filter(models.Attendance.date >= date_from)
    if date_to:
        query = query.filter(models.Attendance.date <= date_to)
    return query.order_by(models.Attendance.date.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=AttendanceResponse, status_code=201)
def create_attendance(
    attendance_data: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    existing = db.query(models.Attendance).filter(
        models.Attendance.student_id == attendance_data.student_id,
        models.Attendance.course_id == attendance_data.course_id,
        models.Attendance.date == attendance_data.date
    ).first()
    if existing:
        for field, value in attendance_data.model_dump(exclude_unset=True).items():
            setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        return existing
    attendance = models.Attendance(**attendance_data.model_dump())
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    return attendance


@router.post("/bulk", status_code=201)
def bulk_create_attendance(
    bulk_data: AttendanceBulkCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    results = []
    for item in bulk_data.records:
        existing = db.query(models.Attendance).filter(
            models.Attendance.student_id == item.student_id,
            models.Attendance.course_id == bulk_data.course_id,
            models.Attendance.date == bulk_data.date
        ).first()
        if existing:
            existing.status = item.status
            if item.check_in_time:
                existing.check_in_time = item.check_in_time
            if item.check_out_time:
                existing.check_out_time = item.check_out_time
            if item.notes:
                existing.notes = item.notes
            results.append(existing)
        else:
            attendance = models.Attendance(
                student_id=item.student_id,
                course_id=bulk_data.course_id,
                date=bulk_data.date,
                status=item.status,
                check_in_time=item.check_in_time,
                check_out_time=item.check_out_time,
                notes=item.notes
            )
            db.add(attendance)
            results.append(attendance)
    db.commit()
    return {"saved": len(results), "date": str(bulk_data.date), "course_id": bulk_data.course_id}


@router.get("/{attendance_id}", response_model=AttendanceResponse)
def get_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    record = db.query(models.Attendance).options(
        joinedload(models.Attendance.student)
    ).filter(models.Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="考勤记录不存在")
    return record


@router.put("/{attendance_id}", response_model=AttendanceResponse)
def update_attendance(
    attendance_id: int,
    attendance_data: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    record = db.query(models.Attendance).filter(models.Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="考勤记录不存在")
    for field, value in attendance_data.model_dump(exclude_unset=True).items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{attendance_id}", status_code=204)
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    record = db.query(models.Attendance).filter(models.Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="考勤记录不存在")
    db.delete(record)
    db.commit()


@router.get("/summary/weekly")
def get_weekly_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    today = date.today()
    start_of_week = today - timedelta(days=today.weekday())
    results = []
    for i in range(7):
        d = start_of_week + timedelta(days=i)
        records = db.query(models.Attendance).filter(models.Attendance.date == d).all()
        total = len(records)
        present = sum(1 for r in records if r.status == models.AttendanceStatus.present)
        absent = sum(1 for r in records if r.status == models.AttendanceStatus.absent)
        late = sum(1 for r in records if r.status == models.AttendanceStatus.late)
        excused = sum(1 for r in records if r.status == models.AttendanceStatus.excused)
        results.append({
            "date": str(d),
            "present": present,
            "absent": absent,
            "late": late,
            "excused": excused,
            "total": total
        })
    return results
