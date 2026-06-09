import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import {
  Search, Plus, Filter, Users, Phone, Mail, Edit2,
  Trash2, X, ChevronDown, BookOpen, Loader2, Eye
} from 'lucide-react'
import { format, parseISO, differenceInYears } from 'date-fns'
import { studentsApi, coursesApi } from '../api/endpoints'
import { StudentStatusBadge, CenterBadge, AgeGroupBadge, EnrollmentStatusBadge } from '../components/Badge'
import Modal from '../components/Modal'
import type { Student, StudentCreate, CenterPoint, AgeGroup, StudentStatus } from '../types'
import { CENTER_LABELS, AGE_GROUP_LABELS } from '../types'

type FilterState = {
  search: string
  center_point: string
  age_group: string
  status: string
}

const defaultFilter: FilterState = {
  search: '',
  center_point: '',
  age_group: '',
  status: '',
}

export default function Students() {
  const [filters, setFilters] = useState<FilterState>(defaultFilter)
  const [showFilters, setShowFilters] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editStudent, setEditStudent] = useState<Student | null>(null)
  const [viewStudent, setViewStudent] = useState<number | null>(null)
  const queryClient = useQueryClient()

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students', filters],
    queryFn: () => studentsApi.list({
      search: filters.search || undefined,
      center_point: filters.center_point || undefined,
      age_group: filters.age_group || undefined,
      status: filters.status || undefined,
    }),
  })

  const { data: detailStudent, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['student', viewStudent],
    queryFn: () => studentsApi.get(viewStudent!),
    enabled: viewStudent !== null,
  })

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => coursesApi.list({ is_active: true }),
  })

  const createMutation = useMutation({
    mutationFn: studentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setShowAddModal(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<StudentCreate> }) =>
      studentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      setEditStudent(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: studentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const handleDelete = (student: Student) => {
    if (confirm(`确认要删除学生 "${student.name}" 吗？此操作不可撤销。`)) {
      deleteMutation.mutate(student.id)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">学生管理</h1>
          <p className="text-gray-500 text-sm mt-0.5">共 {students.length} 名学员</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={16} />
          添加学生
        </button>
      </div>

      {/* Search & Filter */}
      <div className="card p-4 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索学生姓名、家长姓名或电话..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="input-field pl-9"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary ${showFilters ? 'bg-gray-100' : ''}`}
          >
            <Filter size={16} />
            筛选
            <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
          {(filters.center_point || filters.age_group || filters.status) && (
            <button
              onClick={() => setFilters(defaultFilter)}
              className="btn-secondary text-red-500"
            >
              <X size={14} /> 清除
            </button>
          )}
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">中心区域</label>
              <select
                value={filters.center_point}
                onChange={e => setFilters(f => ({ ...f, center_point: e.target.value }))}
                className="input-field text-sm"
              >
                <option value="">全部中心</option>
                {(['A', 'B', 'C', 'D'] as CenterPoint[]).map(c => (
                  <option key={c} value={c}>{CENTER_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">年龄组别</label>
              <select
                value={filters.age_group}
                onChange={e => setFilters(f => ({ ...f, age_group: e.target.value }))}
                className="input-field text-sm"
              >
                <option value="">全部年龄</option>
                <option value="toddler">{AGE_GROUP_LABELS.toddler}</option>
                <option value="primary">{AGE_GROUP_LABELS.primary}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">状态</label>
              <select
                value={filters.status}
                onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                className="input-field text-sm"
              >
                <option value="">全部状态</option>
                <option value="active">在读</option>
                <option value="inactive">暂停</option>
                <option value="graduated">已毕业</option>
                <option value="suspended">休学</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Students Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="text-primary-600 animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users size={40} className="mb-3" />
            <p className="font-medium">暂无学生数据</p>
            <p className="text-sm mt-1">点击右上角"添加学生"开始录入</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">姓名</th>
                  <th className="table-header">年龄/组别</th>
                  <th className="table-header">所属中心</th>
                  <th className="table-header hidden md:table-cell">家长信息</th>
                  <th className="table-header hidden lg:table-cell">入学日期</th>
                  <th className="table-header">状态</th>
                  <th className="table-header text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map(student => {
                  const age = differenceInYears(new Date(), parseISO(student.dob))
                  return (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-accent-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">{student.name[0]}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.name}</p>
                            {student.name_en && (
                              <p className="text-xs text-gray-400">{student.name_en}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="space-y-1">
                          <p className="text-sm text-gray-700">{age}岁</p>
                          <AgeGroupBadge ageGroup={student.age_group as AgeGroup} />
                        </div>
                      </td>
                      <td className="table-cell">
                        <CenterBadge center={student.center_point as CenterPoint} showFull />
                      </td>
                      <td className="table-cell hidden md:table-cell">
                        <p className="text-sm text-gray-700">{student.parent_name}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Phone size={10} /> {student.parent_phone}
                        </p>
                      </td>
                      <td className="table-cell hidden lg:table-cell">
                        <p className="text-sm text-gray-600">
                          {format(parseISO(student.enrollment_date), 'yyyy/MM/dd')}
                        </p>
                      </td>
                      <td className="table-cell">
                        <StudentStatusBadge status={student.status as StudentStatus} />
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewStudent(student.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="查看详情"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => setEditStudent(student)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="编辑"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(student)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="删除"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      <StudentFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={(data) => createMutation.mutateAsync(data)}
        isLoading={createMutation.isPending}
        title="添加新学生"
        courses={courses}
      />

      {/* Edit Student Modal */}
      {editStudent && (
        <StudentFormModal
          isOpen={true}
          onClose={() => setEditStudent(null)}
          onSubmit={(data) => updateMutation.mutateAsync({ id: editStudent.id, data })}
          isLoading={updateMutation.isPending}
          title="编辑学生信息"
          defaultValues={editStudent}
          courses={courses}
        />
      )}

      {/* View Student Detail Modal */}
      <Modal
        isOpen={viewStudent !== null}
        onClose={() => setViewStudent(null)}
        title="学生详情"
        size="lg"
      >
        {isLoadingDetail ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="text-primary-600 animate-spin" />
          </div>
        ) : detailStudent ? (
          <StudentDetail student={detailStudent} />
        ) : null}
      </Modal>
    </div>
  )
}

function StudentDetail({ student }: { student: any }) {
  const age = differenceInYears(new Date(), parseISO(student.dob))

  return (
    <div className="space-y-5">
      {/* Basic Info */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-accent-500 rounded-2xl flex items-center justify-center">
          <span className="text-white text-2xl font-bold">{student.name[0]}</span>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-gray-900">{student.name}</h3>
            {student.name_en && <span className="text-gray-400">/ {student.name_en}</span>}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <StudentStatusBadge status={student.status} />
            <CenterBadge center={student.center_point} showFull />
            <AgeGroupBadge ageGroup={student.age_group} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InfoRow label="出生日期" value={`${format(parseISO(student.dob), 'yyyy/MM/dd')} (${age}岁)`} />
        <InfoRow label="入学日期" value={format(parseISO(student.enrollment_date), 'yyyy/MM/dd')} />
        <InfoRow label="家长姓名" value={student.parent_name} />
        <InfoRow label="家长电话" value={student.parent_phone} />
        {student.parent_email && <InfoRow label="家长邮箱" value={student.parent_email} />}
        {student.parent_wechat && <InfoRow label="家长微信" value={student.parent_wechat} />}
        {student.emergency_contact && <InfoRow label="紧急联系人" value={student.emergency_contact} />}
        {student.emergency_phone && <InfoRow label="紧急联系电话" value={student.emergency_phone} />}
      </div>

      {student.notes && (
        <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-100">
          <p className="text-xs font-medium text-yellow-700 mb-1">备注</p>
          <p className="text-sm text-yellow-800">{student.notes}</p>
        </div>
      )}

      {/* Enrollments */}
      {student.enrollments && student.enrollments.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <BookOpen size={16} />
            报名课程 ({student.enrollments.length})
          </h4>
          <div className="space-y-2">
            {student.enrollments.map((e: any) => (
              <div key={e.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-sm text-gray-800">{e.course?.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {e.start_date} 至 {e.end_date || '进行中'}
                  </p>
                </div>
                <div className="text-right">
                  <EnrollmentStatusBadge status={e.status} />
                  <p className="text-xs text-gray-500 mt-1">¥{e.fee_paid}/{e.fee_due}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
    </div>
  )
}

interface StudentFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: StudentCreate) => Promise<any>
  isLoading: boolean
  title: string
  defaultValues?: Partial<Student>
  courses: any[]
}

function StudentFormModal({
  isOpen, onClose, onSubmit, isLoading, title, defaultValues
}: StudentFormModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StudentCreate>({
    defaultValues: defaultValues ? {
      ...defaultValues,
      dob: defaultValues.dob,
      enrollment_date: defaultValues.enrollment_date,
    } : {
      status: 'active',
      age_group: 'toddler',
      center_point: 'A',
      enrollment_date: format(new Date(), 'yyyy-MM-dd'),
    },
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const doSubmit = async (data: StudentCreate) => {
    await onSubmit(data)
    reset()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="lg"
      footer={
        <>
          <button onClick={handleClose} className="btn-secondary" disabled={isLoading}>
            取消
          </button>
          <button
            onClick={handleSubmit(doSubmit)}
            className="btn-primary"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
            {isLoading ? '保存中...' : '保存'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            学生姓名 <span className="text-red-500">*</span>
          </label>
          <input
            {...register('name', { required: '请填写姓名' })}
            className="input-field"
            placeholder="中文姓名"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">英文姓名</label>
          <input {...register('name_en')} className="input-field" placeholder="英文姓名（可选）" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            出生日期 <span className="text-red-500">*</span>
          </label>
          <input
            {...register('dob', { required: '请选择出生日期' })}
            type="date"
            className="input-field"
          />
          {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            入学日期 <span className="text-red-500">*</span>
          </label>
          <input
            {...register('enrollment_date', { required: '请选择入学日期' })}
            type="date"
            className="input-field"
          />
          {errors.enrollment_date && (
            <p className="text-red-500 text-xs mt-1">{errors.enrollment_date.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            年龄组别 <span className="text-red-500">*</span>
          </label>
          <select {...register('age_group', { required: true })} className="input-field">
            <option value="toddler">幼儿班 (2-6岁)</option>
            <option value="primary">小学班 (7-12岁)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            所属中心 <span className="text-red-500">*</span>
          </label>
          <select {...register('center_point', { required: true })} className="input-field">
            {(['A', 'B', 'C', 'D'] as CenterPoint[]).map(c => (
              <option key={c} value={c}>{CENTER_LABELS[c]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            家长姓名 <span className="text-red-500">*</span>
          </label>
          <input
            {...register('parent_name', { required: '请填写家长姓名' })}
            className="input-field"
            placeholder="家长姓名"
          />
          {errors.parent_name && (
            <p className="text-red-500 text-xs mt-1">{errors.parent_name.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            家长电话 <span className="text-red-500">*</span>
          </label>
          <input
            {...register('parent_phone', { required: '请填写家长电话' })}
            className="input-field"
            placeholder="手机号码"
          />
          {errors.parent_phone && (
            <p className="text-red-500 text-xs mt-1">{errors.parent_phone.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">家长邮箱</label>
          <input {...register('parent_email')} type="email" className="input-field" placeholder="邮箱地址（可选）" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">家长微信</label>
          <input {...register('parent_wechat')} className="input-field" placeholder="微信号（可选）" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">紧急联系人</label>
          <input {...register('emergency_contact')} className="input-field" placeholder="紧急联系人姓名" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">紧急联系电话</label>
          <input {...register('emergency_phone')} className="input-field" placeholder="紧急联系电话" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
          <select {...register('status')} className="input-field">
            <option value="active">在读</option>
            <option value="inactive">暂停</option>
            <option value="graduated">已毕业</option>
            <option value="suspended">休学</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
          <input {...register('address')} className="input-field" placeholder="家庭住址（可选）" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea {...register('notes')} className="input-field" rows={2} placeholder="其他备注信息" />
        </div>
      </div>
    </Modal>
  )
}
