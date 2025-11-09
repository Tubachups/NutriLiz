const LabelsInfo = ({ labels, labelsTags, awards }) => {
  if (labels === 'N/A' && (!labelsTags || labelsTags.length === 0)) {
    return null
  }

  return (
    <section className="bg-primary/50 rounded-lg p-4">
      <h3 className="text-xl font-semibold mb-3 text-gray-800">🏷️ Labels & Certifications</h3>
      {labels !== 'N/A' && (
        <div className="flex flex-wrap gap-2 mb-3">
          {labels.split(',').map((label, index) => (
            <span 
              key={index} 
              className="inline-block bg-dark text-white px-3 py-1 rounded-full text-sm font-medium"
            >
              {label.trim()}
            </span>
          ))}
        </div>
      )}
      {awards !== 'N/A' && (
        <div className="bg-white/60 rounded px-3 py-2 text-gray-700">
          <strong className="font-semibold">Awards:</strong> {awards}
        </div>
      )}
    </section>
  )
}

export default LabelsInfo