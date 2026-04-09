import { useState } from 'react';

const API_BASE_URL = 'http://192.168.100.69:5000'
// const API_BASE_URL = 'https://nutriliz-be-a8351183c68f.herokuapp.com/';

export const useFoodImageAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeFoodImage = async (imageBase64, userProfile = null) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze-food-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageBase64,
          userProfile: userProfile,
          includeRecommendations: true,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return data.data;
      } else {
        setError(data.error || 'Failed to analyze food image');
        return null;
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Food Image API Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const confirmFoodName = async (foodData, confirmedName) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/confirm-food-name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          foodData,
          confirmedName,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return data.data;
      }

      setError(data.error || 'Failed to confirm food name');
      return null;
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Confirm Food Name API Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { analyzeFoodImage, confirmFoodName, loading, error };
};