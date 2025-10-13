const ProductHeader = ({ imageUrl, name }) => {
  return (
    <div className="product-header">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={name}
          className="product-image"
          onError={(e) => {
            e.target.style.display = 'none'
          }}
        />
      )}
      <h2>{name}</h2>
    </div>
  )
}

export default ProductHeader