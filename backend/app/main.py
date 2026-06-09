from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from . import models
from .auth import get_password_hash
from .routers import auth, students, courses, attendance, payments, dashboard, announcements

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="未来教育生态管理系统",
    description="AI赋能教育中心综合管理系统 API",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(courses.router)
app.include_router(attendance.router)
app.include_router(payments.router)
app.include_router(dashboard.router)
app.include_router(announcements.router)


@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        # Create admin user if not exists
        admin = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin:
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
            db.commit()
            db.refresh(admin)
            print("✓ 管理员账号已创建 (admin/admin123)")
        else:
            print("✓ 管理员账号已存在")
    finally:
        db.close()


@app.get("/")
def root():
    return {
        "message": "未来教育生态管理系统 API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "未来教育生态"}
