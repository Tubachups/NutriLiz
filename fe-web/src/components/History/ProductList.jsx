import { Trash2, CheckSquare, Square, Clock, Barcode, Camera } from 'lucide-react'

export default function ProductList({
	products,
	navigate,
	isSelected,
	toggleSelection,
	handleProductClick,
	handleDeleteSingle,
}) {
	const formatDate = (isoString) => {
		const date = new Date(isoString)
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	const getNutriscoreColor = (grade) => {
		const colors = {
			a: 'bg-green-600',
			b: 'bg-lime-500',
			c: 'bg-yellow-400',
			d: 'bg-orange-500',
			e: 'bg-red-500',
		}
		return colors[grade?.toLowerCase()] || 'bg-gray-400'
	}

	if (products.length === 0) {
		return (
			<div className="bg-white rounded-xl shadow-lg p-12 text-center border border-accent">
				<div className="text-6xl mb-4">📱</div>
				<h3 className="text-xl font-semibold text-gray-700 mb-2">No Products Scanned</h3>
				<p className="text-gray-500 mb-6">Your scanned products will appear here.</p>
				<div className="flex justify-center gap-4">
					<button
						onClick={() => navigate({ to: '/scan' })}
						className="px-6 py-3 bg-dark text-white rounded-lg hover:opacity-90 transition-colors"
					>
						Scan a Barcode
					</button>
					<button
						onClick={() => navigate({ to: '/image-search' })}
						className="px-6 py-3 bg-accent text-gray-800 rounded-lg hover:opacity-90 transition-colors"
					>
						Scan Food
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-3">
			{products.map((product) => {
				const isFoodScan = product.type === 'food' || product.barcode?.startsWith('food_')

				return (
					<div
						key={product.id}
						className={`bg-white rounded-lg shadow-md border-2 transition-all hover:shadow-lg cursor-pointer ${
							isSelected(product.id)
								? 'border-dark bg-secondary/20'
								: 'border-transparent'
						}`}
					>
						<div className="flex items-center p-4 gap-4">
							<button
								onClick={(e) => {
									e.stopPropagation()
									toggleSelection(product.id)
								}}
								className="shrink-0 cursor-pointer"
							>
								{isSelected(product.id) ? (
									<CheckSquare size={24} className="text-dark" />
								) : (
									<Square size={24} className="text-gray-400" />
								)}
							</button>

							<div className="shrink-0" onClick={() => handleProductClick(product)}>
								{product.image ? (
									<img
										src={product.image}
										alt={product.name}
										className="w-16 h-16 rounded-lg object-cover"
									/>
								) : (
									<div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
										<span className="text-gray-400 text-xs">No Image</span>
									</div>
								)}
							</div>

							<div className="flex-1 min-w-0" onClick={() => handleProductClick(product)}>
								<h3 className="font-semibold text-gray-800 truncate">{product.name}</h3>
								{product.brand && (
									<p className="text-sm text-gray-500 truncate">{product.brand}</p>
								)}
								<div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
									<Clock size={12} />
									<span>{formatDate(product.scannedAt)}</span>
									<span className="text-gray-300">•</span>
									{isFoodScan ? (
										<span className="flex items-center gap-1">
											<Camera size={12} />
											Food Scan
										</span>
									) : (
										<span className="flex items-center gap-1">
											<Barcode size={12} />
											{product.barcode}
										</span>
									)}
								</div>
							</div>

							<div className="flex items-center gap-3">
								{product.nutriscore && (
									<div
										className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg ${getNutriscoreColor(
											product.nutriscore
										)}`}
									>
										{typeof product.nutriscore === 'string'
											? product.nutriscore.toUpperCase()
											: product.nutriscore}
									</div>
								)}

								<button
									onClick={(e) => {
										e.stopPropagation()
										handleDeleteSingle(product.id, product.name)
									}}
									className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
								>
									<Trash2 size={20} />
								</button>
							</div>
						</div>
					</div>
				)
			})}
		</div>
	)
}
