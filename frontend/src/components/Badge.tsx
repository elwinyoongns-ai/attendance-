import React from 'react'
import type {
  StudentStatus, AttendanceStatus, PaymentStatus,
  EnrollmentStatus, CenterPoint, AgeGroup, UserRole
} from '../types'
import {
  STATUS_LABELS, ATTENDANCE_STATUS_LABELS, PAYMENT_STATUS_LABELS,
  CENTER_LABELS, AGE_GROUP_LABELS, ROLE_LABELS,
} from '../types'

// ─── Generic Badge ────────────────────────────────────────────────────────────

interface BadgeProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md'
}

export function Badge({ children, className = '', size = 'md' }: BadgeProps) {
  const sizeClass = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-0.5 text-xs font-medium'
  return (
    <span className={`inline-flex items-center rounded-full ${sizeClass} ${className}`}>
      {children}
    </span>
  )
}

// ─── Student Status Badge ─────────────────────────────────────────────────────

const studentStatusStyles: Record<StudentStatus, string> = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  graduated: 'bg-blue-100 text-blue-700',
  suspended: 'bg-red-100 text-red-600',
}

export function StudentStatusBadge({ status }: { status: StudentStatus }) {
  return (
    <Badge className={studentStatusStyles[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}

// ─── Attendance Status Badge ──────────────────────────────────────────────────

const attendanceStatusStyles: Record<AttendanceStatus, string> = {
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-600',
  late: 'bg-yellow-100 text-yellow-700',
  excused: 'bg-blue-100 text-blue-600',
}

export function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  return (
    <Badge className={attendanceStatusStyles[status]}>
      {ATTENDANCE_STATUS_LABELS[status]}
    </Badge>
  )
}

// ─── Payment Status Badge ─────────────────────────────────────────────────────

const paymentStatusStyles: Record<PaymentStatus, string> = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-600',
  partial: 'bg-orange-100 text-orange-700',
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge className={paymentStatusStyles[status]}>
      {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  )
}

// ─── Enrollment Status Badge ──────────────────────────────────────────────────

const enrollmentStatusStyles: Record<EnrollmentStatus, string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  dropped: 'bg-gray-100 text-gray-600',
  pending: 'bg-yellow-100 text-yellow-700',
}

const enrollmentStatusLabels: Record<EnrollmentStatus, string> = {
  active: '在读',
  completed: '已完成',
  dropped: '已退课',
  pending: '待确认',
}

export function EnrollmentStatusBadge({ status }: { status: EnrollmentStatus }) {
  return (
    <Badge className={enrollmentStatusStyles[status]}>
      {enrollmentStatusLabels[status]}
    </Badge>
  )
}

// ─── Center Badge ─────────────────────────────────────────────────────────────

const centerStyles: Record<CenterPoint, string> = {
  A: 'bg-indigo-100 text-indigo-700',
  B: 'bg-purple-100 text-purple-700',
  C: 'bg-green-100 text-green-700',
  D: 'bg-orange-100 text-orange-700',
}

const centerShortLabels: Record<CenterPoint, string> = {
  A: 'A区',
  B: 'B区',
  C: 'C区',
  D: 'D区',
}

export function CenterBadge({ center, showFull = false }: { center: CenterPoint; showFull?: boolean }) {
  return (
    <Badge className={centerStyles[center]}>
      {showFull ? CENTER_LABELS[center] : centerShortLabels[center]}
    </Badge>
  )
}

// ─── Age Group Badge ──────────────────────────────────────────────────────────

const ageGroupStyles: Record<AgeGroup, string> = {
  toddler: 'bg-pink-100 text-pink-700',
  primary: 'bg-cyan-100 text-cyan-700',
}

export function AgeGroupBadge({ ageGroup }: { ageGroup: AgeGroup }) {
  return (
    <Badge className={ageGroupStyles[ageGroup]}>
      {AGE_GROUP_LABELS[ageGroup]}
    </Badge>
  )
}

// ─── Role Badge ───────────────────────────────────────────────────────────────

const roleStyles: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-700',
  teacher: 'bg-blue-100 text-blue-700',
  receptionist: 'bg-teal-100 text-teal-700',
}

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <Badge className={roleStyles[role]}>
      {ROLE_LABELS[role]}
    </Badge>
  )
}
