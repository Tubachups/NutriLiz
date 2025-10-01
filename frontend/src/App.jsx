import { useState, useEffect } from 'react'
import './App.css'

const App = () => {
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
        setError('Product not found')
      }
    } catch (err) {
      setError('Failed to fetch product data', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <h1>NutriLiz - Barcode Scanner</h1>
      
      {loading && <div className="loading">Loading product data...</div>}
      {error && <div className="error">{error}</div>}
      
      {productData ? (
        <div className="product-card">
          <h2>{productData.name}</h2>
          
          <section>
            <h3>General Information</h3>
            <p><strong>Type:</strong> {productData.type}</p>
            <p><strong>Manufacturing Places:</strong> {productData.manufacturing_places}</p>
            <p><strong>Quantity:</strong> {productData.quantity}</p>
            <p><strong>Serving Quantity:</strong> {productData.serving_quantity}</p>
          </section>

          <section>
            <h3>Nutrition (per 100g / per serving)</h3>
            <p><strong>Energy:</strong> {productData.energy_kcal_100g} kcal / {productData.energy_kcal_serving} kcal</p>
            <p><strong>Carbohydrates:</strong> {productData.carbohydrates_100g}g / {productData.carbohydrates_serving}g</p>
            <p><strong>Sugars:</strong> {productData.sugars_100g}g / {productData.sugars_serving}g</p>
            <p><strong>Fat:</strong> {productData.fat_100g}g / {productData.fat_serving}g</p>
            <p><strong>Saturated Fat:</strong> {productData.saturated_fat_100g}g / {productData.saturated_fat_serving}g</p>
            <p><strong>Fiber:</strong> {productData.fiber_100g}g / {productData.fiber_serving}g</p>
            <p><strong>Proteins:</strong> {productData.proteins_100g}g / {productData.proteins_serving}g</p>
            <p><strong>Salt:</strong> {productData.salt_100g}g / {productData.salt_serving}g</p>
            <p><strong>Sodium:</strong> {productData.sodium_100g}g / {productData.sodium_serving}g</p>
            <p><strong>Calcium:</strong> {productData.calcium_100g}g / {productData.calcium_serving}g</p>
          </section>

          <section>
            <h3>Scores</h3>
            <p><strong>Nutri-Score:</strong> {productData.nutri_score} (Grade: {productData.nutri_grade})</p>
            <p><strong>Fruits/Vegetables:</strong> {productData.fruits_vegetables_100}%</p>
            <p><strong>CO2 Total:</strong> {productData.co2_total}</p>
            <p><strong>Eco-Score:</strong> {productData.ef_total}</p>
          </section>
        </div>
      ) : (
        <div className="waiting">Waiting for barcode scan...</div>
      )}
    </div>
  )
}

export default App