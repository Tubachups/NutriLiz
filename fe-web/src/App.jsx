import './css/App.css'
import { useProductScanner } from './hooks/useProductScanner'
import { useProductAssessment } from './hooks/useProductAssessment'
import LoadingStates from './components/LoadingStates/LoadingStates'
import ProductCard from './components/ProductCard/ProductCard'
import AppwriteProductCard from './components/AppwriteProductCard/AppwriteProductCard'

const App = () => {
  const { productData, loading, error } = useProductScanner()
  const { assessment, loading: assessmentLoading, error: assessmentError } = useProductAssessment(productData?.barcode)

  const cleanAnalysis = (text) => {
    if (!text) return ''
    return text.replace(/\*\*/g, '')
  }

  // Determine if product is from Appwrite
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
            {/* Conditional rendering based on source */}
            {isAppwriteProduct ? (
              <AppwriteProductCard productData={productData} />
            ) : (
              <ProductCard productData={productData} />
            )}

            {/* Show assessment for all products */}
            {assessmentLoading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center text-blue-800 animate-pulse">
                🤖 AI is analyzing product health risks...
              </div>
            )}

            {assessmentError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                ⚠️ {assessmentError}
              </div>
            )}

            {assessment && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-accent">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                  🔍 Health Risk Assessment
                </h2>

                {!isAppwriteProduct && assessment.allergens && (
                  <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="text-xl font-semibold mb-3 text-yellow-900">
                      ⚠️ Allergens
                    </h3>
                    {assessment.allergens.allergens.length > 0 && (
                      <p className="mb-2">
                        <strong className="text-yellow-900">Contains:</strong>{' '}
                        <span className="text-yellow-800">
                          {assessment.allergens.allergens.join(', ')}
                        </span>
                      </p>
                    )}
                    {assessment.allergens.traces.length > 0 && (
                      <p>
                        <strong className="text-yellow-900">May contain traces:</strong>{' '}
                        <span className="text-yellow-800">
                          {assessment.allergens.traces.join(', ')}
                        </span>
                      </p>
                    )}
                  </div>
                )}

                {assessment.ai_analysis && (
                  <div className="bg-secondary/30 rounded-lg p-4">
                    <h3 className="text-xl font-semibold mb-3 text-gray-800">
                      🤖 AI Analysis
                    </h3>
                    <p className="whitespace-pre-wrap leading-relaxed text-gray-700 ">
                      {cleanAnalysis(assessment.ai_analysis)}
                    </p>
                  </div>
                )}
              </div>
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