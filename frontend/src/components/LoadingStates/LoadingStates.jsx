const LoadingStates = ({ loading, error }) => {
  if (loading) {
    return <div className="loading">Loading product data...</div>
  }
  
  if (error) {
    return <div className="error">{error}</div>
  }
  
  return null
}

export default LoadingStates