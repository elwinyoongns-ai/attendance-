import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import {
  Megaphone, Plus, Edit2, Trash2, Pin, Bell,
  Users, BookOpen, Loader2, CheckCircle
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { announcementsApi } from '../api/endpoints'
import Modal from '../components/Modal'
import { useAuth } from '../contexts/AuthContext'
import type { Announcement, AnnouncementCreate, AnnouncementTarget } from '../types'

const TARGET_LABELS: Record<AnnouncementTarget, string> = {
  all: '全部人员',
  parents: '家长',
  staff: '教职工',
}

const TARGET_STYLES: Record<AnnouncementTarget, string> = {
  all: 'bg-gray-100 text-gray-600',
  parents: 'bg-blue-100 text-blue-600',
  staff: 'bg-purple-100 text-purple-600',
}

const TARGET_ICONS: Record<AnnouncementTarget, React.ElementType> = {
  all: Bell,
  parents: Users,
  staff: BookOpen,
}

export default function Announcements() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editAnnouncement, setEditAnnouncement] = useState<Announcement | null>(null)
  const [filterTarget, setFilterTarget] = useState('')
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements', filterTarget],
    queryFn: () => announcementsApi.list({
      target_audience: filterTarget || undefined,
    }),
  })

  const createMutation = useMutation({
    mutationFn: announcementsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setShowAddModal(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AnnouncementCreate> }) =>
      announcementsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      setEditAnnouncement(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: announcementsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const handleDelete = (a: Announcement) => {
    if (confirm(`确认要删除公告 "${a.title}" 吗？`)) {
      deleteMutation.mutate(a.id)
    }
  }

  const handleTogglePin = (a: Announcement) => {
    updateMutation.mutate({ id: a.id, data: { is_pinned: !a.is_pinned } })
  }

  const handleToggleActive = (a: Announcement) => {
    updateMutation.mutate({ id: a.id, data: { is_active: !a.is_active } })
  }

  const canEditAnnouncement = (a: Announcement) => {
    return user?.role === 'admin' || user?.id === a.created_by
  }

  const pinned = announcements.filter((a: Announcement) => a.is_pinned && a.is_active)
  const regular = announcements.filter((a: Announcement) => !a.is_pinned || !a.is_active)

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">公告管理</h1>
          <p className="text-gray-500 text-sm mt-0.5">向家长和教职工发布通知</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={16} />
          发布公告
        </button>
      </div>

      {/* Filter */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600 self-center mr-1">受众：</span>
          {([
            { value: '', label: '全部', icon: Bell },
            { value: 'all', label: '全部人员', icon: Bell },
            { value: 'parents', label: '家长', icon: Users },
            { value: 'staff', label: '教职工', icon: BookOpen },
          ]).map(opt => {
            const Icon = opt.icon
            return (
              <button
                key={opt.value}
                onClick={() => setFilterTarget(opt.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  filterTarget === opt.value
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600'
                }`}
              >
                <Icon size={14} />
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="text-primary-600 animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Megaphone size={40} className="mx-auto mb-3 opacity-40" />
          <p>暂无公告</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pinned */}
          {pinned.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                <Pin size={13} />
                置顶公告
              </h2>
              <div className="space-y-3">
                {pinned.map(a => (
                  <AnnouncementCard
                    key={a.id}
                    announcement={a}
                    canEdit={canEditAnnouncement(a)}
                    onEdit={() => setEditAnnouncement(a)}
                    onDelete={() => handleDelete(a)}
                    onTogglePin={() => handleTogglePin(a)}
                    onToggleActive={() => handleToggleActive(a)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular */}
          {regular.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <h2 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                  <Bell size={13} />
                  其他公告
                </h2>
              )}
              <div className="space-y-3">
                {regular.map(a => (
                  <AnnouncementCard
                    key={a.id}
                    announcement={a}
                    canEdit={canEditAnnouncement(a)}
                    onEdit={() => setEditAnnouncement(a)}
                    onDelete={() => handleDelete(a)}
                    onTogglePin={() => handleTogglePin(a)}
                    onToggleActive={() => handleToggleActive(a)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      <AnnouncementFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={(data) => createMutation.mutateAsync(data)}
        isLoading={createMutation.isPending}
        title="发布公告"
      />

      {/* Edit Modal */}
      {editAnnouncement && (
        <AnnouncementFormModal
          isOpen={true}
          onClose={() => setEditAnnouncement(null)}
          onSubmit={(data) => updateMutation.mutateAsync({ id: editAnnouncement.id, data })}
          isLoading={updateMutation.isPending}
          title="编辑公告"
          defaultValues={editAnnouncement}
        />
      )}
    </div>
  )
}

function AnnouncementCard({
  announcement: a,
  canEdit,
  onEdit,
  onDelete,
  onTogglePin,
  onToggleActive,
}: {
  announcement: Announcement
  canEdit: boolean
  onEdit: () => void
  onDelete: () => void
  onTogglePin: () => void
  onToggleActive: () => void
}) {
  const TargetIcon = TARGET_ICONS[a.target_audience as AnnouncementTarget] || Bell

  return (
    <div className={`card p-5 ${!a.is_active ? 'opacity-60' : ''} ${a.is_pinned ? 'border-l-4 border-l-red-400' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {a.is_pinned && (
              <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                <Pin size={10} />
                置顶
              </span>
            )}
            <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${TARGET_STYLES[a.target_audience as AnnouncementTarget]}`}>
              <TargetIcon size={10} />
              {TARGET_LABELS[a.target_audience as AnnouncementTarget]}
            </span>
            {!a.is_active && (
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">已下线</span>
            )}
          </div>
          <h3 className="font-semibold text-gray-900">{a.title}</h3>
          <p className="text-sm text-gray-600 mt-1.5 line-clamp-3 leading-relaxed">{a.content}</p>
          <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
            <span>发布人：{a.creator?.full_name || '未知'}</span>
            <span>·</span>
            <span>{format(parseISO(a.created_at), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}</span>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onTogglePin}
              className={`p-1.5 rounded-lg transition-colors ${
                a.is_pinned
                  ? 'text-red-500 bg-red-50 hover:bg-red-100'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title={a.is_pinned ? '取消置顶' : '置顶'}
            >
              <Pin size={15} />
            </button>
            <button
              onClick={onToggleActive}
              className={`p-1.5 rounded-lg transition-colors ${
                a.is_active
                  ? 'text-green-500 bg-green-50 hover:bg-green-100'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title={a.is_active ? '下线公告' : '上线公告'}
            >
              <CheckCircle size={15} />
            </button>
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
              title="编辑"
            >
              <Edit2 size={15} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="删除"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface AnnouncementFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AnnouncementCreate) => Promise<any>
  isLoading: boolean
  title: string
  defaultValues?: Partial<Announcement>
}

function AnnouncementFormModal({
  isOpen, onClose, onSubmit, isLoading, title, defaultValues
}: AnnouncementFormModalProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AnnouncementCreate>({
    defaultValues: defaultValues ? {
      title: defaultValues.title,
      content: defaultValues.content,
      target_audience: defaultValues.target_audience ?? 'all',
      is_active: defaultValues.is_active ?? true,
      is_pinned: defaultValues.is_pinned ?? false,
    } : {
      target_audience: 'all',
      is_active: true,
      is_pinned: false,
    }
  })

  const handleClose = () => { reset(); onClose() }
  const doSubmit = async (data: AnnouncementCreate) => { await onSubmit(data); reset() }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="md"
      footer={
        <>
          <button onClick={handleClose} className="btn-secondary" disabled={isLoading}>取消</button>
          <button onClick={handleSubmit(doSubmit)} className="btn-primary" disabled={isLoading}>
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isLoading ? '发布中...' : '发布公告'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            公告标题 <span className="text-red-500">*</span>
          </label>
          <input
            {...register('title', { required: '请填写标题' })}
            className="input-field"
            placeholder="公告标题"
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            公告内容 <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('content', { required: '请填写公告内容' })}
            rows={5}
            className="input-field"
            placeholder="公告详细内容..."
          />
          {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">目标受众</label>
          <select {...register('target_audience')} className="input-field">
            <option value="all">全部人员</option>
            <option value="parents">家长</option>
            <option value="staff">教职工</option>
          </select>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <input
              {...register('is_pinned')}
              type="checkbox"
              id="is_pinned"
              className="w-4 h-4 accent-primary-600"
            />
            <label htmlFor="is_pinned" className="text-sm text-gray-700">置顶公告</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              {...register('is_active')}
              type="checkbox"
              id="is_active"
              className="w-4 h-4 accent-primary-600"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">立即发布</label>
          </div>
        </div>
      </div>
    </Modal>
  )
}
