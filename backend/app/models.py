from sqlalchemy import Column, Integer, String, Date, DateTime, Float, Boolean, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    teacher = "teacher"
    receptionist = "receptionist"


class AgeGroup(str, enum.Enum):
    toddler = "toddler"
    primary = "primary"


class CenterPoint(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"


class StudentStatus(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    graduated = "graduated"
    suspended = "suspended"


class EnrollmentStatus(str, enum.Enum):
    active = "active"
    completed = "completed"
    dropped = "dropped"
    pending = "pending"


class PaymentStatus(str, enum.Enum):
    paid = "paid"
    pending = "pending"
    overdue = "overdue"
    partial = "partial"


class AttendanceStatus(str, enum.Enum):
    present = "present"
    absent = "absent"
    late = "late"
    excused = "excused"


class AnnouncementTarget(str, enum.Enum):
    all = "all"
    parents = "parents"
    staff = "staff"


class PaymentMethod(str, enum.Enum):
    cash = "cash"
    bank_transfer = "bank_transfer"
    online = "online"
    card = "card"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default=UserRole.teacher, nullable=False)
    phone = Column(String(20))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    courses = relationship("Course", back_populates="teacher")
    announcements = relationship("Announcement", back_populates="creator")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    name_en = Column(String(100))
    dob = Column(Date, nullable=False)
    age_group = Column(String(20), nullable=False)
    center_point = Column(String(5), nullable=False)
    enrollment_date = Column(Date, nullable=False)
    status = Column(String(20), default=StudentStatus.active, nullable=False)
    emergency_contact = Column(String(100))
    emergency_phone = Column(String(20))
    parent_name = Column(String(100), nullable=False)
    parent_phone = Column(String(20), nullable=False)
    parent_email = Column(String(100))
    parent_wechat = Column(String(50))
    address = Column(Text)
    notes = Column(Text)
    photo_url = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    enrollments = relationship("Enrollment", back_populates="student")
    attendance_records = relationship("Attendance", back_populates="student")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    name_en = Column(String(100))
    center_point = Column(String(5), nullable=False)
    age_group = Column(String(20), nullable=False)
    description = Column(Text)
    capacity = Column(Integer, default=20)
    fee_monthly = Column(Float, nullable=False)
    schedule_days = Column(String(100))  # e.g. "Monday,Wednesday,Friday"
    schedule_time = Column(String(50))   # e.g. "09:00-10:30"
    duration_weeks = Column(Integer, default=16)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    teacher = relationship("User", back_populates="courses")
    enrollments = relationship("Enrollment", back_populates="course")
    attendance_records = relationship("Attendance", back_populates="course")


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date)
    status = Column(String(20), default=EnrollmentStatus.active, nullable=False)
    payment_status = Column(String(20), default=PaymentStatus.pending, nullable=False)
    fee_paid = Column(Float, default=0.0)
    fee_due = Column(Float, default=0.0)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    student = relationship("Student", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")
    payments = relationship("Payment", back_populates="enrollment")


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String(20), default=AttendanceStatus.present, nullable=False)
    check_in_time = Column(String(10))
    check_out_time = Column(String(10))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    student = relationship("Student", back_populates="attendance_records")
    course = relationship("Course", back_populates="attendance_records")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    enrollment_id = Column(Integer, ForeignKey("enrollments.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_date = Column(Date, nullable=False)
    payment_method = Column(String(30), default=PaymentMethod.cash)
    receipt_number = Column(String(50), unique=True)
    status = Column(String(20), default=PaymentStatus.paid, nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    enrollment = relationship("Enrollment", back_populates="payments")


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    target_audience = Column(String(20), default=AnnouncementTarget.all, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    is_pinned = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    creator = relationship("User", back_populates="announcements")
