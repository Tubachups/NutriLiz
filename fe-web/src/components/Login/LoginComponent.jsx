import { Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '../../hooks/auth-context'

export default function LoginComponent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, signUp, signInWithGoogle, user, isAdmin } = useAuth();
  const router = useRouter();

  if (user) {
    router.navigate({ to: isAdmin ? '/dashboard' : '/' });
    return null;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const result = await signIn(email, password);
      if (result?.success) {
        router.navigate({ to: result.isAdmin ? '/dashboard' : '/' });
      } else if (result?.error) {
        setError(result.error);
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
        setSuccessMessage('Account created successfully! Please sign in with your credentials.');
        setIsRegisterMode(false);
        setName('');
        setPassword('');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError('');
    setSuccessMessage('');
    const result = await signInWithGoogle();
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div className="min-h-screen bg-[#ECF4E8] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#93BFC7] mb-2">NutriLiz</h1>
          <p className="mt-2 text-gray-600">
            {isRegisterMode
              ? 'Sign up to start your nutrition journey'
              : 'Sign in to your account'}
          </p>
        </div>

        <form onSubmit={isRegisterMode ? handleRegister : handleLogin}>
          <fieldset className="fieldset bg-white shadow-lg rounded-xl border border-gray-200 p-8 w-full">
            {error && (
              <div className="w-full mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="w-full mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
                {successMessage}
              </div>
            )}

            {!isRegisterMode && (
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="btn w-full border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
              >
                Continue with Google
              </button>
            )}

            {isRegisterMode && (
              <>
                <label className="fieldset-label text-gray-700 font-medium">Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isRegisterMode}
                  className="input w-full border-gray-300  border focus:outline-none focus:border-[#93BFC7] focus:ring-1 focus:ring-[#93BFC7]"
                />
              </>
            )}

            <label className="fieldset-label text-gray-700 font-medium">Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input w-full border-gray-300 border focus:outline-none focus:border-[#93BFC7] focus:ring-1 focus:ring-[#93BFC7]"
            />

            <label className="fieldset-label text-gray-700 font-medium">Password</label>
            <div className="relative w-full">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input w-full border-gray-300 border focus:outline-none focus:border-[#93BFC7] focus:ring-1 focus:ring-[#93BFC7] pr-10"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
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

            {!isRegisterMode && (
              <div className="w-full text-right mt-1 mb-2">
                <Link to="/forgot-password" className="link link-hover text-sm text-[#93BFC7] hover:text-[#7BAAB2]">
                  Forgot Password?
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn mt-4 w-full bg-[#93BFC7] hover:bg-[#7BAAB2] text-white border-none shadow-md disabled:bg-gray-300 disabled:text-gray-500"
            >
              {isLoading
                ? <span className="loading loading-spinner"></span>
                : (isRegisterMode ? 'Create Account' : 'Login')}
            </button>

            <div className="mt-6 text-center text-sm text-gray-600">
              {isRegisterMode ? 'Already have an account?' : "Don't have an account?"}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(!isRegisterMode);
                  setError('');
                  setSuccessMessage('');
                }}
                className="ml-2 text-[#93BFC7] hover:text-[#7BAAB2] font-semibold underline decoration-transparent hover:decoration-current transition-all cursor-pointer bg-transparent border-none p-0"
              >
                {isRegisterMode ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </fieldset>
        </form>
      </div>
    </div>
  );
}
