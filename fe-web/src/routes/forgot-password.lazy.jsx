import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '../hooks/auth-context'
import { ArrowLeft, Mail } from 'lucide-react'

export const Route = createLazyFileRoute('/forgot-password')({
  component: ForgotPasswordComponent,
})

function ForgotPasswordComponent() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { forgotPassword } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!email) {
      setError('Please enter your email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    try {
      const result = await forgotPassword(email)
      
      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || 'Failed to send reset email. Please try again.')
      }
    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#ECF4E8] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#93BFC7] mb-2">NutriLiz</h1>
          <h2 className="text-2xl font-semibold text-gray-800">
            Reset Password
          </h2>
          <p className="mt-2 text-gray-600">
            Enter your email to receive a password reset link
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {success ? (
            <div className="text-center">
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                <div className="flex justify-center mb-3">
                  <Mail size={48} className="text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Check Your Email</h3>
                <p>
                  We've sent a password reset link to <strong>{email}</strong>. 
                  Please check your inbox and follow the instructions to reset your password.
                </p>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => {
                    setSuccess(false)
                    setEmail('')
                  }}
                  className="text-[#93BFC7] hover:text-[#7BAAB2] font-semibold"
                >
                  try again
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#93BFC7] focus:border-transparent outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#93BFC7] hover:bg-[#7BAAB2] text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-[#93BFC7] hover:text-[#7BAAB2] font-semibold"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}