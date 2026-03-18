import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react'

const API_BASE_URL = 'http://192.168.100.69:5000'

export default function FoodDisambiguationModal({
  show,
  alternatives = [],
  foodContext = {},
  onConfirm,
  onDismiss,
}) {
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [customInput, setCustomInput] = useState('')
  const [validating, setValidating] = useState(false)
  const [validationError, setValidationError] = useState('')
  const optionsRef = useRef(null)

  useEffect(() => {
    if (!show) {
      setSelectedIndex(null)
      setCustomInput('')
      setValidationError('')
      setValidating(false)
    }
  }, [show])

  useEffect(() => {
    if (selectedIndex === 'other' && validationError && optionsRef.current) {
      optionsRef.current.scrollTop = optionsRef.current.scrollHeight
    }
  }, [selectedIndex, validationError])

  if (!show) return null

  const handleConfirm = async () => {
    if (selectedIndex === null) {
      setValidationError('Please choose an option before continuing.')
      return
    }

    if (selectedIndex === 'other') {
      const trimmed = customInput.trim()
      if (!trimmed) {
        setValidationError('Please type the food or beverage name.')
        return
      }

      setValidating(true)
      setValidationError('')

      try {
        const response = await fetch(`${API_BASE_URL}/api/validate-food-input`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            food_name: trimmed,
            context: foodContext,
          }),
        })

        const data = await response.json()
        if (data.valid) {
          onConfirm(data.sanitized_name || trimmed)
          return
        }

        setValidationError(data.reason || 'That name does not match the detected food context. Try another option.')
      } catch {
        setValidationError('Could not validate the name. Please check your connection and try again.')
      } finally {
        setValidating(false)
      }

      return
    }

    onConfirm(alternatives[selectedIndex])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <HelpCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Clarify Your Food</h3>
            <p className="text-sm text-gray-600">We're not fully certain what this is. Select the most accurate option or enter the name yourself</p>
          </div>
        </div>

        <div ref={optionsRef} className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-base-200 p-3">
          {alternatives.map((name, index) => (
            <button
              key={`${name}-${index}`}
              type="button"
              onClick={() => {
                setSelectedIndex(index)
                setValidationError('')
              }}
              className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
                selectedIndex === index ? 'border-primary bg-primary/5' : 'border-base-200 hover:border-primary/40'
              }`}
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                  selectedIndex === index ? 'border-primary bg-primary text-white' : 'border-base-300'
                }`}
              >
                {selectedIndex === index ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
              </span>
              <span className="font-medium text-gray-800">{name}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => {
              setSelectedIndex('other')
              setValidationError('')
            }}
            className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
              selectedIndex === 'other' ? 'border-primary bg-primary/5' : 'border-base-200 hover:border-primary/40'
            }`}
          >
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                selectedIndex === 'other' ? 'border-primary bg-primary text-white' : 'border-base-300'
              }`}
            >
              {selectedIndex === 'other' ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
            </span>
            <span className="font-medium text-gray-800">Other</span>
          </button>

          {selectedIndex === 'other' ? (
            <div className="space-y-2 pt-1">
              <input
                type="text"
                value={customInput}
                onChange={(event) => {
                  setCustomInput(event.target.value)
                  setValidationError('')
                }}
                maxLength={100}
                placeholder="Type the food or beverage name"
                className={`input input-bordered w-full ${validationError ? 'input-error' : ''}`}
              />
              <p className="text-xs text-base-content/60">Only context-relevant names are accepted for safety.</p>
            </div>
          ) : null}

          {validationError ? (
            <div className="mt-2 flex items-start gap-2 rounded-md bg-error/10 p-2 text-sm text-error">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-5 flex gap-3">
          <button type="button" className="btn flex-1" onClick={onDismiss} disabled={validating}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn btn-primary flex-1 ${validating ? 'loading' : ''}`}
            onClick={handleConfirm}
            disabled={selectedIndex === null || validating}
          >
            {validating ? 'Validating...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}