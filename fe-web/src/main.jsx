import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'
import { AuthProvider } from './hooks/auth-context'
import { ScanProvider } from './hooks/scan-context'
import { ProductHistoryProvider } from './hooks/useProductHistory'
import './css/App.css'

const router = createRouter({
  routeTree,
  // Make auth context available to all routes via router context
  context: {
    auth: undefined, // This will be set by AuthProvider
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ProductHistoryProvider>
        <ScanProvider>
          <RouterProvider router={router} />
        </ScanProvider>
      </ProductHistoryProvider>
    </AuthProvider>
  </StrictMode>,
)
