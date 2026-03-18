import { useCallback, useState } from 'react'

const API_BASE_URL = 'http://192.168.100.69:5000'

export function useFoodImageAPI() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const analyzeFoodImage = useCallback(async (imageBase64, signal, userProfile = null) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze-food-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageBase64,
          userProfile,
          includeRecommendations: true,
        }),
        signal,
      })

      const data = await response.json()
      if (response.ok && data.success) {
        return data.data
      }

      setError(data.error || 'Failed to analyze food image')
      return null
    } catch (err) {
      if (err?.name === 'AbortError') {
        return null
      }
      setError('Failed to connect to server')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const confirmFoodName = useCallback(async (foodData, confirmedName, signal) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/confirm-food-name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          foodData,
          confirmedName,
        }),
        signal,
      })

      const data = await response.json()
      if (response.ok && data.success) {
        return data.data
      }

      setError(data.error || 'Failed to confirm food name')
      return null
    } catch (err) {
      if (err?.name === 'AbortError') {
        return null
      }
      setError('Failed to connect to server')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { analyzeFoodImage, confirmFoodName, loading, error }
}