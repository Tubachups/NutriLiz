const Recommend = ({ recommendations, count }) => {
  if (!recommendations || recommendations.length === 0) {
    return null
  }

  return (
    <section className="recommendations-section">
      <h3>🔍 Recommended Similar Products ({count})</h3>
      <div className="recommendations-grid">
        {recommendations.map((rec) => (
          <div key={rec.barcode} className="recommendation-card">
            {rec.image_url && (
              <img 
                src={rec.image_url} 
                alt={rec.name}
                className="recommendation-image"
              />
            )}
            <div className="recommendation-info">
              <h4>{rec.name}</h4>
              <p className="recommendation-brand">{rec.brand}</p>
              <p className="recommendation-similarity">
                Match: {(rec.similarity_score * 100).toFixed(1)}%
              </p>
              <p className="recommendation-location">
                📍 {rec.manufacturing_places}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Recommend