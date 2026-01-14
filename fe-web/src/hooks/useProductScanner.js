import { useState, useEffect, useRef } from 'react'
import { useScanContext } from './scan-context'

export const useProductScanner = (initialBarcode = null) => {
  const { productData, updateProductData } = useScanContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const lastBarcodeRef = useRef(null)

  // Fetch product data when initialBarcode is provided (from URL params)
  useEffect(() => {
    if (initialBarcode && initialBarcode !== lastBarcodeRef.current) {
      lastBarcodeRef.current = initialBarcode
      fetchProductData(initialBarcode)
    }
  }, [initialBarcode])

  useEffect(() => {
    const pollForBarcode = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/latest-barcode')
        const data = await response.json()

        // Only fetch if it's a new barcode
        if (data.barcode && data.barcode !== lastBarcodeRef.current) {
          lastBarcodeRef.current = data.barcode
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
        updateProductData(data)
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