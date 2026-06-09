import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import {
  CreditCard, Plus, DollarSign, TrendingUp, AlertCircle,
  Clock, CheckCircle, Filter, Loader2, Receipt, X
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { paymentsApi, studentsApi, coursesApi } from '../api/endpoints'
import { PaymentStatusBadge, CenterBadge } from '../components/Badge'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'
import type { Payment, PaymentCreate, PaymentMethod, CenterPoint } from '../types'
import { PAYMENT_METHOD_LABELS } from '../types'

export default function Payments() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1)
  const [filterYear, setFilterYear] = useState(new Date().getFullYear())
  const [filterStatus, setFilterStatus] = useState('')
  const queryClient = useQueryClient()

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['payments', filterMonth, filterYear, filterStatus],
    queryFn: () => paymentsApi.list({
      month: filterMonth || undefined,
      year: filterYear || undefined,
      status: filterStatus || undefined,
    }),
  })

  const { data: summary } = useQuery({
    queryKey: ['payment-summary', filterMonth, filterYear],
    queryFn: () => paymentsApi.getSummary(filterMonth, filterYear),
  })

  const { data: unpaidEnrollments = [] } = useQuery({
    queryKey: ['unpaid-enrollments'],
    queryFn: paymentsApi.getUnpaidEnrollments,
  })

  const createMutation = useMutation({
    mutationFn: paymentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['payment-summary'] })
      queryClient.invalidateQueries({ queryKey: ['unpaid-enrollments'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      setShowAddModal(false)
    },
  })

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(v)

  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1}月` }))
  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">缴费管理</h1>
          <p className="text-gray-500 text-sm mt-0.5">学费收缴与收款记录</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={16} />
          记录收款
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="本月已收"
            value={formatCurrency(summary.monthly_revenue)}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            title="待缴费"
            value={summary.pending_payments}
            subtitle={`共 ${formatCurrency(summary.outstanding)} 未收`}
            icon={Clock}
            color="orange"
          />
          <StatCard
            title="逾期未缴"
            value={summary.overdue_payments}
            icon={AlertCircle}
            color="red"
          />
          <StatCard
            title="本月缴费笔数"
            value={payments.filter((p: Payment) => p.status === 'paid').length}
            icon={Receipt}
            color="indigo"
          />
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Filter size={14} />
            <span>筛选：</span>
          </div>
          <select
            value={filterYear}
            onChange={e => setFilterYear(Number(e.target.value))}
            className="input-field w-auto text-sm py-1.5"
          >
            {years.map(y => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
          <select
            value={filterMonth}
            onChange={e => setFilterMonth(Number(e.target.value))}
            className="input-field w-auto text-sm py-1.5"
          >
            <option value={0}>全部月份</option>
            {months.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="input-field w-auto text-sm py-1.5"
          >
            <option value="">全部状态</option>
            <option value="paid">已缴费</option>
            <option value="pending">待缴费</option>
            <option value="overdue">逾期</option>
          </select>
          {(filterStatus) && (
            <button onClick={() => setFilterStatus('')} className="btn-secondary text-sm py-1.5 text-red-500">
              <X size={14} /> 清除
            </button>
          )}
        </div>
      </div>

      {/* Payments Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="text-primary-600 animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CreditCard size={40} className="mb-3 opacity-40" />
            <p>暂无缴费记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">学生</th>
                  <th className="table-header">课程</th>
                  <th className="table-header">金额</th>
                  <th className="table-header hidden sm:table-cell">缴费方式</th>
                  <th className="table-header hidden md:table-cell">收据编号</th>
                  <th className="table-header">日期</th>
                  <th className="table-header">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((payment: Payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-accent-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">
                            {payment.enrollment?.student?.name?.[0] || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            {payment.enrollment?.student?.name || '-'}
                          </p>
                          {payment.enrollment?.student?.center_point && (
                            <CenterBadge
                              center={payment.enrollment.student.center_point as CenterPoint}
                              showFull={false}
                            />
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <p className="text-sm text-gray-700 max-w-32 truncate">
                        {payment.enrollment?.course?.name || '-'}
                      </p>
                    </td>
                    <td className="table-cell">
                      <span className="text-base font-bold text-green-700">
                        ¥{payment.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="table-cell hidden sm:table-cell">
                      <span className="text-sm text-gray-600">
                        {PAYMENT_METHOD_LABELS[payment.payment_method as PaymentMethod] || payment.payment_method}
                      </span>
                    </td>
                    <td className="table-cell hidden md:table-cell">
                      <span className="text-xs font-mono text-gray-500">
                        {payment.receipt_number || '-'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <p className="text-sm text-gray-600">
                        {format(parseISO(payment.payment_date), 'yyyy/MM/dd')}
                      </p>
                    </td>
                    <td className="table-cell">
                      <PaymentStatusBadge status={payment.status as any} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-right">
              <span className="text-sm text-gray-500">
                共 {payments.length} 条记录 · 合计：
                <span className="font-bold text-green-700 ml-1">
                  ¥{payments.reduce((sum: number, p: Payment) => sum + (p.status === 'paid' ? p.amount : 0), 0).toLocaleString()}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      {showAddModal && (
        <PaymentFormModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={(data) => createMutation.mutateAsync(data)}
          isLoading={createMutation.isPending}
          unpaidEnrollments={unpaidEnrollments}
        />
      )}
    </div>
  )
}

interface PaymentFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PaymentCreate) => Promise<any>
  isLoading: boolean
  unpaidEnrollments: any[]
}

function PaymentFormModal({
  isOpen, onClose, onSubmit, isLoading, unpaidEnrollments
}: PaymentFormModalProps) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<PaymentCreate>({
    defaultValues: {
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      payment_method: 'cash',
      status: 'paid',
    }
  })

  const selectedEnrollmentId = watch('enrollment_id')
  const selectedEnrollment = unpaidEnrollments.find((e: any) => e.id === Number(selectedEnrollmentId))

  const handleClose = () => { reset(); onClose() }
  const doSubmit = async (data: PaymentCreate) => {
    await onSubmit({ ...data, enrollment_id: Number(data.enrollment_id) })
    reset()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="记录收款"
      size="md"
      footer={
        <>
          <button onClick={handleClose} className="btn-secondary" disabled={isLoading}>取消</button>
          <button onClick={handleSubmit(doSubmit)} className="btn-primary" disabled={isLoading}>
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            {isLoading ? '保存中...' : '确认收款'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            选择学员 / 课程 <span className="text-red-500">*</span>
          </label>
          <select
            {...register('enrollment_id', { required: '请选择报名记录' })}
            className="input-field"
          >
            <option value="">-- 选择学员报名记录 --</option>
            {unpaidEnrollments.map((e: any) => (
              <option key={e.id} value={e.id}>
                {e.student?.name} — {e.course?.name} (待缴：¥{(e.fee_due - e.fee_paid).toLocaleString()})
              </option>
            ))}
          </select>
          {errors.enrollment_id && <p className="text-red-500 text-xs mt-1">{errors.enrollment_id.message}</p>}
        </div>

        {selectedEnrollment && (
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-sm">
            <p className="font-medium text-blue-800">{selectedEnrollment.student?.name}</p>
            <p className="text-blue-600">{selectedEnrollment.course?.name}</p>
            <p className="text-blue-500 text-xs mt-1">
              月学费：¥{selectedEnrollment.course?.fee_monthly?.toLocaleString()} ·
              已缴：¥{selectedEnrollment.fee_paid?.toLocaleString()} ·
              待缴：¥{(selectedEnrollment.fee_due - selectedEnrollment.fee_paid).toLocaleString()}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            收款金额 (元) <span className="text-red-500">*</span>
          </label>
          <input
            {...register('amount', { required: '请填写收款金额', valueAsNumber: true })}
            type="number"
            step="100"
            className="input-field"
            placeholder={selectedEnrollment ? String(selectedEnrollment.fee_due - selectedEnrollment.fee_paid) : ''}
          />
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">收款日期</label>
          <input {...register('payment_date')} type="date" className="input-field" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">收款方式</label>
          <select {...register('payment_method')} className="input-field">
            {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">收据备注</label>
          <input {...register('notes')} className="input-field" placeholder="备注信息（可选）" />
        </div>
      </div>
    </Modal>
  )
}
