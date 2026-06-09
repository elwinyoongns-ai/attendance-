import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, CalendarCheck, BookOpen,
  CreditCard, Megaphone, LogOut, Menu, X, Cpu, ChevronRight
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { ROLE_LABELS } from '../types'

interface NavItem {
  to: string
  icon: React.ElementType
  label: string
  badge?: number
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/students', icon: Users, label: '学生管理' },
  { to: '/attendance', icon: CalendarCheck, label: '考勤管理' },
  { to: '/courses', icon: BookOpen, label: '课程管理' },
  { to: '/payments', icon: CreditCard, label: '缴费管理' },
  { to: '/announcements', icon: Megaphone, label: '公告管理' },
]

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-indigo-700/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Cpu size={20} className="text-indigo-200" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">未来教育生态</h1>
            <p className="text-xs text-indigo-300 mt-0.5">AI赋能教育管理</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
              ${isActive
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-indigo-200 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? 'text-white' : 'text-indigo-300 group-hover:text-white'} />
                <span className="flex-1">{label}</span>
                {badge !== undefined && (
                  <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {badge}
                  </span>
                )}
                {isActive && <ChevronRight size={14} className="text-indigo-300" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="px-4 py-4 border-t border-indigo-700/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
            <span className="text-white font-bold text-sm">
              {user?.full_name?.[0] || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-indigo-300">
              {user?.role ? ROLE_LABELS[user.role] : ''}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-indigo-200 hover:bg-white/10 hover:text-white transition-all"
        >
          <LogOut size={16} />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-primary-800 to-primary-900 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Sidebar - mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-primary-800 to-primary-900 transform transition-transform duration-300 ease-in-out lg:hidden
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-indigo-200 hover:text-white hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center gap-4 px-4 h-14 bg-white border-b border-gray-200 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Cpu size={18} className="text-primary-600" />
            <span className="font-semibold text-gray-900">未来教育生态</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
