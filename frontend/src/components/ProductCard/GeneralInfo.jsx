const GeneralInfo = ({ type, manufacturingPlaces, quantity, servingQuantity }) => {
  return (
    <section>
      <h3>General Information</h3>
      <p><strong>Type:</strong> {type}</p>
      <p><strong>Manufacturing Places:</strong> {manufacturingPlaces}</p>
      <p><strong>Quantity:</strong> {quantity}</p>
      <p><strong>Serving Quantity:</strong> {servingQuantity}</p>
    </section>
  )
}

export default GeneralInfo