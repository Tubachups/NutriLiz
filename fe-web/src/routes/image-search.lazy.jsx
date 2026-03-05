import { createLazyFileRoute, useSearch } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Utensils } from 'lucide-react'
import { useProductHistory } from '../hooks/useProductHistory'
import CapturePanel from '../components/ImageSearch/CapturePanel'
import ResultsPanel from '../components/ImageSearch/ResultsPanel'
import DisclaimerModal from '../components/ImageSearch/DisclaimerModal'

export const Route = createLazyFileRoute('/image-search')({
  component: RouteComponent,
  validateSearch: (search) => {
    return {
      foodData: search.foodData || null,
      foodImage: search.foodImage || null,
    }
  },
})

function RouteComponent() {
  const { foodData, foodImage } = useSearch({ from: '/image-search' })
  const videoSrc = 'http://192.168.8.99:5000/video'
  const imgRef = useRef(null)
  const canvasRef = useRef(null)

  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [error, setError] = useState(null)
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  const { addFoodItem } = useProductHistory()

  useEffect(() => {
    if (foodData) {
      try {
        const parsedData = JSON.parse(foodData)
        setResult(parsedData)
        if (foodImage) {
          setCapturedImage(foodImage)
        }
      } catch (e) {
        console.error('Failed to parse food data from URL:', e)
      }
    }
  }, [foodData, foodImage])

  useEffect(() => {
    let interval

    if (analyzing) {
      setProgress(0)
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev
          return prev + Math.random() * 15
        })
      }, 200)
    } else {
      setProgress(100)
    }

    return () => clearInterval(interval)
  }, [analyzing])

  const captureAndAnalyze = async () => {
    if (!imgRef.current || !canvasRef.current) return

    setAnalyzing(true)
    setError(null)
    setResult(null)
    setCapturedImage(null)

    try {
      const img = imgRef.current
      const canvas = canvasRef.current

      canvas.width = img.naturalWidth || 640
      canvas.height = img.naturalHeight || 480

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      setCapturedImage(imageData)

      const response = await fetch('http://192.168.100.69:5000/api/analyze-food-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          includeRecommendations: true,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult(data.data)
        await addFoodItem(data.data, imageData)
        setShowDisclaimer(true)
      } else {
        setError(data.error || 'Analysis failed')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#ecf4e8] from-base-200 via-base-100 to-base-200 py-8">
      <div className="container mx-auto px-4 max-w-6xl ">
        <h1 className="text-4xl font-bold text-center flex items-center justify-center gap-3">
          <Utensils className="w-10 h-10" />
          Food Image Recognition
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          <CapturePanel
            videoSrc={videoSrc}
            imgRef={imgRef}
            analyzing={analyzing}
            progress={progress}
            error={error}
            onCapture={captureAndAnalyze}
          />

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <div className="lg:col-span-2">
            <ResultsPanel result={result} analyzing={analyzing} capturedImage={capturedImage} />
          </div>
        </div>
      </div>

      <DisclaimerModal show={showDisclaimer} onClose={() => setShowDisclaimer(false)} />
    </div>
  )
}
