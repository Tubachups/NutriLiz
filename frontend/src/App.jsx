import './css/App.css'
import { useProductScanner } from './hooks/useProductScanner'
import LoadingStates from './components/LoadingStates/LoadingStates'
import ProductCard from './components/ProductCard/ProductCard'

const App = () => {
  const { productData, loading, error } = useProductScanner()

  return (
    <div className="app-container">
      <h1>NutriLiz - Barcode Scanner</h1>

      <LoadingStates loading={loading} error={error} />

      {productData ? (
        <ProductCard productData={productData} />
      ) : (
        <div className="waiting">Waiting for barcode scan...</div>
      )}
    </div>
  )
}

export default App