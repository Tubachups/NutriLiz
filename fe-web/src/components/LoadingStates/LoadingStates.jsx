const LoadingStates = ({ loading, error }) => {
  if (loading) {
    return (
      <div className="bg-secondary rounded-xl shadow-lg p-6 text-center text-gray-800 mb-6 animate-pulse border border-accent">
        <div className="text-4xl mb-2">⏳</div>
        <p className="text-lg font-medium">Loading product data...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-300 rounded-xl shadow-lg p-6 text-center text-red-800 mb-6">
        <div className="text-4xl mb-2">❌</div>
        <p className="text-lg font-medium">{error}</p>
      </div>
    )
  }
  
  return null
}

export default LoadingStates