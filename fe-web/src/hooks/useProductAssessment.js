import { useEffect, useState } from "react";

export const useProductAssessment = (barcode) => {
  const [assessment, setAssessment] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {

    setAssessment(null)
    setError(null)

    if (!barcode) {
      return
    }

    const fetchAssessment = async () => {
      setLoading(true)
      
      try {
        const response = await fetch(`http://localhost:5000/api/assess/${barcode}`)
        
        if (response.ok) {
          const data = await response.json()
          setAssessment(data)
        } else {
          setError('Failed to generate assessment')
        }
      } catch (err) {
        setError('Failed to generate assessment')
      } finally {
        setLoading(false)
      }
    }

    fetchAssessment()
  }, [barcode])

  return { assessment, loading, error }
}