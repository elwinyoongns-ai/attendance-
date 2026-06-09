import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CalendarCheck, CheckCircle2, XCircle, Clock, BookOpen,
  Users, Save, CheckCheck, Loader2, ChevronLeft, ChevronRight
} from 'lucide-react'
import { format, parseISO, addDays, subDays } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { coursesApi, attendanceApi } from '../api/endpoints'
import { CenterBadge } from '../components/Badge'
import type { AttendanceStatus, CenterPoint, Course, Student } from '../types'
import { ATTENDANCE_STATUS_LABELS } from '../types'

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  present: 'bg-green-100 text-green-700 border-green-300',
  absent: 'bg-red-100 text-red-600 border-red-300',
  late: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  excused: 'bg-blue-100 text-blue-600 border-blue-300',
}

const STATUS_ICONS: Record<AttendanceStatus, React.ElementType> = {
  present: CheckCircle2,
  absent: XCircle,
  late: Clock,
  excused: BookOpen,
}

type AttendanceMap = Record<number, AttendanceStatus>

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [attendanceMap, setAttendanceMap] = useState<AttendanceMap>({})
  const [isSaved, setIsSaved] = useState(false)
  const queryClient = useQueryClient()

  const { data: courses = [] } = useQuery({
    queryKey: ['courses', 'active'],
    queryFn: () => coursesApi.list({ is_active: true }),
  })

  const { data: courseStudents = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['course-students', selectedCourseId],
    queryFn: () => coursesApi.getStudents(selectedCourseId!),
    enabled: !!selectedCourseId,
  })

  const { data: existingAttendance = [] } = useQuery({
    queryKey: ['attendance', selectedCourseId, selectedDate],
    queryFn: () => attendanceApi.list({
      course_id: selectedCourseId!,
      attendance_date: selectedDate,
    }),
    enabled: !!selectedCourseId,
  })

  // Init attendance map from existing records or default to 'present'
  useEffect(() => {
    if (courseStudents.length > 0) {
      const newMap: AttendanceMap = {}
      courseStudents.forEach((student: Student) => {
        const existing = existingAttendance.find((a: any) => a.student_id === student.id)
        newMap[student.id] = existing ? existing.status as AttendanceStatus : 'present'
      })
      setAttendanceMap(newMap)
      setIsSaved(false)
    }
  }, [courseStudents, existingAttendance])

  const bulkMutation = useMutation({
    mutationFn: attendanceApi.bulkCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    },
  })

  const handleStatusToggle = (studentId: number) => {
    const order: AttendanceStatus[] = ['present', 'late', 'absent', 'excused']
    const current = attendanceMap[studentId] || 'present'
    const nextIndex = (order.indexOf(current) + 1) % order.length
    setAttendanceMap(prev => ({ ...prev, [studentId]: order[nextIndex] }))
    setIsSaved(false)
  }

  const handleMarkAll = (status: AttendanceStatus) => {
    const newMap: AttendanceMap = {}
    courseStudents.forEach((student: Student) => {
      newMap[student.id] = status
    })
    setAttendanceMap(newMap)
    setIsSaved(false)
  }

  const handleSave = () => {
    if (!selectedCourseId || courseStudents.length === 0) return
    const records = courseStudents.map((student: Student) => ({
      student_id: student.id,
      status: attendanceMap[student.id] || 'present',
    }))
    bulkMutation.mutate({
      course_id: selectedCourseId,
      date: selectedDate,
      records,
    })
  }

  const selectedCourse = courses.find((c: Course) => c.id === selectedCourseId)

  const stats = {
    present: Object.values(attendanceMap).filter(s => s === 'present').length,
    late: Object.values(attendanceMap).filter(s => s === 'late').length,
    absent: Object.values(attendanceMap).filter(s => s === 'absent').length,
    excused: Object.values(attendanceMap).filter(s => s === 'excused').length,
    total: courseStudents.length,
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">考勤管理</h1>
        <p className="text-gray-500 text-sm mt-0.5">记录和管理学生每日出勤情况</p>
      </div>

      {/* Controls */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <CalendarCheck size={14} className="inline mr-1.5" />
              选择日期
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedDate(format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'))}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600"
              >
                <ChevronLeft size={16} />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="input-field flex-1"
              />
              <button
                onClick={() => setSelectedDate(format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'))}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {format(parseISO(selectedDate), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
            </p>
          </div>

          {/* Course Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <BookOpen size={14} className="inline mr-1.5" />
              选择课程
            </label>
            <select
              value={selectedCourseId || ''}
              onChange={e => setSelectedCourseId(Number(e.target.value) || null)}
              className="input-field"
            >
              <option value="">-- 请选择课程 --</option>
              {courses.map((course: Course) => (
                <option key={course.id} value={course.id}>
                  [{course.center_point}区] {course.name}
                </option>
              ))}
            </select>
            {selectedCourse && (
              <p className="text-xs text-gray-400 mt-1">
                {selectedCourse.schedule_days} · {selectedCourse.schedule_time} · 容量 {selectedCourse.capacity}人
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Attendance Content */}
      {!selectedCourseId ? (
        <div className="card p-12 text-center text-gray-400">
          <CalendarCheck size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">请选择课程开始记录考勤</p>
        </div>
      ) : isLoadingStudents ? (
        <div className="card p-12 flex items-center justify-center">
          <Loader2 size={24} className="text-primary-600 animate-spin" />
        </div>
      ) : courseStudents.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-40" />
          <p>该课程暂无报名学生</p>
        </div>
      ) : (
        <>
          {/* Stats & Actions */}
          <div className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Stats */}
              <div className="flex items-center gap-4">
                <StatPill icon={CheckCircle2} label="出席" count={stats.present} color="green" />
                <StatPill icon={Clock} label="迟到" count={stats.late} color="yellow" />
                <StatPill icon={XCircle} label="缺席" count={stats.absent} color="red" />
                <StatPill icon={BookOpen} label="请假" count={stats.excused} color="blue" />
                <span className="text-sm text-gray-500">共 {stats.total} 人</span>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleMarkAll('present')}
                  className="btn-secondary text-sm py-1.5 text-green-700"
                >
                  <CheckCheck size={15} />
                  全部出席
                </button>
                <button
                  onClick={handleSave}
                  disabled={bulkMutation.isPending}
                  className={`btn-primary text-sm py-1.5 ${isSaved ? 'bg-green-600 hover:bg-green-700' : ''}`}
                >
                  {bulkMutation.isPending ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : isSaved ? (
                    <CheckCircle2 size={15} />
                  ) : (
                    <Save size={15} />
                  )}
                  {bulkMutation.isPending ? '保存中...' : isSaved ? '已保存' : '保存考勤'}
                </button>
              </div>
            </div>
            {stats.total > 0 && (
              <div className="mt-3">
                <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                  {stats.present > 0 && (
                    <div className="bg-green-500 transition-all" style={{ width: `${(stats.present / stats.total) * 100}%` }} />
                  )}
                  {stats.late > 0 && (
                    <div className="bg-yellow-400 transition-all" style={{ width: `${(stats.late / stats.total) * 100}%` }} />
                  )}
                  {stats.absent > 0 && (
                    <div className="bg-red-500 transition-all" style={{ width: `${(stats.absent / stats.total) * 100}%` }} />
                  )}
                  {stats.excused > 0 && (
                    <div className="bg-blue-400 transition-all" style={{ width: `${(stats.excused / stats.total) * 100}%` }} />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  出勤率 {stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0}%
                </p>
              </div>
            )}
          </div>

          {/* Student List */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedCourse && <CenterBadge center={selectedCourse.center_point as CenterPoint} />}
                <span className="font-medium text-gray-800 text-sm">{selectedCourse?.name}</span>
              </div>
              <span className="text-xs text-gray-500">点击状态按钮切换</span>
            </div>
            <div className="divide-y divide-gray-50">
              {courseStudents.map((student: Student, index: number) => {
                const status = attendanceMap[student.id] || 'present'
                const StatusIcon = STATUS_ICONS[status]
                return (
                  <div
                    key={student.id}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm text-gray-400 w-6 text-center">{index + 1}</span>
                    <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-accent-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">{student.name[0]}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{student.name}</p>
                      {student.name_en && (
                        <p className="text-xs text-gray-400">{student.name_en}</p>
                      )}
                    </div>
                    {/* Status Toggle Buttons */}
                    <div className="flex items-center gap-1.5">
                      {(['present', 'late', 'absent', 'excused'] as AttendanceStatus[]).map(s => {
                        const Icon = STATUS_ICONS[s]
                        const isSelected = status === s
                        return (
                          <button
                            key={s}
                            onClick={() => setAttendanceMap(prev => ({ ...prev, [student.id]: s }))}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                              isSelected
                                ? STATUS_STYLES[s]
                                : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                            }`}
                          >
                            <Icon size={13} />
                            <span className="hidden sm:inline">{ATTENDANCE_STATUS_LABELS[s]}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function StatPill({
  icon: Icon, label, count, color
}: {
  icon: React.ElementType
  label: string
  count: number
  color: string
}) {
  const colorClasses: Record<string, string> = {
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    blue: 'text-blue-600',
  }
  return (
    <div className={`flex items-center gap-1.5 ${colorClasses[color] || ''}`}>
      <Icon size={16} />
      <span className="text-sm font-semibold">{count}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}
