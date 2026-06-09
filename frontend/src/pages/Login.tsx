import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Cpu, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface LoginForm {
  username: string
  password: string
}

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setError('')
    setIsLoading(true)
    try {
      await login(data.username, data.password)
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err?.response?.data?.detail || '登录失败，请检查用户名和密码'
      setError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-accent-800 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-accent-600 px-8 pt-10 pb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
              <Cpu size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">未来教育生态</h1>
            <p className="text-primary-200 text-sm">AI赋能 · 智慧教育管理平台</p>
            <div className="flex items-center justify-center gap-3 mt-4">
              {['A区·幼教', 'B区·托管', 'C区·补习', 'D区·兴趣'].map((c) => (
                <span
                  key={c}
                  className="text-xs text-white/70 bg-white/10 px-2 py-0.5 rounded-full"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="px-8 py-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-6 text-center">
              登录管理系统
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  用户名
                </label>
                <input
                  {...register('username', { required: '请输入用户名' })}
                  type="text"
                  placeholder="请输入用户名"
                  autoComplete="username"
                  className="input-field"
                />
                {errors.username && (
                  <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  密码
                </label>
                <div className="relative">
                  <input
                    {...register('password', { required: '请输入密码' })}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入密码"
                    autoComplete="current-password"
                    className="input-field pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-2.5 justify-center text-base"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>登录中...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    <span>登录</span>
                  </>
                )}
              </button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs text-gray-500 text-center mb-2 font-medium">演示账号</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div className="bg-white rounded-lg p-2 text-center">
                  <p className="font-medium text-gray-700">管理员</p>
                  <p>admin / admin123</p>
                </div>
                <div className="bg-white rounded-lg p-2 text-center">
                  <p className="font-medium text-gray-700">教师</p>
                  <p>teacher_wang / teacher123</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-white/50 text-xs mt-6">
          © 2024 未来教育生态 · AI赋能教育中心
        </p>
      </div>
    </div>
  )
}
