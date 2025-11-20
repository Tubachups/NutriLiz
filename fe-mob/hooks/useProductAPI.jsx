import { useState } from 'react';

// Update this to your backend IP address
const API_BASE_URL = 'http://172.28.246.90:5000'; // Change to your Pi's IP

export const useProductAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProduct = async (barcode) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/product/${barcode}`);
      const data = await response.json();

      if (response.ok) {
        return data;
      } else {
        setError(data.error || 'Product not found');
        return null;
      }
    } catch (err) {
      setError('Failed to fetch product data');
      console.error('API Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessment = async (barcode) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/assess/${barcode}`);
      const data = await response.json();

      if (response.ok) {
        return data;
      } else {
        setError('Failed to generate assessment');
        return null;
      }
    } catch (err) {
      setError('Failed to generate assessment');
      console.error('Assessment Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchProduct, fetchAssessment, loading, error };
};