const getNovaLabel = (novaGroup) => {
  const labels = {
    1: 'Unprocessed or minimally processed',
    2: 'Processed culinary ingredients',
    3: 'Processed foods',
    4: 'Ultra-processed foods'
  }
  return labels[novaGroup] || 'Unknown'
}

const getEcoscoreColor = (grade) => {
  const colors = {
    'a': '#008000',
    'b': '#85BB2F',
    'c': '#FFCC00',
    'd': '#FF6600',
    'e': '#FF0000'
  }
  return colors[grade?.toLowerCase()] || '#999'
}

const ScoresInfo = ({ nutriScore, nutriGrade, novaGroup, ecoscoreGrade, ecoscoreScore }) => {
  return (
    <section className="bg-accent/30 rounded-lg p-4">
      <h3 className="text-xl font-semibold mb-3 text-gray-800">📊 Scores & Environmental Impact</h3>
      <div className="space-y-3 text-gray-700">
        <div className="bg-white/60 rounded px-3 py-2">
          <strong className="font-semibold">Nutri-Score:</strong> {nutriScore} (Grade:{' '}
          <span 
            className="inline-block px-2 py-1 rounded font-bold text-white"
            style={{
              backgroundColor: getEcoscoreColor(nutriGrade)
            }}
          >
            {nutriGrade?.toUpperCase()}
          </span>)
        </div>

        {novaGroup !== 'N/A' && (
          <div className="bg-white/60 rounded px-3 py-2">
            <strong className="font-semibold">NOVA Group:</strong> {novaGroup} - {getNovaLabel(novaGroup)}
          </div>
        )}

        {ecoscoreGrade !== 'N/A' && (
          <div className="bg-white/60 rounded px-3 py-2">
            <strong className="font-semibold">Eco-Score:</strong>
            <span 
              className="inline-block px-2 py-1 rounded font-bold text-white ml-2"
              style={{
                backgroundColor: getEcoscoreColor(ecoscoreGrade)
              }}
            >
              {ecoscoreGrade?.toUpperCase()}
            </span>
            {ecoscoreScore !== 'N/A' && ` (${ecoscoreScore}/100)`}
          </div>
        )}
      </div>
    </section>
  )
}

export default ScoresInfo