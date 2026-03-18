import { createLazyFileRoute, useSearch } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Utensils } from 'lucide-react'
import { useProductHistory } from '../hooks/useProductHistory'
import { useFoodImageAPI } from '../hooks/useFoodImageAPI'
import CapturePanel from '../components/ImageSearch/CapturePanel'
import ResultsPanel from '../components/ImageSearch/ResultsPanel'
import DisclaimerModal from '../components/ImageSearch/DisclaimerModal'
import FoodDisambiguationModal from '../components/ImageSearch/FoodDisambiguationModal'

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
  const apiBaseUrl = 'http://192.168.100.69:5000'
  const videoSrc = `${apiBaseUrl}/video`
  const imgRef = useRef(null)
  const canvasRef = useRef(null)
  const requestControllerRef = useRef(null)

  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [capturedImage, setCapturedImage] = useState(null)
  const [error, setError] = useState(null)
  const [processingMessage, setProcessingMessage] = useState('')
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [disambiguationData, setDisambiguationData] = useState(null)
  const [showDisambiguationModal, setShowDisambiguationModal] = useState(false)

  const { addFoodItem } = useProductHistory()
  const { analyzeFoodImage, confirmFoodName, loading: foodApiLoading } = useFoodImageAPI()
  const isProcessing = analyzing || foodApiLoading

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
    return () => {
      requestControllerRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    let interval

    if (isProcessing) {
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
  }, [isProcessing])

  const finalizeFoodResult = async (foodResult, imageData) => {
    setResult(foodResult)
    await addFoodItem(foodResult, imageData)
    setShowDisclaimer(true)
  }

  const captureAndAnalyze = async () => {
    if (!imgRef.current || !canvasRef.current || isProcessing) return

    requestControllerRef.current?.abort()
    const controller = new AbortController()
    requestControllerRef.current = controller

    setAnalyzing(true)
    setError(null)
    setProcessingMessage('Analyzing captured image...')
    setResult(null)
    setCapturedImage(null)
    setDisambiguationData(null)
    setShowDisambiguationModal(false)

    try {
      const img = imgRef.current
      const canvas = canvasRef.current

      canvas.width = img.naturalWidth || 640
      canvas.height = img.naturalHeight || 480

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      setCapturedImage(imageData)

      const foodResult = await analyzeFoodImage(imageData, controller.signal)

      if (foodResult?.identified) {
        const confidence = String(foodResult.confidence || '').toLowerCase()
        const requiresConfirmation =
          foodResult.disambiguation_needed || confidence === 'medium' || confidence === 'low'

        if (requiresConfirmation) {
          setProcessingMessage('Awaiting your food verification...')
          setDisambiguationData({ foodData: foodResult, imageData })
          setShowDisambiguationModal(true)
          return
        }

        await finalizeFoodResult(foodResult, imageData)
      } else if (foodResult && !foodResult.identified) {
        setError(foodResult.description || 'Could not identify the food in this image')
      } else {
        setError('Analysis failed')
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setError(err.message || 'Unexpected error during analysis')
      }
    } finally {
      setAnalyzing(false)
      setProcessingMessage('')
    }
  }

  const handleDisambiguationConfirm = async (resolvedName) => {
    if (!disambiguationData) return

    const { foodData: unresolvedFoodData, imageData } = disambiguationData
    setShowDisambiguationModal(false)

    requestControllerRef.current?.abort()
    const controller = new AbortController()
    requestControllerRef.current = controller
    setProcessingMessage('Finalizing USDA nutrition data...')

    try {
      const confirmedData = await confirmFoodName(unresolvedFoodData, resolvedName, controller.signal)
      const updatedFoodData = confirmedData || {
        ...unresolvedFoodData,
        food_name: resolvedName,
        user_corrected_name: true,
      }

      await finalizeFoodResult(updatedFoodData, imageData)
      setDisambiguationData(null)
    } catch {
      setError('Failed to confirm food name. Please retry.')
    } finally {
      setProcessingMessage('')
    }
  }

  const handleDisambiguationDismiss = () => {
    setShowDisambiguationModal(false)
    setDisambiguationData(null)
    setCapturedImage(null)
    setResult(null)
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
            frozenFrame={capturedImage}
            imgRef={imgRef}
            analyzing={isProcessing}
            progress={progress}
            processingMessage={processingMessage}
            error={error}
            onCapture={captureAndAnalyze}
          />

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <div className="lg:col-span-2">
            <ResultsPanel result={result} analyzing={isProcessing} capturedImage={capturedImage} />
          </div>
        </div>
      </div>

      <DisclaimerModal show={showDisclaimer} onClose={() => setShowDisclaimer(false)} />

      <FoodDisambiguationModal
        show={showDisambiguationModal}
        alternatives={disambiguationData?.foodData?.alternatives ?? []}
        foodContext={{
          food_name: disambiguationData?.foodData?.food_name ?? '',
          category: disambiguationData?.foodData?.category ?? '',
          description: disambiguationData?.foodData?.description ?? '',
        }}
        onConfirm={handleDisambiguationConfirm}
        onDismiss={handleDisambiguationDismiss}
      />
    </div>
  )
}
