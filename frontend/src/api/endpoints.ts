import apiClient from './client'
import type {
  LoginRequest, TokenResponse, User,
  Student, StudentCreate, StudentWithEnrollments,
  Course, CourseCreate,
  Enrollment, EnrollmentCreate,
  Attendance, AttendanceBulkCreate,
  Payment, PaymentCreate,
  Announcement, AnnouncementCreate,
  DashboardResponse,
} from '../types'

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<TokenResponse>('/api/auth/login', data).then(r => r.data),

  getMe: () =>
    apiClient.get<User>('/api/auth/me').then(r => r.data),

  listUsers: () =>
    apiClient.get<User[]>('/api/auth/users').then(r => r.data),
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardApi = {
  get: () =>
    apiClient.get<DashboardResponse>('/api/dashboard').then(r => r.data),
}

// ─── Students ─────────────────────────────────────────────────────────────────

export const studentsApi = {
  list: (params?: {
    skip?: number
    limit?: number
    search?: string
    center_point?: string
    age_group?: string
    status?: string
  }) =>
    apiClient.get<Student[]>('/api/students', { params }).then(r => r.data),

  get: (id: number) =>
    apiClient.get<StudentWithEnrollments>(`/api/students/${id}`).then(r => r.data),

  create: (data: StudentCreate) =>
    apiClient.post<Student>('/api/students', data).then(r => r.data),

  update: (id: number, data: Partial<StudentCreate>) =>
    apiClient.put<Student>(`/api/students/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete(`/api/students/${id}`),

  enroll: (studentId: number, data: EnrollmentCreate) =>
    apiClient.post<Enrollment>(`/api/students/${studentId}/enroll`, data).then(r => r.data),

  getAttendance: (studentId: number, courseId?: number) =>
    apiClient.get(`/api/students/${studentId}/attendance`, {
      params: courseId ? { course_id: courseId } : {}
    }).then(r => r.data),
}

// ─── Courses ──────────────────────────────────────────────────────────────────

export const coursesApi = {
  list: (params?: {
    center_point?: string
    age_group?: string
    is_active?: boolean
  }) =>
    apiClient.get<Course[]>('/api/courses', { params }).then(r => r.data),

  get: (id: number) =>
    apiClient.get<Course>(`/api/courses/${id}`).then(r => r.data),

  create: (data: CourseCreate) =>
    apiClient.post<Course>('/api/courses', data).then(r => r.data),

  update: (id: number, data: Partial<CourseCreate>) =>
    apiClient.put<Course>(`/api/courses/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete(`/api/courses/${id}`),

  getStudents: (courseId: number) =>
    apiClient.get<Student[]>(`/api/courses/${courseId}/students`).then(r => r.data),

  getEnrollments: (courseId: number) =>
    apiClient.get<Enrollment[]>(`/api/courses/${courseId}/enrollments`).then(r => r.data),
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export const attendanceApi = {
  list: (params?: {
    course_id?: number
    student_id?: number
    attendance_date?: string
    date_from?: string
    date_to?: string
  }) =>
    apiClient.get<Attendance[]>('/api/attendance', { params }).then(r => r.data),

  bulkCreate: (data: AttendanceBulkCreate) =>
    apiClient.post('/api/attendance/bulk', data).then(r => r.data),

  update: (id: number, data: Partial<Attendance>) =>
    apiClient.put<Attendance>(`/api/attendance/${id}`, data).then(r => r.data),

  getWeeklySummary: () =>
    apiClient.get('/api/attendance/summary/weekly').then(r => r.data),
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export const paymentsApi = {
  list: (params?: {
    skip?: number
    limit?: number
    month?: number
    year?: number
    status?: string
    enrollment_id?: number
  }) =>
    apiClient.get<Payment[]>('/api/payments', { params }).then(r => r.data),

  get: (id: number) =>
    apiClient.get<Payment>(`/api/payments/${id}`).then(r => r.data),

  create: (data: PaymentCreate) =>
    apiClient.post<Payment>('/api/payments', data).then(r => r.data),

  update: (id: number, data: Partial<PaymentCreate>) =>
    apiClient.put<Payment>(`/api/payments/${id}`, data).then(r => r.data),

  getSummary: (month?: number, year?: number) =>
    apiClient.get('/api/payments/summary', { params: { month, year } }).then(r => r.data),

  getUnpaidEnrollments: () =>
    apiClient.get<Enrollment[]>('/api/payments/enrollments/unpaid').then(r => r.data),
}

// ─── Announcements ────────────────────────────────────────────────────────────

export const announcementsApi = {
  list: (params?: {
    target_audience?: string
    is_active?: boolean
  }) =>
    apiClient.get<Announcement[]>('/api/announcements', { params }).then(r => r.data),

  get: (id: number) =>
    apiClient.get<Announcement>(`/api/announcements/${id}`).then(r => r.data),

  create: (data: AnnouncementCreate) =>
    apiClient.post<Announcement>('/api/announcements', data).then(r => r.data),

  update: (id: number, data: Partial<AnnouncementCreate>) =>
    apiClient.put<Announcement>(`/api/announcements/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    apiClient.delete(`/api/announcements/${id}`),
}
