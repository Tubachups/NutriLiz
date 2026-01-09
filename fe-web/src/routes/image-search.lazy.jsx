import { createLazyFileRoute, useSearch } from '@tanstack/react-router'
import { useRef, useState, useEffect } from 'react'
import { useProductHistory } from '../hooks/useProductHistory'

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
  const videoSrc = "http://localhost:5000/video";
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [error, setError] = useState(null);
  const { addFoodItem } = useProductHistory();

  // Load food data from URL search params (coming from history)
  useEffect(() => {
    if (foodData) {
      try {
        const parsedData = JSON.parse(foodData);
        setResult(parsedData);
        if (foodImage) {
          setCapturedImage(foodImage);
        }
      } catch (e) {
        console.error('Failed to parse food data from URL:', e);
      }
    }
  }, [foodData, foodImage]);

  // Animate progress during analysis
  useEffect(() => {
    let interval;
    if (analyzing) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 200);
    } else {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [analyzing]);

   const captureAndAnalyze = async () => {
    if (!imgRef.current || !canvasRef.current) return;
    
    setAnalyzing(true);
    setError(null);
    setResult(null);
    setCapturedImage(null);
    
    try {
      const img = imgRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = img.naturalWidth || 640;
      canvas.height = img.naturalHeight || 480;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      
      const response = await fetch('http://localhost:5000/api/analyze-food-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          includeRecommendations: true,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setResult(data.data);
        // Add to history with the captured image
        addFoodItem(data.data, imageData);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-base-200 py-8">
      <div className="container mx-auto px-4 max-w-6xl ">
        <h1 className="text-4xl font-bold text-center ">
          🍽️ Food Image Recognition
        </h1>
        
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          
          {/* Left Column - Camera & Controls */}
          <div className="lg:col-span-1 space-y-4">
            {/* Video Feed Card */}
            <div className="card bg-base-100 shadow-xl overflow-hidden sticky top-4 rounded-sm">
              <figure className="relative">
                <img 
                  ref={imgRef}
                  src={videoSrc} 
                  alt="Live Video Feed" 
                  className="w-full aspect-[4/3] object-cover"
                  crossOrigin="anonymous"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4">
                  <button 
                    className={`btn btn-primary w-full gap-2 shadow-lg ${analyzing ? 'loading' : ''} border-none rounded-sm`}
                    onClick={captureAndAnalyze}
                    disabled={analyzing}
                  >
                    {analyzing ? 'Analyzing...' : '📸 Capture & Analyze Food'}
                  </button>
                </div>
              </figure>
            </div>

            {/* Loading State */}
            {analyzing && (
              <div className="card bg-base-100 shadow-xl">
                <div className="card-body items-center text-center py-8">
                  <div className="radial-progress text-primary" style={{ "--value": Math.round(progress), "--size": "6rem", "--thickness": "6px" }} role="progressbar">
                    {Math.round(progress)}%
                  </div>
                  <p className="mt-3 font-medium animate-pulse">Analyzing...</p>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {error && (
              <div className="alert alert-error shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>
          
          {/* Hidden canvas */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            {!result && !analyzing && (
              <div className="card bg-base-100 shadow-xl h-full min-h-[400px] rounded-sm">
                <div className="card-body items-center justify-center text-center">
                  <div className="text-8xl mb-4 opacity-20">🍎</div>
                  <h3 className="text-xl font-semibold text-base-content/60">No Food Analyzed Yet</h3>
                  <p className="text-base-content/40">Point your food at camera and click capture to analyze</p>
                </div>
              </div>
            )}

            {result && !analyzing && (
              <div className="space-y-6">
                {/* Hero Card - Food Name with Nutri-Score */}
                <div className="card bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10 shadow-xl border border-base-300">
                  <div className="card-body">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Captured Image */}
                      {capturedImage && (
                        <div className="flex-shrink-0">
                          <img 
                            src={capturedImage} 
                            alt={result.food_name || 'Captured food'} 
                            className="w-24 h-24 md:w-32 md:h-32 rounded-xl object-cover shadow-md"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h2 className="text-3xl font-bold">
                          {result.food_name || 'Unknown Food'}
                        </h2>
                        {result.food_name_local && result.food_name_local !== result.food_name && (
                          <p className="text-base-content/60 text-lg">({result.food_name_local})</p>
                        )}
                        {result.description && (
                          <p className="text-base-content/70 mt-2">{result.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                          {result.category && (
                            <span className="badge badge-primary">{result.category}</span>
                          )}
                          {result.confidence && (
                            <span className={`badge ${
                              result.confidence === 'high' ? 'badge-success' :
                              result.confidence === 'medium' ? 'badge-warning' : 'badge-error'
                            }`}>Confidence: {result.confidence}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Nutri-Score Badge */}
                      {result.nutri_score_estimate && (
                        <div className="flex flex-col items-center">
                          <span className="text-xs uppercase tracking-wider text-base-content/60 mb-1">Nutri-Score</span>
                          <div className={`text-4xl font-bold rounded-2xl w-16 h-16 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform ${
                            result.nutri_score_estimate === 'A' ? 'bg-green-500 text-white' :
                            result.nutri_score_estimate === 'B' ? 'bg-lime-400 text-white' :
                            result.nutri_score_estimate === 'C' ? 'bg-yellow-400 text-black' :
                            result.nutri_score_estimate === 'D' ? 'bg-orange-500 text-white' :
                            'bg-red-500 text-white'
                          }`}>
                            {result.nutri_score_estimate}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {result.nutrition_per_serving?.calories !== undefined && (
                    <div className="stat bg-base-100 rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
                      <div className="stat-figure text-primary text-2xl">🔥</div>
                      <div className="stat-title text-xs">Calories</div>
                      <div className="stat-value text-xl text-primary">{result.nutrition_per_serving.calories}</div>
                      <div className="stat-desc">kcal</div>
                    </div>
                  )}
                  {result.nutrition_per_serving?.protein_g !== undefined && (
                    <div className="stat bg-base-100 rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
                      <div className="stat-figure text-secondary text-2xl">💪</div>
                      <div className="stat-title text-xs">Protein</div>
                      <div className="stat-value text-xl text-secondary">{result.nutrition_per_serving.protein_g}g</div>
                    </div>
                  )}
                  {result.nutrition_per_serving?.carbohydrates_g !== undefined && (
                    <div className="stat bg-base-100 rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
                      <div className="stat-figure text-accent text-2xl">🌾</div>
                      <div className="stat-title text-xs">Carbs</div>
                      <div className="stat-value text-xl text-accent">{result.nutrition_per_serving.carbohydrates_g}g</div>
                    </div>
                  )}
                  {result.nutrition_per_serving?.fat_g !== undefined && (
                    <div className="stat bg-base-100 rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow">
                      <div className="stat-figure text-warning text-2xl">🧈</div>
                      <div className="stat-title text-xs">Fat</div>
                      <div className="stat-value text-xl text-warning">{result.nutrition_per_serving.fat_g}g</div>
                    </div>
                  )}
                </div>

                {/* Two Column Layout for Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Detailed Nutrition */}
                  {result.nutrition_per_serving && (
                    <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
                      <div className="card-body">
                        <h3 className="card-title text-lg">📊 Detailed Nutrition</h3>
                        {result.serving_size && (
                          <p className="text-sm text-base-content/60 -mt-1">Per serving: {result.serving_size}</p>
                        )}
                        <div className="space-y-2 mt-2">
                          {result.nutrition_per_serving.fiber_g !== undefined && (
                            <div className="flex justify-between items-center py-1 border-b border-base-200">
                              <span className="text-sm">Fiber</span>
                              <span className="font-semibold">{result.nutrition_per_serving.fiber_g}g</span>
                            </div>
                          )}
                          {result.nutrition_per_serving.sugar_g !== undefined && (
                            <div className="flex justify-between items-center py-1 border-b border-base-200">
                              <span className="text-sm">Sugar</span>
                              <span className="font-semibold">{result.nutrition_per_serving.sugar_g}g</span>
                            </div>
                          )}
                          {result.nutrition_per_serving.sodium_mg !== undefined && (
                            <div className="flex justify-between items-center py-1 border-b border-base-200">
                              <span className="text-sm">Sodium</span>
                              <span className="font-semibold">{result.nutrition_per_serving.sodium_mg}mg</span>
                            </div>
                          )}
                          {result.nutrition_per_serving.saturated_fat_g !== undefined && (
                            <div className="flex justify-between items-center py-1">
                              <span className="text-sm">Saturated Fat</span>
                              <span className="font-semibold">{result.nutrition_per_serving.saturated_fat_g}g</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dietary Info */}
                  {result.dietary_info && (
                    <div className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow">
                      <div className="card-body">
                        <h3 className="card-title text-lg">🥬 Dietary Information</h3>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {result.dietary_info.is_vegetarian && (
                            <span className="badge badge-success gap-1">🥕 Vegetarian</span>
                          )}
                          {result.dietary_info.is_vegan && (
                            <span className="badge badge-success gap-1">🌱 Vegan</span>
                          )}
                          {result.dietary_info.is_gluten_free && (
                            <span className="badge badge-info gap-1">🌾 Gluten-Free</span>
                          )}
                          {result.dietary_info.is_dairy_free && (
                            <span className="badge badge-info gap-1">🥛 Dairy-Free</span>
                          )}
                          {!result.dietary_info.is_vegetarian && (
                            <span className="badge badge-ghost gap-1">🍖 Contains Meat</span>
                          )}
                          {!result.dietary_info.is_gluten_free && (
                            <span className="badge badge-ghost gap-1">🍞 Contains Gluten</span>
                          )}
                          {!result.dietary_info.is_dairy_free && (
                            <span className="badge badge-ghost gap-1">🧀 Contains Dairy</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Health Info Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Health Benefits */}
                  {result.health_benefits && result.health_benefits.length > 0 && (
                    <div className="card bg-gradient-to-br from-success/10 to-base-100 shadow-md border border-success/20">
                      <div className="card-body">
                        <h3 className="card-title text-lg text-success">💚 Health Benefits</h3>
                        <ul className="space-y-2 mt-2">
                          {result.health_benefits.map((benefit, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <span className="text-success mt-0.5">✓</span>
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Potential Concerns */}
                  {result.potential_concerns && result.potential_concerns.length > 0 && (
                    <div className="card bg-gradient-to-br from-warning/10 to-base-100 shadow-md border border-warning/20">
                      <div className="card-body">
                        <h3 className="card-title text-lg text-warning">⚠️ Potential Concerns</h3>
                        <ul className="space-y-2 mt-2">
                          {result.potential_concerns.map((concern, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <span className="text-warning mt-0.5">!</span>
                              <span>{concern}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Allergens Warning - Full Width */}
                {result.allergens && result.allergens.length > 0 && (
                  <div className="alert alert-warning shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h3 className="font-bold">Allergen Warning</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {result.allergens.map((allergen, index) => (
                          <span key={index} className="badge badge-warning">{allergen}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Ingredients (for dishes) */}
                {result.ingredients_if_dish && result.ingredients_if_dish.length > 0 && (
                  <div className="card bg-base-100 shadow-md">
                    <div className="card-body">
                      <h3 className="card-title text-lg">🥗 Ingredients</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {result.ingredients_if_dish.map((ingredient, index) => (
                          <span key={index} className="badge badge-outline">{ingredient}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Preparation Notes */}
                {result.preparation_notes && (
                  <div className="card bg-base-100 shadow-md">
                    <div className="card-body">
                      <h3 className="card-title text-lg">👨‍🍳 Preparation</h3>
                      <p className="text-base-content/80">{result.preparation_notes}</p>
                    </div>
                  </div>
                )}

                {/* Personalized Advice */}
                {result.personalized_advice && (
                  <div className="card bg-gradient-to-r from-primary to-secondary text-primary-content shadow-xl">
                    <div className="card-body">
                      <h3 className="card-title text-lg">🎯 Personalized Advice</h3>
                      <p>{result.personalized_advice}</p>
                    </div>
                  </div>
                )}

                {/* Raw Data Collapse */}
                {/* <div className="collapse collapse-arrow bg-base-100 shadow-md rounded-xl">
                  <input type="checkbox" /> 
                  <div className="collapse-title text-sm font-medium text-base-content/60">
                    🔍 View Raw Data
                  </div>
                  <div className="collapse-content"> 
                    <pre className="bg-base-200 p-4 rounded-lg overflow-auto text-xs max-h-64">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </div> */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}