from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import date, datetime
from .models import (
    UserRole, AgeGroup, CenterPoint, StudentStatus,
    EnrollmentStatus, PaymentStatus, AttendanceStatus,
    AnnouncementTarget, PaymentMethod
)


# ─── User Schemas ──────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    role: str = UserRole.teacher
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None


class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── Auth Schemas ──────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ─── Student Schemas ───────────────────────────────────────────────────────────

class StudentBase(BaseModel):
    name: str
    name_en: Optional[str] = None
    dob: date
    age_group: str
    center_point: str
    enrollment_date: date
    status: str = StudentStatus.active
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    parent_name: str
    parent_phone: str
    parent_email: Optional[str] = None
    parent_wechat: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    name_en: Optional[str] = None
    dob: Optional[date] = None
    age_group: Optional[str] = None
    center_point: Optional[str] = None
    enrollment_date: Optional[date] = None
    status: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    parent_email: Optional[str] = None
    parent_wechat: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class StudentResponse(StudentBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class StudentWithEnrollments(StudentResponse):
    enrollments: List["EnrollmentResponse"] = []


# ─── Course Schemas ────────────────────────────────────────────────────────────

class CourseBase(BaseModel):
    name: str
    name_en: Optional[str] = None
    center_point: str
    age_group: str
    description: Optional[str] = None
    capacity: int = 20
    fee_monthly: float
    schedule_days: Optional[str] = None
    schedule_time: Optional[str] = None
    duration_weeks: int = 16
    teacher_id: Optional[int] = None
    is_active: bool = True


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    name: Optional[str] = None
    name_en: Optional[str] = None
    center_point: Optional[str] = None
    age_group: Optional[str] = None
    description: Optional[str] = None
    capacity: Optional[int] = None
    fee_monthly: Optional[float] = None
    schedule_days: Optional[str] = None
    schedule_time: Optional[str] = None
    duration_weeks: Optional[int] = None
    teacher_id: Optional[int] = None
    is_active: Optional[bool] = None


class CourseResponse(CourseBase):
    id: int
    created_at: datetime
    teacher: Optional[UserResponse] = None
    enrollment_count: Optional[int] = 0

    model_config = {"from_attributes": True}


# ─── Enrollment Schemas ────────────────────────────────────────────────────────

class EnrollmentBase(BaseModel):
    student_id: int
    course_id: int
    start_date: date
    end_date: Optional[date] = None
    status: str = EnrollmentStatus.active
    payment_status: str = PaymentStatus.pending
    fee_paid: float = 0.0
    fee_due: float = 0.0
    notes: Optional[str] = None


class EnrollmentCreate(EnrollmentBase):
    pass


class EnrollmentUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    payment_status: Optional[str] = None
    fee_paid: Optional[float] = None
    fee_due: Optional[float] = None
    notes: Optional[str] = None


class EnrollmentResponse(EnrollmentBase):
    id: int
    created_at: datetime
    student: Optional[StudentResponse] = None
    course: Optional[CourseResponse] = None

    model_config = {"from_attributes": True}


# ─── Attendance Schemas ────────────────────────────────────────────────────────

class AttendanceBase(BaseModel):
    student_id: int
    course_id: int
    date: date
    status: str = AttendanceStatus.present
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    notes: Optional[str] = None


class AttendanceCreate(AttendanceBase):
    pass


class AttendanceUpdate(BaseModel):
    status: Optional[str] = None
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    notes: Optional[str] = None


class AttendanceBulkItem(BaseModel):
    student_id: int
    status: str = AttendanceStatus.present
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    notes: Optional[str] = None


class AttendanceBulkCreate(BaseModel):
    course_id: int
    date: date
    records: List[AttendanceBulkItem]


class AttendanceResponse(AttendanceBase):
    id: int
    created_at: datetime
    student: Optional[StudentResponse] = None

    model_config = {"from_attributes": True}


# ─── Payment Schemas ───────────────────────────────────────────────────────────

class PaymentBase(BaseModel):
    enrollment_id: int
    amount: float
    payment_date: date
    payment_method: str = PaymentMethod.cash
    receipt_number: Optional[str] = None
    status: str = PaymentStatus.paid
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class PaymentUpdate(BaseModel):
    amount: Optional[float] = None
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    receipt_number: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class PaymentResponse(PaymentBase):
    id: int
    created_at: datetime
    enrollment: Optional[EnrollmentResponse] = None

    model_config = {"from_attributes": True}


# ─── Announcement Schemas ──────────────────────────────────────────────────────

class AnnouncementBase(BaseModel):
    title: str
    content: str
    target_audience: str = AnnouncementTarget.all
    is_active: bool = True
    is_pinned: bool = False


class AnnouncementCreate(AnnouncementBase):
    pass


class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    target_audience: Optional[str] = None
    is_active: Optional[bool] = None
    is_pinned: Optional[bool] = None


class AnnouncementResponse(AnnouncementBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    creator: Optional[UserResponse] = None

    model_config = {"from_attributes": True}


# ─── Dashboard Schemas ─────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_students: int
    active_students: int
    todays_attendance: int
    todays_attendance_rate: float
    active_courses: int
    monthly_revenue: float
    monthly_revenue_target: float
    students_by_center: dict
    students_by_age_group: dict


class AttendanceByDay(BaseModel):
    date: str
    present: int
    absent: int
    late: int
    excused: int
    total: int


class DashboardResponse(BaseModel):
    stats: DashboardStats
    attendance_this_week: List[AttendanceByDay]
    recent_announcements: List[AnnouncementResponse]
    recent_enrollments: List[EnrollmentResponse]
