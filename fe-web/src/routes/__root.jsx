import { createRootRoute, Link, Outlet, useRouter, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { useAuth } from '../hooks/auth-context'
import { LogOut } from 'lucide-react'
import { useEffect } from 'react'
import { useScanContext } from '../hooks/scan-context'
import { Shield } from 'lucide-react'

const RootLayout = () => {
  const { user, signOut, isLoadingUser, isAdmin } = useAuth()
  const { clearAllScans } = useScanContext()
  const router = useRouter()
  const location = useLocation()

  const handleLogout = async () => {
    await signOut()
    clearAllScans()
    router.navigate({ to: '/login' })
  }

   useEffect(() => {
    const publicRoutes = ['/login', '/forgot-password']
    const adminRoutes = ['/dashboard']
    const userRoutes = ['/profile', '/scan', '/image-search', '/history', '/product-detail']
    
    const isPublicRoute = publicRoutes.includes(location.pathname)
    const isAdminRoute = adminRoutes.some(route => location.pathname.startsWith(route))
    const isUserRoute = userRoutes.some(route => location.pathname.startsWith(route))
    
    if (!isLoadingUser) {
      // Not logged in - redirect to login (except public routes)
      if (!user && !isPublicRoute) {
        router.navigate({ to: '/login' })
        return
      }
      
      // Admin trying to access user routes - redirect to admin dashboard
      if (user && isAdmin && isUserRoute) {
        router.navigate({ to: '/dashboard' })
        return
      }
      
      // Regular user trying to access admin routes - redirect to home
      if (user && !isAdmin && isAdminRoute) {
        router.navigate({ to: '/' })
        return
      }
      
      // Admin on home page - redirect to dashboard
      if (user && isAdmin && location.pathname === '/') {
        router.navigate({ to: '/dashboard' })
        return
      }
    }
  }, [user, isLoadingUser, isAdmin, location.pathname, router])

  // Show loading spinner while checking auth status
  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ECF4E8]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#93BFC7] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <nav className="bg-white shadow-md p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex gap-4">
            {user ? (
              isAdmin ? (
                // Admin Navigation - only shows Dashboard
                <Link 
                  to="/dashboard" 
                  className="flex items-center gap-1 text-gray-700 hover:text-[#93BFC7] [&.active]:font-bold [&.active]:text-[#93BFC7]"
                >
                  <Shield size={16} />
                  Dashboard
                </Link>
              ) : (
                // Regular User Navigation
                <>
                  <Link 
                    to="/" 
                    className="text-gray-700 hover:text-[#93BFC7] [&.active]:font-bold [&.active]:text-[#93BFC7]"
                  >
                    Home
                  </Link>
                  <Link 
                    to="/profile" 
                    className="text-gray-700 hover:text-[#93BFC7] [&.active]:font-bold [&.active]:text-[#93BFC7]"
                  >
                    Profile
                  </Link>
                  <Link 
                    to="/scan" 
                    className="text-gray-700 hover:text-[#93BFC7] [&.active]:font-bold [&.active]:text-[#93BFC7]"
                  >
                    Scan Product
                  </Link>
                  <Link 
                    to="/image-search" 
                    className="text-gray-700 hover:text-[#93BFC7] [&.active]:font-bold [&.active]:text-[#93BFC7]"
                  >
                    Food Photo
                  </Link>
                  <Link 
                    to="/history" 
                    className="text-gray-700 hover:text-[#93BFC7] [&.active]:font-bold [&.active]:text-[#93BFC7]"
                  >
                    History
                  </Link>
                </>
              )
            ) : (
              <Link 
                to="/login" 
                className="text-gray-700 hover:text-[#93BFC7] [&.active]:font-bold [&.active]:text-[#93BFC7]"
              >
                Login
              </Link>
            )}
          </div>
          
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                {isAdmin && <Shield size={14} className="inline mr-1" />}
                Welcome, {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>
      <Outlet />
      {/* <TanStackRouterDevtools /> */}
    </>
  )
}

export const Route = createRootRoute({ component: RootLayout })