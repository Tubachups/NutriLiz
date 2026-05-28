import { useEffect, useRef } from 'react'

function FoodCarousel({ items, activeIndex, onChange, title, renderItem }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const width = container.clientWidth
    if (!width) return
    container.scrollTo({ left: width * activeIndex, behavior: 'smooth' })
  }, [activeIndex, items.length])

  const handleScroll = () => {
    const container = containerRef.current
    if (!container) return
    const width = container.clientWidth
    if (!width) return
    const nextIndex = Math.round(container.scrollLeft / width)
    if (nextIndex !== activeIndex) {
      onChange(nextIndex)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-base-content">{title}</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => onChange(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            aria-label="Previous"
          >
            ‹
          </button>
          <span className="text-xs text-base-content/60">
            {activeIndex + 1} / {items.length}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => onChange(Math.min(items.length - 1, activeIndex + 1))}
            disabled={activeIndex === items.length - 1}
            aria-label="Next"
          >
            ›
          </button>
        </div>
      </div>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 scroll-smooth"
      >
        {items.map((item, index) => (
          <div key={`${item?.food_name || 'food'}-${index}`} className="min-w-full snap-start">
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}

export default FoodCarousel
