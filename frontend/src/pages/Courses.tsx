import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import {
  BookOpen, Plus, Users, Clock, DollarSign,
  Edit2, Trash2, Loader2, Building2, GraduationCap
} from 'lucide-react'
import { coursesApi, authApi } from '../api/endpoints'
import { CenterBadge, AgeGroupBadge } from '../components/Badge'
import Modal from '../components/Modal'
import type { Course, CourseCreate, CenterPoint, AgeGroup } from '../types'
import { CENTER_LABELS, AGE_GROUP_LABELS } from '../types'

const CENTER_HEADER_STYLES: Record<CenterPoint, string> = {
  A: 'bg-indigo-600',
  B: 'bg-purple-600',
  C: 'bg-green-600',
  D: 'bg-orange-600',
}

const CENTER_CARD_STYLES: Record<CenterPoint, string> = {
  A: 'border-l-4 border-l-indigo-500',
  B: 'border-l-4 border-l-purple-500',
  C: 'border-l-4 border-l-green-500',
  D: 'border-l-4 border-l-orange-500',
}

export default function Courses() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editCourse, setEditCourse] = useState<Course | null>(null)
  const queryClient = useQueryClient()

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesApi.list(),
  })

  const { data: teachers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: authApi.listUsers,
  })

  const createMutation = useMutation({
    mutationFn: coursesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      setShowAddModal(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CourseCreate> }) =>
      coursesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      setEditCourse(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: coursesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
  })

  const handleDelete = (course: Course) => {
    if (confirm(`确认要停用课程 "${course.name}" 吗？`)) {
      deleteMutation.mutate(course.id)
    }
  }

  // Group courses by center
  const coursesByCenter: Record<string, Course[]> = { A: [], B: [], C: [], D: [] }
  courses.forEach((course: Course) => {
    if (coursesByCenter[course.center_point]) {
      coursesByCenter[course.center_point].push(course)
    }
  })

  const centerDescriptions: Record<CenterPoint, string> = {
    A: '幼教旗舰中心 · 2-6岁',
    B: 'AI+托管成长中心',
    C: '小学补习+AI学习中心 · 6-12岁',
    D: '兴趣课程/家长学院',
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">课程管理</h1>
          <p className="text-gray-500 text-sm mt-0.5">共 {courses.filter((c: Course) => c.is_active).length} 门活跃课程</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={16} />
          新建课程
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="text-primary-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {(['A', 'B', 'C', 'D'] as CenterPoint[]).map(center => {
            const centerCourses = coursesByCenter[center] || []
            return (
              <div key={center} className="card overflow-hidden">
                {/* Center Header */}
                <div className={`px-6 py-4 ${CENTER_HEADER_STYLES[center]} text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <Building2 size={16} className="text-white" />
                      </div>
                      <div>
                        <h2 className="font-bold text-base">{CENTER_LABELS[center]}</h2>
                        <p className="text-white/70 text-xs">{centerDescriptions[center]}</p>
                      </div>
                    </div>
                    <span className="text-white/80 text-sm">{centerCourses.length} 门课程</span>
                  </div>
                </div>

                {/* Courses Grid */}
                {centerCourses.length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <BookOpen size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">该中心暂无课程</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
                    {centerCourses.map((course, idx) => (
                      <div
                        key={course.id}
                        className={`p-5 border-b border-r border-gray-100 ${CENTER_CARD_STYLES[center]} ${
                          !course.is_active ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">{course.name}</h3>
                            {course.name_en && (
                              <p className="text-xs text-gray-400 mt-0.5">{course.name_en}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                            <button
                              onClick={() => setEditCourse(course)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(course)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        <AgeGroupBadge ageGroup={course.age_group as AgeGroup} />

                        {course.description && (
                          <p className="text-xs text-gray-500 mt-2 line-clamp-2">{course.description}</p>
                        )}

                        <div className="mt-3 space-y-1.5">
                          {course.schedule_days && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Clock size={12} className="text-gray-400" />
                              <span>{course.schedule_days}</span>
                              {course.schedule_time && <span>· {course.schedule_time}</span>}
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-gray-600">
                              <Users size={12} className="text-gray-400" />
                              <span>{course.enrollment_count || 0}/{course.capacity} 人</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm font-semibold text-primary-700">
                              <DollarSign size={13} />
                              <span>¥{course.fee_monthly.toLocaleString()}/月</span>
                            </div>
                          </div>
                        </div>

                        {course.teacher && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                            <GraduationCap size={12} />
                            <span>{course.teacher.full_name}</span>
                          </div>
                        )}

                        {/* Capacity Bar */}
                        {course.capacity > 0 && (
                          <div className="mt-2.5">
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  (course.enrollment_count || 0) / course.capacity > 0.9
                                    ? 'bg-red-500'
                                    : (course.enrollment_count || 0) / course.capacity > 0.7
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                }`}
                                style={{
                                  width: `${Math.min(100, ((course.enrollment_count || 0) / course.capacity) * 100)}%`
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add Modal */}
      <CourseFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={(data) => createMutation.mutateAsync(data)}
        isLoading={createMutation.isPending}
        title="新建课程"
        teachers={teachers}
      />

      {/* Edit Modal */}
      {editCourse && (
        <CourseFormModal
          isOpen={true}
          onClose={() => setEditCourse(null)}
          onSubmit={(data) => updateMutation.mutateAsync({ id: editCourse.id, data })}
          isLoading={updateMutation.isPending}
          title="编辑课程"
          defaultValues={editCourse}
          teachers={teachers}
        />
      )}
    </div>
  )
}

interface CourseFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CourseCreate) => Promise<any>
  isLoading: boolean
  title: string
  defaultValues?: Partial<Course>
  teachers: any[]
}

function CourseFormModal({
  isOpen, onClose, onSubmit, isLoading, title, defaultValues, teachers
}: CourseFormModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CourseCreate>({
    defaultValues: defaultValues ? {
      name: defaultValues.name,
      name_en: defaultValues.name_en,
      center_point: defaultValues.center_point,
      age_group: defaultValues.age_group,
      description: defaultValues.description,
      capacity: defaultValues.capacity ?? 20,
      fee_monthly: defaultValues.fee_monthly,
      schedule_days: defaultValues.schedule_days,
      schedule_time: defaultValues.schedule_time,
      duration_weeks: defaultValues.duration_weeks ?? 16,
      teacher_id: defaultValues.teacher_id,
      is_active: defaultValues.is_active ?? true,
    } : {
      center_point: 'A',
      age_group: 'toddler',
      capacity: 20,
      duration_weeks: 16,
      is_active: true,
    }
  })

  const handleClose = () => { reset(); onClose() }
  const doSubmit = async (data: CourseCreate) => { await onSubmit(data); reset() }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="lg"
      footer={
        <>
          <button onClick={handleClose} className="btn-secondary" disabled={isLoading}>取消</button>
          <button onClick={handleSubmit(doSubmit)} className="btn-primary" disabled={isLoading}>
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isLoading ? '保存中...' : '保存'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            课程名称 <span className="text-red-500">*</span>
          </label>
          <input {...register('name', { required: '请填写课程名称' })} className="input-field" placeholder="课程名称" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">英文名称</label>
          <input {...register('name_en')} className="input-field" placeholder="英文名称（可选）" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">所属中心 <span className="text-red-500">*</span></label>
          <select {...register('center_point', { required: true })} className="input-field">
            {(['A', 'B', 'C', 'D'] as CenterPoint[]).map(c => (
              <option key={c} value={c}>{CENTER_LABELS[c]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">年龄组别 <span className="text-red-500">*</span></label>
          <select {...register('age_group', { required: true })} className="input-field">
            <option value="toddler">幼儿班 (2-6岁)</option>
            <option value="primary">小学班 (7-12岁)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">月学费 (元) <span className="text-red-500">*</span></label>
          <input
            {...register('fee_monthly', { required: '请填写月学费', valueAsNumber: true })}
            type="number"
            step="100"
            className="input-field"
            placeholder="2000"
          />
          {errors.fee_monthly && <p className="text-red-500 text-xs mt-1">{errors.fee_monthly.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">课程容量</label>
          <input {...register('capacity', { valueAsNumber: true })} type="number" className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">授课教师</label>
          <select {...register('teacher_id', { setValueAs: v => v ? Number(v) : undefined })} className="input-field">
            <option value="">-- 暂未分配 --</option>
            {teachers.map((t: any) => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">上课时间</label>
          <input {...register('schedule_days')} className="input-field" placeholder="周一,周三,周五" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">课程时段</label>
          <input {...register('schedule_time')} className="input-field" placeholder="09:00-10:30" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">课程周数</label>
          <input {...register('duration_weeks', { valueAsNumber: true })} type="number" className="input-field" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">课程介绍</label>
          <textarea {...register('description')} className="input-field" rows={3} placeholder="课程简介..." />
        </div>
        <div className="flex items-center gap-2">
          <input {...register('is_active')} type="checkbox" id="is_active" className="w-4 h-4 accent-primary-600" />
          <label htmlFor="is_active" className="text-sm text-gray-700">课程开放中</label>
        </div>
      </div>
    </Modal>
  )
}
