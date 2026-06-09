// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'teacher' | 'receptionist'
export type AgeGroup = 'toddler' | 'primary'
export type CenterPoint = 'A' | 'B' | 'C' | 'D'
export type StudentStatus = 'active' | 'inactive' | 'graduated' | 'suspended'
export type EnrollmentStatus = 'active' | 'completed' | 'dropped' | 'pending'
export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'partial'
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'
export type AnnouncementTarget = 'all' | 'parents' | 'staff'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'online' | 'card'

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: UserRole
  phone?: string
  is_active: boolean
  created_at: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

// ─── Student ──────────────────────────────────────────────────────────────────

export interface Student {
  id: number
  name: string
  name_en?: string
  dob: string
  age_group: AgeGroup
  center_point: CenterPoint
  enrollment_date: string
  status: StudentStatus
  emergency_contact?: string
  emergency_phone?: string
  parent_name: string
  parent_phone: string
  parent_email?: string
  parent_wechat?: string
  address?: string
  notes?: string
  created_at: string
  updated_at?: string
}

export interface StudentWithEnrollments extends Student {
  enrollments: Enrollment[]
}

export interface StudentCreate {
  name: string
  name_en?: string
  dob: string
  age_group: AgeGroup
  center_point: CenterPoint
  enrollment_date: string
  status?: StudentStatus
  emergency_contact?: string
  emergency_phone?: string
  parent_name: string
  parent_phone: string
  parent_email?: string
  parent_wechat?: string
  address?: string
  notes?: string
}

// ─── Course ───────────────────────────────────────────────────────────────────

export interface Course {
  id: number
  name: string
  name_en?: string
  center_point: CenterPoint
  age_group: AgeGroup
  description?: string
  capacity: number
  fee_monthly: number
  schedule_days?: string
  schedule_time?: string
  duration_weeks: number
  teacher_id?: number
  is_active: boolean
  created_at: string
  teacher?: User
  enrollment_count?: number
}

export interface CourseCreate {
  name: string
  name_en?: string
  center_point: CenterPoint
  age_group: AgeGroup
  description?: string
  capacity?: number
  fee_monthly: number
  schedule_days?: string
  schedule_time?: string
  duration_weeks?: number
  teacher_id?: number
  is_active?: boolean
}

// ─── Enrollment ───────────────────────────────────────────────────────────────

export interface Enrollment {
  id: number
  student_id: number
  course_id: number
  start_date: string
  end_date?: string
  status: EnrollmentStatus
  payment_status: PaymentStatus
  fee_paid: number
  fee_due: number
  notes?: string
  created_at: string
  student?: Student
  course?: Course
}

export interface EnrollmentCreate {
  student_id: number
  course_id: number
  start_date: string
  end_date?: string
  status?: EnrollmentStatus
  payment_status?: PaymentStatus
  fee_paid?: number
  fee_due?: number
  notes?: string
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export interface Attendance {
  id: number
  student_id: number
  course_id: number
  date: string
  status: AttendanceStatus
  check_in_time?: string
  check_out_time?: string
  notes?: string
  created_at: string
  student?: Student
}

export interface AttendanceBulkItem {
  student_id: number
  status: AttendanceStatus
  check_in_time?: string
  check_out_time?: string
  notes?: string
}

export interface AttendanceBulkCreate {
  course_id: number
  date: string
  records: AttendanceBulkItem[]
}

// ─── Payment ──────────────────────────────────────────────────────────────────

export interface Payment {
  id: number
  enrollment_id: number
  amount: number
  payment_date: string
  payment_method: PaymentMethod
  receipt_number?: string
  status: PaymentStatus
  notes?: string
  created_at: string
  enrollment?: Enrollment
}

export interface PaymentCreate {
  enrollment_id: number
  amount: number
  payment_date: string
  payment_method?: PaymentMethod
  receipt_number?: string
  status?: PaymentStatus
  notes?: string
}

// ─── Announcement ─────────────────────────────────────────────────────────────

export interface Announcement {
  id: number
  title: string
  content: string
  target_audience: AnnouncementTarget
  is_active: boolean
  is_pinned: boolean
  created_by: number
  created_at: string
  updated_at?: string
  creator?: User
}

export interface AnnouncementCreate {
  title: string
  content: string
  target_audience?: AnnouncementTarget
  is_active?: boolean
  is_pinned?: boolean
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_students: number
  active_students: number
  todays_attendance: number
  todays_attendance_rate: number
  active_courses: number
  monthly_revenue: number
  monthly_revenue_target: number
  students_by_center: Record<string, number>
  students_by_age_group: Record<string, number>
}

export interface AttendanceByDay {
  date: string
  present: number
  absent: number
  late: number
  excused: number
  total: number
}

export interface DashboardResponse {
  stats: DashboardStats
  attendance_this_week: AttendanceByDay[]
  recent_announcements: Announcement[]
  recent_enrollments: Enrollment[]
}

// ─── Display Helpers ──────────────────────────────────────────────────────────

export const CENTER_LABELS: Record<CenterPoint, string> = {
  A: 'A区·幼教旗舰',
  B: 'B区·AI托管',
  C: 'C区·小学补习',
  D: 'D区·兴趣课程',
}

export const CENTER_COLORS: Record<CenterPoint, string> = {
  A: 'indigo',
  B: 'purple',
  C: 'green',
  D: 'orange',
}

export const CENTER_BADGE_STYLES: Record<CenterPoint, string> = {
  A: 'bg-indigo-100 text-indigo-700',
  B: 'bg-purple-100 text-purple-700',
  C: 'bg-green-100 text-green-700',
  D: 'bg-orange-100 text-orange-700',
}

export const AGE_GROUP_LABELS: Record<AgeGroup, string> = {
  toddler: '幼儿班 (2-6岁)',
  primary: '小学班 (7-12岁)',
}

export const STATUS_LABELS: Record<StudentStatus, string> = {
  active: '在读',
  inactive: '暂停',
  graduated: '已毕业',
  suspended: '休学',
}

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: '出席',
  absent: '缺席',
  late: '迟到',
  excused: '请假',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: '已缴费',
  pending: '待缴费',
  overdue: '逾期',
  partial: '部分缴费',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: '现金',
  bank_transfer: '银行转账',
  online: '线上支付',
  card: '刷卡',
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: '管理员',
  teacher: '教师',
  receptionist: '前台',
}
