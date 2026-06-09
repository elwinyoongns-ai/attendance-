from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract
from datetime import date, timedelta
from ..database import get_db
from ..auth import get_current_user
from ..schemas import DashboardResponse, DashboardStats, AttendanceByDay, AnnouncementResponse, EnrollmentResponse
from .. import models

router = APIRouter(prefix="/api/dashboard", tags=["仪表盘"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    today = date.today()

    # Total and active students
    total_students = db.query(func.count(models.Student.id)).scalar() or 0
    active_students = db.query(func.count(models.Student.id)).filter(
        models.Student.status == models.StudentStatus.active
    ).scalar() or 0

    # Today's attendance
    todays_records = db.query(models.Attendance).filter(
        models.Attendance.date == today
    ).all()
    todays_attendance = sum(
        1 for r in todays_records
        if r.status in [models.AttendanceStatus.present, models.AttendanceStatus.late]
    )
    todays_attendance_rate = (
        round(todays_attendance / len(todays_records) * 100, 1)
        if todays_records else 0.0
    )

    # Active courses
    active_courses = db.query(func.count(models.Course.id)).filter(
        models.Course.is_active == True
    ).scalar() or 0

    # Monthly revenue
    monthly_revenue = db.query(func.sum(models.Payment.amount)).filter(
        extract('year', models.Payment.payment_date) == today.year,
        extract('month', models.Payment.payment_date) == today.month,
        models.Payment.status == models.PaymentStatus.paid
    ).scalar() or 0.0

    # Students by center
    center_rows = db.query(
        models.Student.center_point,
        func.count(models.Student.id)
    ).filter(
        models.Student.status == models.StudentStatus.active
    ).group_by(models.Student.center_point).all()
    students_by_center = {row[0]: row[1] for row in center_rows}

    # Students by age group
    age_rows = db.query(
        models.Student.age_group,
        func.count(models.Student.id)
    ).filter(
        models.Student.status == models.StudentStatus.active
    ).group_by(models.Student.age_group).all()
    students_by_age_group = {row[0]: row[1] for row in age_rows}

    stats = DashboardStats(
        total_students=total_students,
        active_students=active_students,
        todays_attendance=todays_attendance,
        todays_attendance_rate=todays_attendance_rate,
        active_courses=active_courses,
        monthly_revenue=round(monthly_revenue, 2),
        monthly_revenue_target=50000.0,
        students_by_center=students_by_center,
        students_by_age_group=students_by_age_group
    )

    # Attendance this week
    start_of_week = today - timedelta(days=today.weekday())
    attendance_this_week = []
    for i in range(7):
        d = start_of_week + timedelta(days=i)
        records = db.query(models.Attendance).filter(models.Attendance.date == d).all()
        total = len(records)
        present = sum(1 for r in records if r.status == models.AttendanceStatus.present)
        absent = sum(1 for r in records if r.status == models.AttendanceStatus.absent)
        late = sum(1 for r in records if r.status == models.AttendanceStatus.late)
        excused = sum(1 for r in records if r.status == models.AttendanceStatus.excused)
        attendance_this_week.append(AttendanceByDay(
            date=str(d),
            present=present,
            absent=absent,
            late=late,
            excused=excused,
            total=total
        ))

    # Recent announcements
    recent_announcements_db = db.query(models.Announcement).options(
        joinedload(models.Announcement.creator)
    ).filter(
        models.Announcement.is_active == True
    ).order_by(models.Announcement.created_at.desc()).limit(5).all()
    recent_announcements = [AnnouncementResponse.model_validate(a) for a in recent_announcements_db]

    # Recent enrollments
    recent_enrollments_db = db.query(models.Enrollment).options(
        joinedload(models.Enrollment.student),
        joinedload(models.Enrollment.course)
    ).order_by(models.Enrollment.created_at.desc()).limit(5).all()
    recent_enrollments = [EnrollmentResponse.model_validate(e) for e in recent_enrollments_db]

    return DashboardResponse(
        stats=stats,
        attendance_this_week=attendance_this_week,
        recent_announcements=recent_announcements,
        recent_enrollments=recent_enrollments
    )
