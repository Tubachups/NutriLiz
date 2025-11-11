const GeneralInfo = ({ type, manufacturingPlaces, quantity, ingredientsText }) => {
  return (
    <section className="bg-primary/50 rounded-lg p-4">
      <h3 className="text-xl font-semibold mb-3 text-gray-800">ℹ️ General Information</h3>
      <div className="space-y-2 text-gray-700">
        <p>
          <strong className="font-semibold">Type:</strong> {type}
        </p>
        <p>
          <strong className="font-semibold">Manufacturing Places:</strong> {manufacturingPlaces}
        </p>
        <p>
          <strong className="font-semibold">Serving Quantity:</strong> {quantity}
        </p>
        <p>
          <strong className="font-semibold">Ingredients:</strong> {ingredientsText}
        </p>
      </div>
    </section>
  )
}

export default GeneralInfo