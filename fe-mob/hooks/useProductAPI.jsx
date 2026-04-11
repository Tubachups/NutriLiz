import { useState } from 'react';
import { apiFetch } from '@/lib/api';

const normalizeBarcode = (barcode) => String(barcode || '').replace(/\D/g, '');

const pickFirst = (...values) => {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '' && value !== 'N/A') {
      return value;
    }
  }
  return 'N/A';
};

const pickNutriment = (nutriments, keys) => {
  for (const key of keys) {
    const value = nutriments?.[key];
    if (value !== undefined && value !== null && value !== '' && value !== 'N/A') {
      return value;
    }
  }
  return 'N/A';
};

const normalizeOpenFoodFactsProduct = (data) => {
  if (!data || data.source !== 'openfoodfacts') return data;

  const nutriments = data.nutriments || {};
  const energyKcal = pickFirst(
    data.energy_kcal_100g,
    data.energy_kcal_serving,
    pickNutriment(nutriments, [
      'energy-kcal_100g',
      'energy_kcal_100g',
      'energy-kcal_100ml',
      'energy_kcal_100ml',
      'energy-kcal_serving',
      'energy_kcal_serving',
      'energy-kcal_prepared_100g',
      'energy_kcal_prepared_100g',
      'energy-kcal_prepared_100ml',
      'energy_kcal_prepared_100ml',
      'energy-kcal_prepared_serving',
      'energy_kcal_prepared_serving',
      'energy-kcal',
      'energy_kcal',
      'energy-kcal_value',
      'energy_kcal_value',
    ])
  );

  const energyFromKj = pickNutriment(nutriments, [
    'energy-kj_100g',
    'energy_kj_100g',
    'energy-kj_100ml',
    'energy_kj_100ml',
    'energy-kj_serving',
    'energy_kj_serving',
    'energy-kj_prepared_100g',
    'energy_kj_prepared_100g',
    'energy-kj_prepared_100ml',
    'energy_kj_prepared_100ml',
    'energy-kj_prepared_serving',
    'energy_kj_prepared_serving',
    'energy-kj',
    'energy_kj',
    'energy_100g',
    'energy_100ml',
    'energy_serving',
    'energy_prepared_serving',
    'energy',
  ]);
  const energyKjNumber = parseFloat(energyFromKj);

  return {
    ...data,
    energy_kcal_100g: energyKcal !== 'N/A'
      ? energyKcal
      : (Number.isFinite(energyKjNumber) ? (energyKjNumber / 4.184) : 'N/A'),
    carbohydrates_100g: pickFirst(data.carbohydrates_100g, data.carbohydrates_serving, pickNutriment(nutriments, ['carbohydrates_100g', 'carbohydrates_100ml', 'carbohydrates_serving', 'carbohydrates_prepared_100g', 'carbohydrates_prepared_100ml', 'carbohydrates_prepared_serving', 'carbohydrates', 'carbohydrates_value'])),
    sugars_100g: pickFirst(data.sugars_100g, data.sugars_serving, pickNutriment(nutriments, ['sugars_100g', 'sugars_100ml', 'sugars_serving', 'sugars_prepared_100g', 'sugars_prepared_100ml', 'sugars_prepared_serving', 'sugars', 'sugars_value'])),
    fat_100g: pickFirst(data.fat_100g, data.fat_serving, pickNutriment(nutriments, ['fat_100g', 'fat_100ml', 'fat_serving', 'fat_prepared_100g', 'fat_prepared_100ml', 'fat_prepared_serving', 'fat', 'fat_value'])),
    proteins_100g: pickFirst(data.proteins_100g, data.proteins_serving, pickNutriment(nutriments, ['proteins_100g', 'proteins_100ml', 'proteins_serving', 'proteins_prepared_100g', 'proteins_prepared_100ml', 'proteins_prepared_serving', 'proteins', 'proteins_value'])),
    fiber_100g: pickFirst(data.fiber_100g, data.fiber_serving, pickNutriment(nutriments, ['fiber_100g', 'fiber_100ml', 'fiber_serving', 'fiber_prepared_100g', 'fiber_prepared_100ml', 'fiber_prepared_serving', 'fiber', 'fiber_value'])),
    saturated_fat_100g: pickFirst(data.saturated_fat_100g, data.saturated_fat_serving, pickNutriment(nutriments, ['saturated-fat_100g', 'saturated_fat_100g', 'saturated-fat_100ml', 'saturated_fat_100ml', 'saturated-fat_serving', 'saturated_fat_serving', 'saturated-fat_prepared_100g', 'saturated-fat_prepared_100ml', 'saturated-fat_prepared_serving', 'saturated-fat', 'saturated-fat_value'])),
    sodium_100g: pickFirst(data.sodium_100g, data.sodium_serving, pickNutriment(nutriments, ['sodium_100g', 'sodium_100ml', 'sodium_serving', 'sodium_prepared_100g', 'sodium_prepared_100ml', 'sodium_prepared_serving', 'sodium', 'sodium_value'])),
    salt_100g: pickFirst(data.salt_100g, data.salt_serving, pickNutriment(nutriments, ['salt_100g', 'salt_100ml', 'salt_serving', 'salt_prepared_100g', 'salt_prepared_100ml', 'salt_prepared_serving', 'salt', 'salt_value'])),
    nutri_score: pickFirst(data.nutri_score, nutriments.nutriscore_score),
    nutri_grade: pickFirst(data.nutri_grade, nutriments.nutriscore_grade),
  };
};

export const useProductAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProduct = async (barcode) => {
    setLoading(true);
    setError(null);

    const normalizedBarcode = normalizeBarcode(barcode);
    if (!normalizedBarcode) {
      setError('Invalid barcode');
      setLoading(false);
      return null;
    }

    try {
      const response = await apiFetch(`/api/product/${encodeURIComponent(normalizedBarcode)}`);
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        return normalizeOpenFoodFactsProduct(data);
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

  // Updated to accept userProfile for personalized assessment
  const fetchAssessment = async (barcode, userProfile = null) => {
    setLoading(true);
    setError(null);

    try {
      // Use POST with userProfile if available, otherwise GET
      const options = userProfile
        ? {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userProfile),
          }
        : { method: 'GET' };

      const response = await apiFetch(`/api/assess/${barcode}`, options);
      const data = await response.json().catch(() => ({}));

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