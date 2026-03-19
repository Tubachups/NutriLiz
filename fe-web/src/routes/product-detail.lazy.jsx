import { createLazyFileRoute, useSearch } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useProductAssessment } from '../hooks/useProductAssessment'
import { useProductHistory } from '../hooks/useProductHistory'
import LoadingStates from '../components/LoadingStates/LoadingStates'
import ProductCard from '../components/ProductCard/ProductCard'
import AppwriteProductCard from '../components/AppwriteProductCard/AppwriteProductCard'
import Assessment from '../components/Assessment/Assessment'
import Recommend from '../components/ProductCard/Recommend'

export const Route = createLazyFileRoute('/product-detail')({
  component: ProductDetailPage,
  validateSearch: (search) => {
    return {
      barcode: search.barcode || null,
      productData: search.productData || null,
    }
  },
})

function ProductDetailPage() {
  const { barcode, productData: productDataString } = useSearch({ from: '/product-detail' })
  const { products, loading: historyLoading } = useProductHistory()
  const [productData, setProductData] = useState(null)
  const [error, setError] = useState(null)
  const [loadingProduct, setLoadingProduct] = useState(false)
  const fetchedBarcodeRef = useRef(null)

  const API_URL = 'http://192.168.100.69:5000/api'
  
  // Backward compatibility for old URLs that still pass productData in query params.
  useEffect(() => {
    if (productDataString) {
      try {
        const parsed = JSON.parse(productDataString)
        setProductData(parsed)
      } catch (e) {
        console.error('Failed to parse product data:', e)
        setError('Failed to load product data')
      }
    }
  }, [productDataString])

  useEffect(() => {
    if (productData || !barcode || error) return

    const productFromHistory = products.find((item) => item.barcode === barcode)
    if (productFromHistory?.productData) {
      setProductData(productFromHistory.productData)
      return
    }

    if (historyLoading || fetchedBarcodeRef.current === barcode) return

    const fetchProductByBarcode = async () => {
      setLoadingProduct(true)
      fetchedBarcodeRef.current = barcode

      try {
        const response = await fetch(`${API_URL}/product/${barcode}`)
        const data = await response.json()

        if (response.ok) {
          setProductData(data)
        } else {
          setError('Failed to load product data')
        }
      } catch (fetchError) {
        console.error('Failed to fetch product data:', fetchError)
        setError('Failed to load product data')
      } finally {
        setLoadingProduct(false)
      }
    }

    fetchProductByBarcode()
  }, [barcode, error, historyLoading, productData, products])

  const isAppwriteProduct = productData?.source === 'appwrite'
  const { assessment, loading: assessmentLoading, error: assessmentError } = useProductAssessment(barcode)

  if (error) {
    return (
      <div className="min-h-screen bg-[#ecf4e8] py-8 px-4 font-display">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">❌</div>
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!productData || loadingProduct || historyLoading) {
    return (
      <div className="min-h-screen bg-[#ecf4e8] py-8 px-4 font-display">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading product...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#ecf4e8] py-8 px-4 font-display">
      <div className="max-w-8/10 mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          🥗 Product Details
        </h1>

        <div className="space-y-6">
          {isAppwriteProduct ? (
            <AppwriteProductCard productData={productData} />
          ) : (
            <ProductCard productData={productData} />
          )}

          <Assessment
            assessment={assessment}
            loading={assessmentLoading}
            error={assessmentError}
            isAppwriteProduct={isAppwriteProduct}
          />

          {!isAppwriteProduct && (
            <Recommend
              recommendations={productData.recommendations}
              count={productData.recommendations_count}
            />
          )}
        </div>
      </div>
    </div>
  )
}