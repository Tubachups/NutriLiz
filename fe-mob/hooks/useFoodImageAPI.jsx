import { useState } from 'react';

const API_BASE_URL = 'http://192.168.8.34:5000'; // Update this to your backend IP address

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

  return { analyzeFoodImage, loading, error };
};