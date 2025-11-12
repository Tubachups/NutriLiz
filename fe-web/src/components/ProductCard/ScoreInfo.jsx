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

const NutriScoreBadge = ({ grade }) => {
  const grades = ['A', 'B', 'C', 'D', 'E']
  const colors = {
    'A': '#008000',
    'B': '#85BB2F',
    'C': '#FFCC00',
    'D': '#FF6600',
    'E': '#FF0000'
  }
  
  const currentGrade = grade?.toUpperCase()
  
  return (
    <div className="inline-flex flex-col items-center bg-white rounded-lg p-3 shadow-md">
      <div className="text-sm font-bold text-gray-700 mb-2">NUTRI-SCORE</div>
      <div className="flex gap-1">
        {grades.map((g) => {
          const isActive = g === currentGrade
          return (
            <div
              key={g}
              className={`relative w-10 h-12 flex items-center justify-center font-bold text-lg transition-all ${
                isActive ? 'scale-125 z-10' : 'opacity-60'
              }`}
              style={{
                backgroundColor: colors[g],
                color: 'white',
                borderRadius: isActive ? '50%' : '4px',
                border: isActive ? '3px solid white' : 'none',
                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
              }}
            >
              {g}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const ScoresInfo = ({ nutriScore, nutriGrade, novaGroup, ecoscoreGrade, ecoscoreScore }) => {
  return (
    <section className="bg-accent/30 rounded-lg p-4">
      <h3 className="text-xl font-semibold mb-3 text-gray-800">📊 Scores & Environmental Impact</h3>
      <div className="space-y-4 text-gray-700">
        <div className="bg-white/60 rounded px-3 py-3 flex items-center gap-4">
          <NutriScoreBadge grade={nutriGrade} />
          <div className="text-sm text-gray-600">
            Score: {nutriScore}
          </div>
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