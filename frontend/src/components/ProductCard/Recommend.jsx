

const Recommend = ({ recommendations, count }) => {
  if (!recommendations || recommendations.length === 0) {
    return null
  }

  return (
    <section className="bg-secondary/30 rounded-lg p-4">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">
        🔍 Recommended Similar Products ({count})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec) => (
          <div 
            key={rec.barcode} 
            className="bg-white rounded-lg shadow-md overflow-hidden border border-accent hover:shadow-lg transition-shadow"
          >
            {rec.image_url && (
              <img 
                src={rec.image_url} 
                alt={rec.name}
                className="w-full h-40 object-cover"
              />
            )}
            <div className="p-4">
              <h4 className="font-bold text-gray-800 mb-2 line-clamp-2">{rec.name}</h4>
              <p className="text-sm text-gray-600 mb-1">{rec.brand}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs bg-dark text-white px-2 py-1 rounded-full font-medium">
                  Match: {(rec.similarity_score * 100).toFixed(1)}%
                </span>
                <span className="text-xs text-gray-600">
                  📍 {rec.manufacturing_places}
                </span>
              </div>
            </div>
          </div>
        ))}
            </div>
    </section>
  )
}

export default Recommend
