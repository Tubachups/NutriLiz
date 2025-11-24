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
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              disabled={loading || !userId || !secret}
              minLength={8}
              required
              className="w-full px-4 py-3 border-2 border-secondary rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label 
              htmlFor="confirmPassword" 
              className="block text-sm font-medium text-dark mb-2 font-display"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              disabled={loading || !userId || !secret}
              minLength={8}
              required
              className="w-full px-4 py-3 border-2 border-secondary rounded-lg focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
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