import { createLazyFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/auth-context'
import { getProductHistoryByUserId } from '../lib/appwriteDB'
import ModalDashboard from '../components/ModalDashboard/ModalDashboard'

export const Route = createLazyFileRoute('/dashboard')({
  component: AdminDashboard,
})

// Backend API URL - adjust if different
const API_URL = 'http://192.168.8.99:5000'

function AdminDashboard() {
  const { user, isAdmin, isLoadingUser } = useAuth()
  const router = useRouter()
  
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // New states for user history modal
  const [selectedUser, setSelectedUser] = useState(null)
  const [userHistory, setUserHistory] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState(null)
  const modalRef = useRef(null)
  
  const USERS_PER_PAGE = 12

  // Redirect non-admin users
  useEffect(() => {
    if (!isLoadingUser && (!user || !isAdmin)) {
      router.navigate({ to: '/login' })
    }
  }, [user, isAdmin, isLoadingUser, router])

  // Fetch users
  useEffect(() => {
    if (isAdmin && user) {
      fetchUsers()
    }
  }, [currentPage, isAdmin, user])

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const offset = (currentPage - 1) * USERS_PER_PAGE
      
      // Call your backend API
      const response = await fetch(
        `${API_URL}/api/admin/users?limit=${USERS_PER_PAGE}&offset=${offset}`,
        {
          headers: {
            'X-User-ID': user.$id,  // Send user ID for admin verification
          }
        }
      )
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users')
      }
      
      setUsers(data.users)
      setTotal(data.total)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch user's scan history from lists_prod table
  const fetchUserHistory = async (userId) => {
    setIsLoadingHistory(true)
    setHistoryError(null)
    
    try {
      const documents = await getProductHistoryByUserId(userId, 100)
      setUserHistory(documents)
    } catch (err) {
      console.error('Error fetching user history:', err)
      setHistoryError(err.message)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Handle user row click
  const handleUserClick = (clickedUser) => {
    setSelectedUser(clickedUser)
    fetchUserHistory(clickedUser.$id)
    modalRef.current?.showModal()
  }

  const totalPages = Math.ceil(total / USERS_PER_PAGE)

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ECF4E8]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#93BFC7]"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-[#ECF4E8] p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
        <p className="text-gray-600 mb-4">Total Users: {total}</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#93BFC7]"></div>
          </div>
        ) : (
          <>
            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr 
                      key={u.$id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleUserClick(u)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                        {u.$id.slice(0, 12)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-[#93BFC7] flex items-center justify-center text-white font-medium">
                            {u.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {u.name || 'No name'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {u.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          u.emailVerification 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {u.emailVerification ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(u.$createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-600">
                Showing {((currentPage - 1) * USERS_PER_PAGE) + 1} to {Math.min(currentPage * USERS_PER_PAGE, total)} of {total} users
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Previous
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-4 py-2 border rounded-md text-sm font-medium cursor-pointer ${
                        currentPage === pageNum
                          ? 'bg-[#93BFC7] text-white border-[#93BFC7]'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* User History Modal */}
      <ModalDashboard
        ref={modalRef}
        selectedUser={selectedUser}
        userHistory={userHistory}
        isLoadingHistory={isLoadingHistory}
        historyError={historyError}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  )
}