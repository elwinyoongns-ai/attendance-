import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts'
import {
  Users, CalendarCheck, BookOpen, DollarSign,
  TrendingUp, Bell, UserPlus, Loader2
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { dashboardApi } from '../api/endpoints'
import StatCard from '../components/StatCard'
import { CenterBadge } from '../components/Badge'
import type { CenterPoint } from '../types'

const CENTER_COLORS_HEX: Record<string, string> = {
  A: '#4f46e5',
  B: '#9333ea',
  C: '#16a34a',
  D: '#ea580c',
}

const CENTER_NAMES: Record<string, string> = {
  A: 'A区·幼教',
  B: 'B区·托管',
  C: 'C区·补习',
  D: 'D区·兴趣',
}

const WEEKDAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.get,
    refetchInterval: 60000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="text-primary-600 animate-spin" />
          <p className="text-gray-500">加载数据中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card p-6 text-center text-red-500">
        <p>数据加载失败，请检查后端服务是否运行</p>
        <p className="text-sm mt-1 text-gray-400">确保后端运行在 http://localhost:8000</p>
      </div>
    )
  }

  const stats = data?.stats
  const attendanceWeek = data?.attendance_this_week || []
  const recentAnnouncements = data?.recent_announcements || []
  const recentEnrollments = data?.recent_enrollments || []

  // Format attendance week data
  const chartData = attendanceWeek.map((d, i) => ({
    name: WEEKDAY_NAMES[i] || d.date,
    出席: d.present,
    缺席: d.absent,
    迟到: d.late,
    请假: d.excused,
  }))

  // Students by center
  const centerPieData = Object.entries(stats?.students_by_center || {}).map(([k, v]) => ({
    name: CENTER_NAMES[k] || k,
    value: v as number,
    color: CENTER_COLORS_HEX[k] || '#94a3b8',
    key: k,
  }))

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(v)

  const revenuePercent = stats
    ? Math.min(100, Math.round((stats.monthly_revenue / stats.monthly_revenue_target) * 100))
    : 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">数据总览</h1>
        <p className="text-gray-500 text-sm mt-1">
          {format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: zhCN })} · 未来教育生态管理系统
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="在读学生总数"
          value={stats?.active_students ?? '-'}
          subtitle={`共 ${stats?.total_students ?? 0} 名学员`}
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="今日出勤人数"
          value={stats?.todays_attendance ?? 0}
          subtitle={`出勤率 ${stats?.todays_attendance_rate ?? 0}%`}
          icon={CalendarCheck}
          color="green"
        />
        <StatCard
          title="开设课程数"
          value={stats?.active_courses ?? 0}
          subtitle="活跃课程"
          icon={BookOpen}
          color="purple"
        />
        <StatCard
          title="本月营收"
          value={stats ? formatCurrency(stats.monthly_revenue) : '-'}
          subtitle={`目标完成 ${revenuePercent}%`}
          icon={DollarSign}
          color="orange"
          trend={stats ? {
            value: `目标 ${formatCurrency(stats.monthly_revenue_target)}`,
            positive: stats.monthly_revenue >= stats.monthly_revenue_target * 0.8
          } : undefined}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Attendance Bar Chart */}
        <div className="card p-5 xl:col-span-3">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-primary-600" />
            <h2 className="font-semibold text-gray-800">本周考勤趋势</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="出席" fill="#4f46e5" radius={[3, 3, 0, 0]} />
              <Bar dataKey="迟到" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              <Bar dataKey="缺席" fill="#ef4444" radius={[3, 3, 0, 0]} />
              <Bar dataKey="请假" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Students by Center Pie Chart */}
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-primary-600" />
            <h2 className="font-semibold text-gray-800">各中心学生分布</h2>
          </div>
          {centerPieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={centerPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {centerPieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {centerPieData.map((entry) => (
                  <div key={entry.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: entry.color }} />
                      <span className="text-sm text-gray-600">{entry.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{entry.value}人</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
              暂无数据
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Announcements */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-primary-600" />
              <h2 className="font-semibold text-gray-800">最新公告</h2>
            </div>
            <span className="text-xs text-gray-400">{recentAnnouncements.length} 条</span>
          </div>
          {recentAnnouncements.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">暂无公告</p>
          ) : (
            <div className="space-y-3">
              {recentAnnouncements.map((a) => (
                <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                    a.is_pinned ? 'bg-red-500' : 'bg-primary-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{a.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{a.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        a.target_audience === 'all' ? 'bg-gray-200 text-gray-600' :
                        a.target_audience === 'parents' ? 'bg-blue-100 text-blue-600' :
                        'bg-purple-100 text-purple-600'
                      }`}>
                        {a.target_audience === 'all' ? '全部' :
                         a.target_audience === 'parents' ? '家长' : '教职工'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {format(parseISO(a.created_at), 'MM/dd')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Enrollments */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <UserPlus size={18} className="text-primary-600" />
              <h2 className="font-semibold text-gray-800">最近报名</h2>
            </div>
            <span className="text-xs text-gray-400">{recentEnrollments.length} 条</span>
          </div>
          {recentEnrollments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">暂无报名记录</p>
          ) : (
            <div className="space-y-3">
              {recentEnrollments.map((e) => (
                <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-accent-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {e.student?.name?.[0] || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800">{e.student?.name}</p>
                      {e.student?.center_point && (
                        <CenterBadge center={e.student.center_point as CenterPoint} />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{e.course?.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-primary-600">
                      ¥{e.course?.fee_monthly?.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(parseISO(e.created_at), 'MM/dd')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
