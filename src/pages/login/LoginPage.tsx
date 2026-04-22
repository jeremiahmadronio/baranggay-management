import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { AuthLayout } from './AuthLayout'
import { authService } from '../../service/login-api/login'
function normalizeKey(value?: string | null): string {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_')
}
function routeFromDepartment(department?: string | null): string | null {
  const key = normalizeKey(department)
  switch (key) {
    case 'CLEARANCE':
      return '/clearance/dashboard'
    case 'OFFICIAL':
      return '/official-portal/dashboard'
    case 'BLOTTER':
      return '/blotter/dashboard'
    case 'BCPC':
      return '/bcpc/dashboard'
    case 'VAWC':
      return '/vawc/dashboard'
    case 'LUPON':
    case 'LUPONG_TAGAPAMAYAPA':
      return '/lupongtagapamayapa/dashboard'
    case 'FIRST_TIME_JOB_SEEKER':
    case 'FTJS':
      return '/first-time-job-seeker/dashboard'
    default:
      return null
  }
}
export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const LOGIN_ERRORS: Record<string, string> = {
    INVALID_CREDENTIALS: 'Invalid email or password.',
    ACCOUNT_LOCKED: 'Account temporarily locked. Try again in 15 minutes.',
    ACCOUNT_INACTIVE: 'Account is inactive. Contact your administrator.',
    USER_NOT_FOUND: 'No account found with this email.',
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }
    if (!agreedToTerms) {
      setError('You must agree to the Terms and Conditions before signing in.')
      return
    }
    setIsLoading(true)
    try {
      const response = await authService.login({
        email,
        password,
      })
      if (response.status === 'MFA_REQUIRED') {
        navigate('/mfa-verification', {
          state: {
            email,
          },
        })
        return
      }
      if (response.status === 'CHANGE_PASSWORD_REQUIRED') {
        navigate('/change-password-new-account', {
          state: {
            email,
          },
        })
        return
      }
      if (response.status === 'SUCCESS') {
        const role = normalizeKey(response.role)
        if (role === 'ROOT_ADMIN') {
          navigate('/rootadmin/dashboard')
          return
        }
        if (role === 'ADMIN') {
          navigate('/admin/dashboard')
          return
        }
        const departmentRoute = routeFromDepartment(response.departments?.[0])
        if (departmentRoute) {
          navigate(departmentRoute)
          return
        }
        navigate('/login')
        return
      }
    } catch (err: any) {
      setError(
        LOGIN_ERRORS[err.response?.data?.code] ||
          err.response?.data?.message ||
          'Login failed. Please try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <AuthLayout>
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
        }}
        className="bg-white p-8 rounded-2xl shadow-xs shadow-slate-300/50 border border-slate-200"
      >
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Welcome Back
          </h2>
          <p className="text-slate-500">Sign in to your account</p>
        </div>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-start gap-2">
            <div className="mt-0.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow text-slate-900 placeholder:text-slate-400 bg-slate-50 focus:bg-white"
                placeholder="serbisyoko@gmail.com"
                disabled={isLoading}
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow text-slate-900 placeholder:text-slate-400 bg-slate-50 focus:bg-white"
                placeholder="••••••••"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-slate-300 rounded cursor-pointer"
                disabled={isLoading}
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-slate-600 cursor-pointer"
              >
                Remember me
              </label>
            </div>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:underline"
            >
              Forgot Password?
            </Link>
          </div>
          <div
            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${agreedToTerms ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}
          >
            <input
              id="agree-terms"
              type="checkbox"
              required
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              disabled={isLoading}
              className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-600 border-slate-300 rounded cursor-pointer shrink-0"
            />
            <label
              htmlFor="agree-terms"
              className="text-sm text-slate-600 cursor-pointer leading-relaxed"
            >
              I have read and agree to the{' '}
              <Link
                to="/terms-and-conditions"
                className="font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Terms and Conditions
              </Link>{' '}
              of the Barangay Ugong Management System.{' '}
              <span className="text-red-500 font-medium">*</span>
            </label>
          </div>
          <button
            type="submit"
            disabled={isLoading || !agreedToTerms}
            className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> Signing
                in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </motion.div>
    </AuthLayout>
  )
}
