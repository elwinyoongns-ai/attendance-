"""
Seed script for 未来教育生态 management system.
Run with: python seed.py (from the backend directory)
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import date, timedelta
from app.database import engine, Base, SessionLocal
from app import models
from app.auth import get_password_hash

Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # ─── Users ────────────────────────────────────────────────────────────────
    existing_admin = db.query(models.User).filter(models.User.username == "admin").first()
    if not existing_admin:
        admin = models.User(
            username="admin",
            email="admin@future-edu.com",
            full_name="系统管理员",
            hashed_password=get_password_hash("admin123"),
            role=models.UserRole.admin,
            phone="13800138000",
            is_active=True
        )
        db.add(admin)
        db.flush()
        print("✓ 管理员账号创建成功")
    else:
        admin = existing_admin
        print("✓ 管理员账号已存在")

    teacher1 = db.query(models.User).filter(models.User.username == "teacher_wang").first()
    if not teacher1:
        teacher1 = models.User(
            username="teacher_wang",
            email="wang@future-edu.com",
            full_name="王晓梅老师",
            hashed_password=get_password_hash("teacher123"),
            role=models.UserRole.teacher,
            phone="13900139001",
            is_active=True
        )
        db.add(teacher1)
        db.flush()
        print("✓ 王晓梅老师账号创建成功")

    teacher2 = db.query(models.User).filter(models.User.username == "teacher_li").first()
    if not teacher2:
        teacher2 = models.User(
            username="teacher_li",
            email="li@future-edu.com",
            full_name="李建国老师",
            hashed_password=get_password_hash("teacher123"),
            role=models.UserRole.teacher,
            phone="13900139002",
            is_active=True
        )
        db.add(teacher2)
        db.flush()
        print("✓ 李建国老师账号创建成功")

    receptionist = db.query(models.User).filter(models.User.username == "reception").first()
    if not receptionist:
        receptionist = models.User(
            username="reception",
            email="reception@future-edu.com",
            full_name="前台小陈",
            hashed_password=get_password_hash("reception123"),
            role=models.UserRole.receptionist,
            phone="13900139003",
            is_active=True
        )
        db.add(receptionist)
        db.flush()
        print("✓ 前台账号创建成功")

    db.commit()

    # ─── Courses ──────────────────────────────────────────────────────────────
    courses_data = [
        {
            "name": "AI启蒙探索班",
            "name_en": "AI Explorer Toddler",
            "center_point": "A",
            "age_group": "toddler",
            "description": "专为2-4岁幼儿设计的AI趣味启蒙课程，通过游戏化学习培养科技思维",
            "capacity": 12,
            "fee_monthly": 2800.0,
            "schedule_days": "周一,周三,周五",
            "schedule_time": "09:30-10:30",
            "duration_weeks": 16,
            "teacher_id": teacher1.id
        },
        {
            "name": "幼儿感统发展班",
            "name_en": "Sensory Integration",
            "center_point": "A",
            "age_group": "toddler",
            "description": "4-6岁幼儿感统训练，促进大脑发育与身体协调能力",
            "capacity": 10,
            "fee_monthly": 2400.0,
            "schedule_days": "周二,周四",
            "schedule_time": "10:00-11:00",
            "duration_weeks": 16,
            "teacher_id": teacher1.id
        },
        {
            "name": "AI+托管全日班",
            "name_en": "AI Full-Day Care",
            "center_point": "B",
            "age_group": "primary",
            "description": "小学生课后全程托管，AI辅助作业指导+素质拓展活动",
            "capacity": 20,
            "fee_monthly": 3200.0,
            "schedule_days": "周一,周二,周三,周四,周五",
            "schedule_time": "15:30-18:30",
            "duration_weeks": 20,
            "teacher_id": teacher2.id
        },
        {
            "name": "小学数学AI强化班",
            "name_en": "Math AI Enhancement",
            "center_point": "C",
            "age_group": "primary",
            "description": "利用AI自适应学习系统，针对小学1-6年级数学重难点精准辅导",
            "capacity": 15,
            "fee_monthly": 1800.0,
            "schedule_days": "周六,周日",
            "schedule_time": "09:00-11:00",
            "duration_weeks": 16,
            "teacher_id": teacher2.id
        },
        {
            "name": "英语阅读提升班",
            "name_en": "English Reading",
            "center_point": "C",
            "age_group": "primary",
            "description": "AI辅助英语分级阅读，培养语感与阅读理解能力",
            "capacity": 15,
            "fee_monthly": 1600.0,
            "schedule_days": "周六,周日",
            "schedule_time": "14:00-16:00",
            "duration_weeks": 16,
            "teacher_id": teacher1.id
        },
        {
            "name": "儿童创意编程班",
            "name_en": "Creative Coding",
            "center_point": "D",
            "age_group": "primary",
            "description": "Scratch/Python入门，培养逻辑思维与创造力",
            "capacity": 12,
            "fee_monthly": 2200.0,
            "schedule_days": "周六",
            "schedule_time": "10:00-12:00",
            "duration_weeks": 12,
            "teacher_id": teacher2.id
        },
        {
            "name": "家长AI教育工作坊",
            "name_en": "Parent AI Workshop",
            "center_point": "D",
            "age_group": "toddler",
            "description": "面向家长的AI教育理念课程，帮助家长掌握科技育儿方法",
            "capacity": 20,
            "fee_monthly": 800.0,
            "schedule_days": "周六",
            "schedule_time": "19:00-21:00",
            "duration_weeks": 8,
            "teacher_id": admin.id
        },
    ]

    created_courses = []
    for c_data in courses_data:
        existing_course = db.query(models.Course).filter(
            models.Course.name == c_data["name"]
        ).first()
        if not existing_course:
            course = models.Course(**c_data)
            db.add(course)
            db.flush()
            created_courses.append(course)
            print(f"✓ 课程创建: {c_data['name']}")
        else:
            created_courses.append(existing_course)

    db.commit()

    # ─── Students ─────────────────────────────────────────────────────────────
    students_data = [
        {
            "name": "张小明", "name_en": "Zhang Xiaoming",
            "dob": date(2020, 3, 15), "age_group": "toddler", "center_point": "A",
            "enrollment_date": date(2024, 9, 1), "status": "active",
            "parent_name": "张伟", "parent_phone": "13811111111",
            "parent_email": "zhangwei@example.com", "parent_wechat": "zhangwei_wx",
            "emergency_contact": "张奶奶", "emergency_phone": "13811112222",
            "notes": "对机器人很感兴趣"
        },
        {
            "name": "李雨桐", "name_en": "Li Yutong",
            "dob": date(2019, 7, 22), "age_group": "toddler", "center_point": "A",
            "enrollment_date": date(2024, 9, 1), "status": "active",
            "parent_name": "李芳", "parent_phone": "13822222222",
            "parent_email": "lifang@example.com", "parent_wechat": "lifang_wx",
            "emergency_contact": "李外婆", "emergency_phone": "13822223333",
        },
        {
            "name": "王子轩", "name_en": "Wang Zixuan",
            "dob": date(2018, 12, 8), "age_group": "toddler", "center_point": "A",
            "enrollment_date": date(2024, 10, 1), "status": "active",
            "parent_name": "王建国", "parent_phone": "13833333333",
            "parent_email": "wangjg@example.com",
        },
        {
            "name": "陈思彤", "name_en": "Chen Sitong",
            "dob": date(2017, 5, 18), "age_group": "toddler", "center_point": "B",
            "enrollment_date": date(2024, 9, 1), "status": "active",
            "parent_name": "陈丽", "parent_phone": "13844444444",
            "parent_email": "chenli@example.com",
            "notes": "对数学有天赋"
        },
        {
            "name": "刘浩然", "name_en": "Liu Haoran",
            "dob": date(2016, 9, 3), "age_group": "primary", "center_point": "B",
            "enrollment_date": date(2024, 9, 1), "status": "active",
            "parent_name": "刘洋", "parent_phone": "13855555555",
            "parent_email": "liuyang@example.com",
        },
        {
            "name": "赵心悦", "name_en": "Zhao Xinyue",
            "dob": date(2015, 4, 27), "age_group": "primary", "center_point": "C",
            "enrollment_date": date(2024, 9, 1), "status": "active",
            "parent_name": "赵明", "parent_phone": "13866666666",
            "parent_email": "zhaoming@example.com",
            "notes": "英语基础较弱，需重点关注"
        },
        {
            "name": "孙梓豪", "name_en": "Sun Zihao",
            "dob": date(2014, 11, 14), "age_group": "primary", "center_point": "C",
            "enrollment_date": date(2024, 9, 1), "status": "active",
            "parent_name": "孙华", "parent_phone": "13877777777",
            "parent_email": "sunhua@example.com",
        },
        {
            "name": "周诗雨", "name_en": "Zhou Shiyu",
            "dob": date(2013, 8, 6), "age_group": "primary", "center_point": "C",
            "enrollment_date": date(2024, 9, 1), "status": "active",
            "parent_name": "周军", "parent_phone": "13888888888",
            "parent_email": "zhoujun@example.com",
        },
        {
            "name": "吴佳琦", "name_en": "Wu Jiaqi",
            "dob": date(2015, 2, 19), "age_group": "primary", "center_point": "D",
            "enrollment_date": date(2024, 10, 1), "status": "active",
            "parent_name": "吴刚", "parent_phone": "13899999999",
            "parent_email": "wugang@example.com",
        },
        {
            "name": "郑宇航", "name_en": "Zheng Yuhang",
            "dob": date(2016, 6, 30), "age_group": "primary", "center_point": "D",
            "enrollment_date": date(2024, 11, 1), "status": "active",
            "parent_name": "郑磊", "parent_phone": "13900000001",
            "parent_email": "zhenglei@example.com",
        },
        {
            "name": "林小妍", "name_en": "Lin Xiaoyan",
            "dob": date(2019, 1, 11), "age_group": "toddler", "center_point": "A",
            "enrollment_date": date(2024, 9, 1), "status": "inactive",
            "parent_name": "林静", "parent_phone": "13900000002",
            "parent_email": "linjing@example.com",
            "notes": "因家庭原因暂停上课"
        },
        {
            "name": "何天乐", "name_en": "He Tianle",
            "dob": date(2014, 7, 25), "age_group": "primary", "center_point": "C",
            "enrollment_date": date(2024, 9, 1), "status": "active",
            "parent_name": "何平", "parent_phone": "13900000003",
            "parent_email": "heping@example.com",
        },
    ]

    created_students = []
    for s_data in students_data:
        existing_student = db.query(models.Student).filter(
            models.Student.name == s_data["name"],
            models.Student.parent_phone == s_data["parent_phone"]
        ).first()
        if not existing_student:
            student = models.Student(**s_data)
            db.add(student)
            db.flush()
            created_students.append(student)
            print(f"✓ 学生创建: {s_data['name']}")
        else:
            created_students.append(existing_student)

    db.commit()

    # ─── Enrollments ─────────────────────────────────────────────────────────
    def get_course_by_name(name):
        return db.query(models.Course).filter(models.Course.name == name).first()

    def get_student_by_name(name):
        return db.query(models.Student).filter(models.Student.name == name).first()

    enrollment_pairs = [
        ("张小明", "AI启蒙探索班"),
        ("李雨桐", "AI启蒙探索班"),
        ("王子轩", "幼儿感统发展班"),
        ("陈思彤", "AI+托管全日班"),
        ("刘浩然", "AI+托管全日班"),
        ("赵心悦", "小学数学AI强化班"),
        ("赵心悦", "英语阅读提升班"),
        ("孙梓豪", "小学数学AI强化班"),
        ("周诗雨", "英语阅读提升班"),
        ("吴佳琦", "儿童创意编程班"),
        ("郑宇航", "儿童创意编程班"),
        ("何天乐", "小学数学AI强化班"),
        ("何天乐", "英语阅读提升班"),
    ]

    created_enrollments = []
    for student_name, course_name in enrollment_pairs:
        student = get_student_by_name(student_name)
        course = get_course_by_name(course_name)
        if not student or not course:
            continue
        existing = db.query(models.Enrollment).filter(
            models.Enrollment.student_id == student.id,
            models.Enrollment.course_id == course.id,
            models.Enrollment.status == models.EnrollmentStatus.active
        ).first()
        if not existing:
            enrollment = models.Enrollment(
                student_id=student.id,
                course_id=course.id,
                start_date=date(2024, 9, 1),
                end_date=date(2025, 6, 30),
                status=models.EnrollmentStatus.active,
                payment_status=models.PaymentStatus.paid,
                fee_due=course.fee_monthly,
                fee_paid=course.fee_monthly,
            )
            db.add(enrollment)
            db.flush()
            created_enrollments.append(enrollment)
            print(f"✓ 报名: {student_name} -> {course_name}")
        else:
            created_enrollments.append(existing)

    db.commit()

    # ─── Payments ─────────────────────────────────────────────────────────────
    from datetime import datetime
    today = date.today()
    import uuid

    for enrollment in created_enrollments:
        existing_payment = db.query(models.Payment).filter(
            models.Payment.enrollment_id == enrollment.id
        ).first()
        if not existing_payment:
            payment = models.Payment(
                enrollment_id=enrollment.id,
                amount=enrollment.fee_due,
                payment_date=today,
                payment_method=models.PaymentMethod.bank_transfer,
                receipt_number=f"RCP-{today.strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}",
                status=models.PaymentStatus.paid,
                notes="月缴费"
            )
            db.add(payment)

    db.commit()
    print(f"✓ 缴费记录创建完成")

    # ─── Attendance Records ────────────────────────────────────────────────────
    # Create attendance for the past 14 days
    import random
    random.seed(42)

    for enrollment in created_enrollments:
        student = db.query(models.Student).filter(
            models.Student.id == enrollment.student_id
        ).first()
        for days_ago in range(14, 0, -1):
            attendance_date = today - timedelta(days=days_ago)
            # Skip weekends for most courses
            if attendance_date.weekday() >= 5:
                continue
            existing_att = db.query(models.Attendance).filter(
                models.Attendance.student_id == enrollment.student_id,
                models.Attendance.course_id == enrollment.course_id,
                models.Attendance.date == attendance_date
            ).first()
            if not existing_att:
                roll = random.random()
                if roll < 0.80:
                    att_status = models.AttendanceStatus.present
                    check_in = "08:55"
                elif roll < 0.88:
                    att_status = models.AttendanceStatus.late
                    check_in = "09:15"
                elif roll < 0.94:
                    att_status = models.AttendanceStatus.absent
                    check_in = None
                else:
                    att_status = models.AttendanceStatus.excused
                    check_in = None

                att = models.Attendance(
                    student_id=enrollment.student_id,
                    course_id=enrollment.course_id,
                    date=attendance_date,
                    status=att_status,
                    check_in_time=check_in,
                    check_out_time="17:30" if att_status in [
                        models.AttendanceStatus.present, models.AttendanceStatus.late
                    ] else None,
                )
                db.add(att)

    db.commit()
    print("✓ 考勤记录创建完成")

    # ─── Announcements ────────────────────────────────────────────────────────
    announcements_data = [
        {
            "title": "2024年秋季学期开学通知",
            "content": "亲爱的家长朋友们，未来教育生态2024年秋季学期将于9月2日正式开课。请家长们提前做好准备，确保孩子按时入学。如有任何疑问，请联系前台咨询。",
            "target_audience": "parents",
            "is_active": True,
            "is_pinned": True,
            "created_by": admin.id
        },
        {
            "title": "AI学习系统升级公告",
            "content": "我们的AI自适应学习系统将于本周六（9月7日）进行系统升级维护，届时系统将暂停服务4小时（上午10:00-14:00）。升级后将带来更流畅的学习体验和更精准的个性化推荐。",
            "target_audience": "all",
            "is_active": True,
            "is_pinned": False,
            "created_by": admin.id
        },
        {
            "title": "10月假期托管报名开始",
            "content": "国庆假期（10月1日-7日）全日托管班现已开始报名，名额有限，先报先得。托管内容包括：AI学习、户外活动、艺术创作等丰富课程。",
            "target_audience": "parents",
            "is_active": True,
            "is_pinned": False,
            "created_by": admin.id
        },
        {
            "title": "教师培训通知",
            "content": "本月26日（周六）下午2点，将在中心会议室举行AI教学工具培训，请全体教师准时参加。培训内容包括：最新AI辅助教学软件操作、个性化教学方案制定。",
            "target_audience": "staff",
            "is_active": True,
            "is_pinned": False,
            "created_by": admin.id
        },
        {
            "title": "家长开放日活动邀请",
            "content": "诚邀各位家长参加本月末的家长开放日活动！届时，孩子们将展示一个月来的学习成果，同时老师们也将与家长一对一交流孩子的学习情况。请提前预约席位。",
            "target_audience": "parents",
            "is_active": True,
            "is_pinned": False,
            "created_by": admin.id
        },
    ]

    for a_data in announcements_data:
        existing = db.query(models.Announcement).filter(
            models.Announcement.title == a_data["title"]
        ).first()
        if not existing:
            announcement = models.Announcement(**a_data)
            db.add(announcement)
            print(f"✓ 公告创建: {a_data['title'][:20]}...")

    db.commit()
    print("\n========================================")
    print("✅ 数据初始化完成！")
    print("========================================")
    print("登录信息:")
    print("  管理员: admin / admin123")
    print("  教师:   teacher_wang / teacher123")
    print("  教师:   teacher_li / teacher123")
    print("  前台:   reception / reception123")
    print("========================================")

except Exception as e:
    print(f"❌ 错误: {e}")
    db.rollback()
    raise
finally:
    db.close()
