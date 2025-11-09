import { useState, useEffect } from 'react'

export const useProductScanner = () => {
  const [productData, setProductData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const pollForBarcode = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/latest-barcode')
        const data = await response.json()

        if (data.barcode) {
          fetchProductData(data.barcode)
        }
      } catch (err) {
        console.error('Error polling for barcode:', err)
      }
    }

    const interval = setInterval(pollForBarcode, 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchProductData = async (barcode) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`http://localhost:5000/api/product/${barcode}`)
      const data = await response.json()

      if (response.ok) {
        setProductData(data)
      } else {
        setError('Search query limit reached. Please retry after 1 minute.')
      }
    } catch (err) {
      setError('Failed to fetch product data', err)
    } finally {
      setLoading(false)
    }
  }

  return { productData, loading, error }
}