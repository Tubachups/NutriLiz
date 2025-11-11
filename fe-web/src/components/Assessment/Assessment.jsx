// src/components/Assessment/Assessment.jsx
import React from 'react'

const Assessment = ({ assessment, loading, error, isAppwriteProduct }) => {
  const cleanAnalysis = (text) => {
    if (!text) return ''
    return text.replace(/\*\*/g, '')
  }

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center text-blue-800 animate-pulse">
        🤖 AI is analyzing product health risks...
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        ⚠️ {error}
      </div>
    )
  }

  if (!assessment) return null

  return (
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
  )
}

export default Assessment
