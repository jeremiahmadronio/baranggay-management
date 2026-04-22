import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Check,
  X,
  ArrowLeft,
  User,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { AuthLayout } from './AuthLayout'
import { authService } from '../../service/login-api/login'
import { ActionModal } from '../../reusable'
export function ChangePasswordNewAccountPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [username, setUsername] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isUsernameTaken, setIsUsernameTaken] = useState(false);
const [isCheckingUsername, setIsCheckingUsername] = useState(false);
const [usernameMessage, setUsernameMessage] = useState('');
  const email =
    (
      location.state as {
        email?: string
      }
    )?.email || ''
 
  
  
   useEffect(() => {
  if (username.trim().length < 3) {
    setIsUsernameTaken(false);
    setUsernameMessage('');
    return;
  }

  const checkUsername = async () => {
    setIsCheckingUsername(true);
    try {
      const isAvailable = await authService.checkUsernameAvailability(username);
      // i-adjust depende sa backend mo:
      // kung true = available → setIsUsernameTaken(!isAvailable)
      // kung true = taken    → setIsUsernameTaken(isAvailable)
      setIsUsernameTaken(!isAvailable); // assuming true = available
      setUsernameMessage(isAvailable ? 'Username is available.' : 'This username is already taken.');
    } catch (err) {
      console.error("Username check failed", err);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const timeoutId = setTimeout(checkUsername, 500);
  return () => clearTimeout(timeoutId);
}, [username]); 



  const passwordRules = {
    minLength: newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasLowercase: /[a-z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
    hasSpecial: /[@$!%*?&]/.test(newPassword),
  }


  
  const isPasswordValid = Object.values(passwordRules).every(Boolean)
  const passwordsMatch =
    newPassword === confirmPassword && confirmPassword !== ''
  const isUsernameValid = username.trim().length >= 3
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements.')
      return
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.')
      return
    }
    if (!isUsernameValid) {
      setError('Username must be at least 3 characters long.')
      return
    }
    setIsLoading(true)
    try {
      await authService.changePasswordNewAccount({
        email,
        newPassword,
        confirmPassword,
        username,
      })
      setShowSuccessModal(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password.')
    } finally {
      setIsLoading(false)
    }
  }
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false)
    navigate('/security-setup', {
      state: {
        email,
      },
    })
  }
  const RuleItem = ({ valid, text }: { valid: boolean; text: string }) => (
    <div
      className={`flex items-center gap-2 text-sm ${valid ? 'text-green-600' : 'text-slate-400'}`}
    >
      {valid ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
      {text}
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
        <Link
          to="/login"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 mb-6 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600 rounded-md px-1 -ml-1"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Login
        </Link>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Set Your Password & Username
          </h2>
          <p className="text-slate-500 text-sm">
            Create a strong password and choose a username for your new account
          </p>
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
              htmlFor="newPassword"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow text-slate-900 placeholder:text-slate-400 bg-slate-50 focus:bg-white"
                placeholder="••••••••"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`block w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow text-slate-900 placeholder:text-slate-400 bg-slate-50 focus:bg-white ${confirmPassword && !passwordsMatch ? 'border-red-300' : confirmPassword && passwordsMatch ? 'border-green-300' : 'border-slate-200'}`}
                placeholder="••••••••"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="mt-1 text-sm text-red-600">
                Passwords do not match
              </p>
            )}
            {confirmPassword && passwordsMatch && (
              <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                <Check className="w-4 h-4" /> Passwords match
              </p>
            )}
          </div>
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs font-medium text-slate-600 mb-2">
              Password requirements:
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <RuleItem valid={passwordRules.minLength} text="8+ characters" />
              <RuleItem
                valid={passwordRules.hasUppercase}
                text="Uppercase (A-Z)"
              />
              <RuleItem
                valid={passwordRules.hasLowercase}
                text="Lowercase (a-z)"
              />
              <RuleItem valid={passwordRules.hasNumber} text="Number (0-9)" />
              <RuleItem
                valid={passwordRules.hasSpecial}
                text="Special (@$!%*?&)"
              />
            </div>
          </div>

          <div className="pt-2">
  <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1.5">
    Choose your username
  </label>
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <User className="h-5 w-5 text-slate-400" />
    </div>
    <input
      id="username"
      type="text"
      required
      value={username}
      onChange={(e) => setUsername(e.target.value)}
      className={`block w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow text-slate-900 bg-slate-50 focus:bg-white 
        ${username.length >= 3 && isUsernameTaken ? 'border-red-300' : 
          username.length >= 3 && !isUsernameTaken && !isCheckingUsername ? 'border-green-300' : 'border-slate-200'}`}
      placeholder="Your username"
      disabled={isLoading}
    />
    
    {/* Selyado: Status Indicators */}
    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
      {isCheckingUsername ? (
        <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
      ) : username.length >= 3 && isUsernameTaken ? (
        <X className="h-4 w-4 text-red-500" />
      ) : username.length >= 3 && !isUsernameTaken ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : null}
    </div>
  </div>
  
  {/* Selyado: Validation Message */}
  {usernameMessage && (
    <p className={`mt-1 text-xs ${isUsernameTaken ? 'text-red-600' : 'text-green-600'}`}>
      {usernameMessage}
    </p>
  )}
</div>

          <button
            type="submit"
            disabled={
              isLoading ||
              !isPasswordValid ||
              !passwordsMatch ||
              !isUsernameValid
            }
            className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-600 disabled:opacity-50 transition-colors font-medium shadow-sm mt-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                Setting up...
              </>
            ) : (
              'Set Password & Continue'
            )}
          </button>
        </form>
      </motion.div>
      <ActionModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Account Updated Successfully"
        type="success"
      >
        <p>
          Your password and username have been set. Let's set up your security
          settings next.
        </p>
      </ActionModal>
    </AuthLayout>
  )
}
