import { createLazyFileRoute, useSearch } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useProductScanner } from '../hooks/useProductScanner'
import { useProductAssessment } from '../hooks/useProductAssessment'
import { useProductHistory } from '../hooks/useProductHistory'
import LoadingStates from '../components/LoadingStates/LoadingStates'
import ProductCard from '../components/ProductCard/ProductCard'
import AppwriteProductCard from '../components/AppwriteProductCard/AppwriteProductCard'
import Assessment from '../components/Assessment/Assessment'
import Recommend from '../components/ProductCard/Recommend'

export const Route = createLazyFileRoute('/scan')({
  component: RouteComponent,
  validateSearch: (search) => {
    return {
      barcode: search.barcode || null,
    }
  },
})

function RouteComponent() {
  const { barcode: urlBarcode } = useSearch({ from: '/scan' })
  const { productData, loading, error } = useProductScanner(urlBarcode)
  const { assessment, loading: assessmentLoading, error: assessmentError } = useProductAssessment(productData?.barcode)
  const { addProduct } = useProductHistory()
  const lastSavedBarcodeRef = useRef(null)
  
  const isAppwriteProduct = productData?.source === 'appwrite'

  // Save to history when a new product is scanned
  useEffect(() => {
    if (productData && productData.barcode && productData.barcode !== lastSavedBarcodeRef.current) {
      lastSavedBarcodeRef.current = productData.barcode
      addProduct(productData, productData.barcode)
    }
  }, [productData, addProduct])

  return (
    <div className="min-h-screen bg-[#ECF4e8] py-8 px-4 font-display">
      <div className="max-w-8/10 mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          🥗 NutriLiz - Barcode Scanner
        </h1>

        <LoadingStates loading={loading} error={error} />

        {productData ? (
          <div className="space-y-6">
            {isAppwriteProduct ? (
              <AppwriteProductCard productData={productData} />
            ) : (
              <ProductCard productData={productData} />
            )}

            {/* Moved Assessment Logic */}
            <Assessment
              assessment={assessment}
              loading={assessmentLoading}
              error={assessmentError}
              isAppwriteProduct={isAppwriteProduct}
            />

            {/* Recommend Section - Right after Assessment */}
            {!isAppwriteProduct && (
              <Recommend
                recommendations={productData.recommendations}
                count={productData.recommendations_count}
              />
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center text-gray-500 border border-accent">
            <div className="text-6xl mb-4">📱</div>
            <p className="text-xl">Waiting for barcode scan...</p>
          </div>
        )}
      </div>
    </div>
  )
}