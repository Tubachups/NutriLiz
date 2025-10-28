import './css/App.css'
import { useProductScanner } from './hooks/useProductScanner'
import { useProductAssessment } from './hooks/useProductAssessment'
import LoadingStates from './components/LoadingStates/LoadingStates'
import ProductCard from './components/ProductCard/ProductCard'

const App = () => {
  const { productData, loading, error } = useProductScanner()
  const { assessment, loading: assessmentLoading, error: assessmentError } = useProductAssessment(productData?.barcode)

  const cleanAnalysis = (text) => {
    if (!text) return ''
    return text.replace(/\*\*/g, '')
  }

  return (
    <div className="app-container">
      <h1>NutriLiz - Barcode Scanner</h1>

      <LoadingStates loading={loading} error={error} />

      {productData ? (
        <div>
          <ProductCard productData={productData} />

          {assessmentLoading && (
            <div className="assessment-loading">
              🤖 AI is analyzing product health risks...
            </div>
          )}

          {assessmentError && (
            <div className="assessment-error">
              ⚠️ {assessmentError}
            </div>
          )}

          {assessment && (
            <div className="risk-assessment">
              <h2>🔍 Health Risk Assessment</h2>

              {assessment.allergens && (
                <div className="allergens-section">
                  <h3>⚠️ Allergens</h3>
                  {assessment.allergens.allergens.length > 0 && (
                    <p><strong>Contains:</strong> {assessment.allergens.allergens.join(', ')}</p>
                  )}
                  {assessment.allergens.traces.length > 0 && (
                    <p><strong>May contain traces:</strong> {assessment.allergens.traces.join(', ')}</p>
                  )}
                </div>
              )}

              {assessment.ai_analysis && (
                <div className="ai-analysis">
                  <h3>🤖 AI Analysis</h3>
                  <pre>{cleanAnalysis(assessment.ai_analysis)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="waiting">Waiting for barcode scan...</div>
      )}
    </div>
  )
}

export default App