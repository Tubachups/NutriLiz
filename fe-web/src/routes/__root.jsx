import { createRootRoute, Link, Outlet, useRouter, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { useAuth } from '../hooks/auth-context'
import { LogOut } from 'lucide-react'
import { useEffect } from 'react'
import { useScanContext } from '../hooks/scan-context'

const RootLayout = () => {
  const { user, signOut, isLoadingUser } = useAuth()
  const { clearAllScans } = useScanContext()
  const router = useRouter()
  const location = useLocation()

  const handleLogout = async () => {
    await signOut()
    clearAllScans()
    router.navigate({ to: '/login' })
  }

   useEffect(() => {
    const publicRoutes = ['/login']
    const isPublicRoute = publicRoutes.includes(location.pathname)
    
    if (!isLoadingUser && !user && !isPublicRoute) {
      router.navigate({ to: '/login' })
    }
  }, [user, isLoadingUser, location.pathname, router])

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
                  Scan Food
                </Link>
                <Link 
                  to="/image-search" 
                  className="text-gray-700 hover:text-[#93BFC7] [&.active]:font-bold [&.active]:text-[#93BFC7]"
                >
                  Image Search
                </Link>
                <Link 
                  to="/history" 
                  className="text-gray-700 hover:text-[#93BFC7] [&.active]:font-bold [&.active]:text-[#93BFC7]"
                >
                  History
                </Link>
              </>
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
              <span className="text-gray-600">Welcome, {user.name}</span>
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