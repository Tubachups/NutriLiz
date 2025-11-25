import { useState, useEffect } from 'react'
import { account } from './lib/appwrite'
import './css/App.css'

function App() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [userId, setUserId] = useState('')
  const [secret, setSecret] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    // Extract userId and secret from URL parameters
    const params = new URLSearchParams(window.location.search)
    const userIdParam = params.get('userId')
    const secretParam = params.get('secret')
    
    if (!userIdParam || !secretParam) {
      setError('Invalid or expired reset link. Please request a new password reset.')
    } else {
      setUserId(userIdParam)
      setSecret(secretParam)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (!userId || !secret) {
      setError('Invalid reset link. Please request a new password reset.')
      return
    }

    setLoading(true)

    try {
      // Use updateRecovery to complete the password reset
      await account.updateRecovery(
        userId,
        secret,
        password
      )

      setSuccess(true)
      setError('')
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        window.location.href = 'nutriliz://auth' // Deep link to your mobile app
      }, 3000)
    } catch (err) {
      console.error('Password reset error:', err)
      setError(err.message || 'Failed to reset password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-dark mb-4">
            Password Reset Successful
          </h1>
          <p className="text-gray-600 mb-2">
            Your password has been updated successfully.
          </p>
          <p className="text-gray-500 text-sm">
            Redirecting you to the login page...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-secondary to-accent p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🔒</div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-dark mb-2">
            Reset Your Password
          </h1>
          <p className="text-gray-600 text-sm sm:text-base font-display">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-dark mb-2 font-display"
            >
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                disabled={loading || !userId || !secret}
                minLength={8}
                required
                className="w-full px-4 py-3 pr-12 border-2 border-secondary rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-dark transition-colors p-1"
                disabled={loading || !userId || !secret}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label 
              htmlFor="confirmPassword" 
              className="block text-sm font-medium text-dark mb-2 font-display"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                disabled={loading || !userId || !secret}
                minLength={8}
                required
                className="w-full px-4 py-3 pr-12 border-2 border-secondary rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-dark transition-colors p-1"
                disabled={loading || !userId || !secret}
              >
                {showConfirmPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-display">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || !userId || !secret}
            className="w-full bg-accent hover:bg-dark text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-dark focus:ring-offset-2 font-display"
          >
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs sm:text-sm text-gray-500 font-display">
            Password must be at least 8 characters long
          </p>
        </div>
      </div>
    </div>
  )
}

export default App