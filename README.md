# 未来教育生态 - 教育管理系统

AI赋能教育中心综合管理系统，专为"未来教育生态"设计

## 系统概述

本系统服务于四个教育中心：
- **A区 - 幼教旗舰中心**：2-6岁幼儿教育
- **B区 - AI+托管成长中心**：课后托管与AI辅助学习
- **C区 - 小学补习+AI学习中心**：6-12岁小学生辅导
- **D区 - 兴趣课程/家长学院**：兴趣班与家长培训

## 功能模块

- 仪表盘：数据概览、考勤趋势图、学员分布
- 学生管理：学生档案CRUD、搜索筛选
- 考勤管理：按课程/日期记录出勤，支持批量操作
- 课程管理：课程信息、按中心分组展示
- 缴费管理：收款记录、逾期提醒
- 公告管理：向家长/教职工发布通知

---

## 快速启动

### 前置要求

- Python 3.10+
- Node.js 18+
- npm 或 pnpm

---

### 后端启动

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 初始化数据（首次运行）
python seed.py

# 启动服务（端口 8000）
uvicorn app.main:app --reload --port 8000
```

API文档：http://localhost:8000/docs

---

### 前端启动

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器（端口 3000）
npm run dev
```

访问：http://localhost:3000

---

## 登录账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |
| 教师 | teacher_wang | teacher123 |
| 教师 | teacher_li | teacher123 |
| 前台 | reception | reception123 |

---

## 技术栈

**后端**
- Python FastAPI 0.111
- SQLAlchemy 2.0 + SQLite
- JWT 认证（python-jose）
- Passlib bcrypt 加密

**前端**
- React 18 + TypeScript
- Tailwind CSS 3.4
- TanStack React Query 5
- React Router 6
- Recharts 图表
- Lucide React 图标
- React Hook Form

---

## 项目结构

```
attendance-/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI 应用入口
│   │   ├── database.py      # 数据库连接
│   │   ├── models.py        # SQLAlchemy 模型
│   │   ├── schemas.py       # Pydantic 数据验证
│   │   ├── auth.py          # JWT 认证
│   │   └── routers/
│   │       ├── auth.py
│   │       ├── students.py
│   │       ├── courses.py
│   │       ├── attendance.py
│   │       ├── payments.py
│   │       ├── dashboard.py
│   │       └── announcements.py
│   ├── seed.py              # 测试数据初始化
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts    # Axios 实例
│   │   │   └── endpoints.ts # API 调用函数
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── StatCard.tsx
│   │   │   └── Badge.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Students.tsx
│   │   │   ├── Attendance.tsx
│   │   │   ├── Courses.tsx
│   │   │   ├── Payments.tsx
│   │   │   └── Announcements.tsx
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── docker-compose.yml
└── README.md
```

---

## Docker 部署（可选）

```bash
# 创建 backend/Dockerfile 和 frontend/Dockerfile 后执行：
docker-compose up --build
```

---

## English Setup Guide

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python seed.py          # seed initial data
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000, login with `admin` / `admin123`

---

© 2024 未来教育生态 · Future Education Ecosystem
