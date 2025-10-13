const LabelsInfo = ({ labels, labelsTags, awards }) => {
  if (labels === 'N/A' && (!labelsTags || labelsTags.length === 0)) {
    return null
  }

  return (
    <section>
      <h3>Labels & Certifications</h3>
      {labels !== 'N/A' && (
        <div className="labels-container">
          {labels.split(',').map((label, index) => (
            <span key={index} className="label-badge">
              {label.trim()}
            </span>
          ))}
        </div>
      )}
      {awards !== 'N/A' && (
        <p><strong>Awards:</strong> {awards}</p>
      )}
    </section>
  )
}

export default LabelsInfo