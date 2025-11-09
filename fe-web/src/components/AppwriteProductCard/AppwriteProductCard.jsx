
const AppwriteProductCard = ({ productData }) => {
  const { product, nutrition, image_url, message } = productData

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-accent">
      <div className=" p-6">
        {image_url && (
          <img 
            src={image_url} 
            alt={product?.name || 'Product'} 
            className="w-full h-64 object-contain rounded-lg bg-white shadow-md mb-4"
          />
        )}
        <h2 className="text-2xl font-bold text-gray-800 text-center">
          {product?.name || 'Unknown Product'}
        </h2>
        {product?.category && (
          <span className="inline-block bg-dark text-white px-3 py-1 rounded-full text-sm font-medium mt-2">
            {product.category}
          </span>
        )}
      </div>

      {message && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 m-6">
          <p className="text-blue-800">
            ℹ️ {message}
          </p>
        </div>
      )}

      {nutrition && (
        <section className="p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            📊 Nutritional Information (per 100g)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(nutrition).map(([key, value]) => (
              <div 
                key={key} 
                className="flex justify-between items-center bg-secondary/20 rounded px-3 py-2"
              >
                <span className="font-semibold text-gray-700">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <span className="text-gray-600">{value}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default AppwriteProductCard