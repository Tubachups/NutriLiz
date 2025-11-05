const ProductHeader = ({ imageUrl, name }) => {
  return (
    <div className=" p-6">
      {imageUrl && (
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-50 object-contain rounded-lg bg-white shadow-md mb-4"
          onError={(e) => {
            e.target.style.display = 'none'
          }}
        />
      )}
      <h2 className="text-2xl font-bold text-gray-800 text-center">{name}</h2>
    </div>
  )
}

export default ProductHeader