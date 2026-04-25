import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import {
  Loader2,
  ArrowLeft,
  Smartphone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthLayout } from './AuthLayout'
import { authService, type MfaType } from '../../service/login-api/login'
import { resetPasswordService } from '../../service/login-api/reset-password'
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
    case 'KAPITANA':                      // JWT dept for Barangay Captain
    case 'CAPTAIN':
    case 'OFFICE_OF_THE_BARANGAY_CAPTAIN':
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
export function MFAVerificationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [method, setMethod] = useState<MfaType>('EMAIL')
  const [showAlternativeMethods, setShowAlternativeMethods] = useState(false)
  // States for OTP (Email, TOTP, Backup Email)
  const [code, setCode] = useState(['', '', '', '', '', ''])
  // State for Recovery Code
  const [recoveryCode, setRecoveryCode] = useState('')
  // State for Backup Email flow
  const [backupEmailAddress, setBackupEmailAddress] = useState('')
  const [backupEmailStep, setBackupEmailStep] = useState<
    'ENTER_EMAIL' | 'ENTER_CODE'
  >('ENTER_EMAIL')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const email =
    (
      location.state as {
        email?: string
      }
    )?.email || ''
  useEffect(() => {
    if (!email) {
      navigate('/login')
    }
  }, [email, navigate])
  const maskedEmail = email ? email.replace(/(.{1,3})(.*)(@.*)/, '$1***$3') : ''
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined = undefined
    if (
      countdown > 0 &&
      !canResend &&
      (method === 'EMAIL' ||
        (method === 'BACKUP_EMAIL' && backupEmailStep === 'ENTER_CODE'))
    ) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    } else if (countdown === 0) {
      setCanResend(true)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [countdown, canResend, method, backupEmailStep])
  const handleResend = async () => {
    if (!canResend) return
    setCountdown(60)
    setCanResend(false)
    setError('')
    try {
      if (method === 'EMAIL') {
        await resetPasswordService.forgotPassword(email)
      } else if (method === 'BACKUP_EMAIL') {
        await authService.initiateBackupEmail(email, backupEmailAddress)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.')
    }
  }
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value.substring(value.length - 1)
    setCode(newCode)
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace' && index > 0 && code[index] === '') {
      inputRefs.current[index - 1]?.focus()
    }
  }
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6)
      .split('')
    const newCode = [...code]
    pastedData.forEach((char, i) => {
      if (i < 6) newCode[i] = char
    })
    setCode(newCode)
    const nextFocusIndex = pastedData.length < 6 ? pastedData.length : 5
    inputRefs.current[nextFocusIndex]?.focus()
  }
  const isComplete = code.every((digit) => digit !== '')
  const handleSendBackupEmailCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!backupEmailAddress) return
    setIsLoading(true)
    setError('')
    try {
      await authService.initiateBackupEmail(email, backupEmailAddress)
      setBackupEmailStep('ENTER_CODE')
      setCountdown(60)
      setCanResend(false)
    } catch (err: any) {
      setError(err.message || 'Failed to send code to backup email.')
    } finally {
      setIsLoading(false)
    }
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (method !== 'RECOVERY' && !isComplete) return
    if (method === 'RECOVERY' && !recoveryCode) return
    setIsLoading(true)
    setError('')
    try {
      let response
      if (method === 'BACKUP_EMAIL') {
        const fullCode = code.join('')
        await authService.verifyBackupEmail(email, backupEmailAddress, fullCode)
        // After verifying backup email, we still need to complete the login flow
        response = await authService.verifyMfa({
          email,
          code: fullCode,
          type: 'BACKUP_EMAIL',
        })
      } else {
        const payloadCode = method === 'RECOVERY' ? recoveryCode : code.join('')
        response = await authService.verifyMfa({
          email,
          code: payloadCode,
          type: method,
        })
      }
      if (response.status === 'CHANGE_PASSWORD_REQUIRED') {
        navigate('/change-password-new-account', {
          state: {
            email,
            userId: response.userId,
          },
        })
        return
      }
      const role = normalizeKey(response.role)
      if (role === 'ROOT_ADMIN') {
        navigate('/rootadmin/dashboard')
        return
      }
      if (role === 'ADMIN') {
        navigate('/admin/dashboard')
        return
      }
      if (role === 'CAPTAIN') {
        navigate('/official-portal/dashboard')
        return
      }
      const departmentRoute = routeFromDepartment(response.departments?.[0])
      if (departmentRoute) {
        navigate(departmentRoute)
        return
      }
      navigate('/login')
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.')
      if (method !== 'RECOVERY') {
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } finally {
      setIsLoading(false)
    }
  }
  const renderOtpInput = () => (
    <div className="flex justify-center gap-2 sm:gap-4">
      {code.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-slate-900 bg-slate-50 focus:bg-white"
          disabled={isLoading}
        />
      ))}
    </div>
  )
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
        className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {method === 'EMAIL' && 'Email Verification'}
            {method === 'TOTP' && 'Authenticator App'}
            {method === 'RECOVERY' && 'Recovery Code'}
            {method === 'BACKUP_EMAIL' && 'Backup Email Verification'}
          </h2>
          <p className="text-slate-500 text-sm">
            {method === 'EMAIL' && (
              <>
                We sent a 6-digit code to{' '}
                <span className="font-semibold text-slate-900">
                  {maskedEmail}
                </span>
              </>
            )}
            {method === 'TOTP' &&
              'Enter the 6-digit code from your authenticator app'}
            {method === 'RECOVERY' &&
              'Enter one of your emergency recovery codes'}
            {method === 'BACKUP_EMAIL' &&
              backupEmailStep === 'ENTER_EMAIL' &&
              'Enter your backup email address to receive a code'}
            {method === 'BACKUP_EMAIL' &&
              backupEmailStep === 'ENTER_CODE' &&
              'Enter the 6-digit code sent to your backup email'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm flex items-start gap-2">
            <AlertIcon />
            {error}
          </div>
        )}

        {method === 'BACKUP_EMAIL' && backupEmailStep === 'ENTER_EMAIL' ? (
          <form onSubmit={handleSendBackupEmailCode} className="space-y-6">
            <div>
              <label
                htmlFor="backupEmail"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Backup Email
              </label>
              <input
                id="backupEmail"
                type="email"
                required
                value={backupEmailAddress}
                onChange={(e) => setBackupEmailAddress(e.target.value)}
                className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow text-slate-900 placeholder:text-slate-400 bg-slate-50 focus:bg-white"
                placeholder="backup@example.com"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !backupEmailAddress}
              className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all font-semibold shadow-lg shadow-blue-200"
            >
              {isLoading ? (
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
              ) : (
                'Send Code'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {method === 'RECOVERY' ? (
              <div>
                <input
                  type="text"
                  required
                  value={recoveryCode}
                  onChange={(e) =>
                    setRecoveryCode(e.target.value.toUpperCase())
                  }
                  className="block w-full px-4 py-3 text-center tracking-widest text-lg font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow text-slate-900 placeholder:text-slate-400 bg-slate-50 focus:bg-white"
                  placeholder="XXXX-XXXX"
                  disabled={isLoading}
                />
              </div>
            ) : (
              renderOtpInput()
            )}

            <button
              type="submit"
              disabled={
                isLoading ||
                (method !== 'RECOVERY' && !isComplete) ||
                (method === 'RECOVERY' && !recoveryCode)
              }
              className="w-full flex justify-center items-center py-3 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all font-semibold shadow-lg shadow-blue-200"
            >
              {isLoading ? (
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
              ) : (
                'Verify & Continue'
              )}
            </button>
          </form>
        )}

        {(method === 'EMAIL' ||
          (method === 'BACKUP_EMAIL' && backupEmailStep === 'ENTER_CODE')) && (
          <div className="mt-6 text-center">
            {canResend ? (
              <button
                onClick={handleResend}
                className="text-blue-600 font-medium hover:underline text-sm"
              >
                Resend verification code
              </button>
            ) : (
              <span className="text-slate-400 text-sm italic">
                Resend available in {countdown}s
              </span>
            )}
          </div>
        )}

        {method === 'EMAIL' && (
          <div className="mt-8 border-t border-slate-100 pt-6">
            <button
              type="button"
              onClick={() => setShowAlternativeMethods(!showAlternativeMethods)}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Having trouble? Try another verification method
              {showAlternativeMethods ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            <AnimatePresence>
              {showAlternativeMethods && (
                <motion.div
                  initial={{
                    height: 0,
                    opacity: 0,
                  }}
                  animate={{
                    height: 'auto',
                    opacity: 1,
                  }}
                  exit={{
                    height: 0,
                    opacity: 0,
                  }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 space-y-3">
                    <MethodButton
                      icon={<Smartphone className="w-5 h-5" />}
                      title="Authenticator App"
                      description="Use a code from your authenticator app"
                      onClick={() => {
                        setMethod('TOTP')
                        setShowAlternativeMethods(false)
                        setCode(['', '', '', '', '', ''])
                        setError('')
                      }}
                    />
                   
                  
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {method !== 'EMAIL' && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setMethod('EMAIL')
                setCode(['', '', '', '', '', ''])
                setError('')
              }}
              className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Email Verification
            </button>
          </div>
        )}

        {method === 'EMAIL' && (
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-slate-500 hover:text-blue-600"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Login
            </Link>
          </div>
        )}
      </motion.div>
    </AuthLayout>
  )
}
function MethodButton({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
    >
      <div className="p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </button>
  )
}
function AlertIcon() {
  return (
    <div className="mt-0.5">
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  )
}
