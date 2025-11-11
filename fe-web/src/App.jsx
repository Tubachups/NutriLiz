import './css/App.css'
import { useProductScanner } from './hooks/useProductScanner'
import { useProductAssessment } from './hooks/useProductAssessment'
import LoadingStates from './components/LoadingStates/LoadingStates'
import ProductCard from './components/ProductCard/ProductCard'
import AppwriteProductCard from './components/AppwriteProductCard/AppwriteProductCard'
import Assessment from './components/Assessment/Assessment'
import Recommend from './components/ProductCard/Recommend' 

const App = () => {
  const { productData, loading, error } = useProductScanner()
  const { assessment, loading: assessmentLoading, error: assessmentError } = useProductAssessment(productData?.barcode)

  const isAppwriteProduct = productData?.source === 'appwrite'

  return (
    <div className="min-h-screen bg-primary py-8 px-4 font-display">
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

export default App