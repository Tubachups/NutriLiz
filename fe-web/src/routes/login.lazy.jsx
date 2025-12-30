import { useRouter, createLazyFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '../hooks/auth-context'

export const Route = createLazyFileRoute('/login')({
  component: LoginComponent,
})

function LoginComponent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const router = useRouter();

  // If user is already logged in, redirect to home
  if (user) {
    router.navigate({ to: '/' });
    return null;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const errorMsg = await signIn(email, password);
      if (errorMsg) {
        setError(errorMsg);
      } else {
        // Successful login - navigate to home
        router.navigate({ to: '/' });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      const errorMsg = await signUp(email, password, name);
      if (errorMsg) {
        setError(errorMsg);
      } else {
        // Registration successful - switch to login mode
        setSuccessMessage('Account created successfully! Please sign in with your credentials.');
        setIsRegisterMode(false);
        setName('');
        setPassword('');
        // Keep email so user doesn't have to re-enter it
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#ECF4E8] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#93BFC7] mb-2">NutriLiz</h1>
          <h2 className="text-2xl font-semibold text-gray-800">
            {isRegisterMode ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="mt-2 text-gray-600">
            {isRegisterMode 
              ? 'Sign up to start your nutrition journey' 
              : 'Sign in to your account'}
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {successMessage}
            </div>
          )}

          <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-6">
            {isRegisterMode && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required={isRegisterMode}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#93BFC7] focus:border-transparent outline-none transition"
                />
              </div>
            )}

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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#93BFC7] focus:border-transparent outline-none transition"
              />
              {!isRegisterMode && (
                <div className="mt-2 text-right">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-[#93BFC7] hover:text-[#7BAAB2]"
                  >
                    Forgot Password?
                  </Link>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#93BFC7] hover:bg-[#7BAAB2] text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading 
                ? 'Please wait...' 
                : isRegisterMode 
                  ? 'Create Account' 
                  : 'Sign In'}
            </button>
          </form>

          {/* Toggle between Login and Register */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setError('');
                  setSuccessMessage('');
                }}
                className="ml-2 text-[#93BFC7] hover:text-[#7BAAB2] font-semibold cursor-pointer"
              >
                {isRegisterMode ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}