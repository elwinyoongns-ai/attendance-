from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class Member(db.Model):
    __tablename__ = "members"
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(200))
    phone = db.Column(db.String(30))
    group = db.Column(db.String(100))
    joined_date = db.Column(db.Date, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    attendance_records = db.relationship("Attendance", back_populates="member", lazy="dynamic")

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def attendance_rate(self, limit=10):
        total = self.attendance_records.count()
        if total == 0:
            return 0
        present = self.attendance_records.filter_by(present=True).count()
        return round((present / total) * 100)


class Service(db.Model):
    __tablename__ = "services"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    service_type = db.Column(db.String(100), nullable=False)
    date = db.Column(db.Date, nullable=False)
    notes = db.Column(db.Text)
    attendance_records = db.relationship("Attendance", back_populates="service", lazy="dynamic")

    def present_count(self):
        return self.attendance_records.filter_by(present=True).count()

    def total_count(self):
        return self.attendance_records.count()


class Attendance(db.Model):
    __tablename__ = "attendance"
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey("members.id"), nullable=False)
    service_id = db.Column(db.Integer, db.ForeignKey("services.id"), nullable=False)
    present = db.Column(db.Boolean, default=False)
    notes = db.Column(db.String(300))
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)

    member = db.relationship("Member", back_populates="attendance_records")
    service = db.relationship("Service", back_populates="attendance_records")

    __table_args__ = (
        db.UniqueConstraint("member_id", "service_id", name="uq_member_service"),
    )
