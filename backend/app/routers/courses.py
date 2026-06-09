from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import Optional, List
from ..database import get_db
from ..auth import get_current_user
from ..schemas import CourseCreate, CourseUpdate, CourseResponse, EnrollmentCreate, EnrollmentResponse
from .. import models

router = APIRouter(prefix="/api/courses", tags=["课程管理"])


@router.get("", response_model=List[CourseResponse])
def list_courses(
    center_point: Optional[str] = None,
    age_group: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Course).options(joinedload(models.Course.teacher))
    if center_point:
        query = query.filter(models.Course.center_point == center_point)
    if age_group:
        query = query.filter(models.Course.age_group == age_group)
    if is_active is not None:
        query = query.filter(models.Course.is_active == is_active)
    courses = query.order_by(models.Course.center_point, models.Course.name).all()
    result = []
    for course in courses:
        count = db.query(func.count(models.Enrollment.id)).filter(
            models.Enrollment.course_id == course.id,
            models.Enrollment.status == models.EnrollmentStatus.active
        ).scalar()
        course_dict = CourseResponse.model_validate(course)
        course_dict.enrollment_count = count
        result.append(course_dict)
    return result


@router.post("", response_model=CourseResponse, status_code=201)
def create_course(
    course_data: CourseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in [models.UserRole.admin, models.UserRole.receptionist]:
        raise HTTPException(status_code=403, detail="权限不足")
    course = models.Course(**course_data.model_dump())
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    course = db.query(models.Course).options(
        joinedload(models.Course.teacher)
    ).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    count = db.query(func.count(models.Enrollment.id)).filter(
        models.Enrollment.course_id == course_id,
        models.Enrollment.status == models.EnrollmentStatus.active
    ).scalar()
    course_response = CourseResponse.model_validate(course)
    course_response.enrollment_count = count
    return course_response


@router.put("/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: int,
    course_data: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in [models.UserRole.admin, models.UserRole.receptionist]:
        raise HTTPException(status_code=403, detail="权限不足")
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    for field, value in course_data.model_dump(exclude_unset=True).items():
        setattr(course, field, value)
    db.commit()
    db.refresh(course)
    return course


@router.delete("/{course_id}", status_code=204)
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.UserRole.admin:
        raise HTTPException(status_code=403, detail="权限不足")
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    course.is_active = False
    db.commit()


@router.get("/{course_id}/students")
def get_course_students(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="课程不存在")
    enrollments = db.query(models.Enrollment).options(
        joinedload(models.Enrollment.student)
    ).filter(
        models.Enrollment.course_id == course_id,
        models.Enrollment.status == models.EnrollmentStatus.active
    ).all()
    return [e.student for e in enrollments]


@router.get("/{course_id}/enrollments", response_model=List[EnrollmentResponse])
def get_course_enrollments(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Enrollment).options(
        joinedload(models.Enrollment.student)
    ).filter(models.Enrollment.course_id == course_id).all()
