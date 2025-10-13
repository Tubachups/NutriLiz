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
    <section>
      <h3>Scores & Environmental Impact</h3>
      <p><strong>Nutri-Score:</strong> {nutriScore} (Grade: <span style={{
        backgroundColor: nutriGrade ? `var(--nutriscore-${nutriGrade})` : 'transparent',
        padding: '2px 8px',
        borderRadius: '4px',
        fontWeight: 'bold'
      }}>{nutriGrade?.toUpperCase()}</span>)</p>

      {novaGroup !== 'N/A' && (
        <p><strong>NOVA Group:</strong> {novaGroup} - {getNovaLabel(novaGroup)}</p>
      )}

      {ecoscoreGrade !== 'N/A' && (
        <p><strong>Eco-Score:</strong>
          <span style={{
            backgroundColor: getEcoscoreColor(ecoscoreGrade),
            color: 'white',
            padding: '2px 8px',
            borderRadius: '4px',
            fontWeight: 'bold',
            marginLeft: '8px'
          }}>
            {ecoscoreGrade?.toUpperCase()}
          </span>
          {ecoscoreScore !== 'N/A' && ` (${ecoscoreScore}/100)`}
        </p>
      )}
    </section>
  )
}

export default ScoresInfo