
import { useMemo, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';

export function useFoodDetail(foodDataString) {
	const foodData = parseFoodDataParam(foodDataString);
	const carouselFoods = useMemo(() => extractFoodItems(foodData), [foodData]);
	const hasMultipleFoods = carouselFoods.length > 1;
	const [activeFoodIndex, setActiveFoodIndex] = useState(0);
	const progress = useSharedValue(0);
	const [isAllergensExpanded, setIsAllergensExpanded] = useState(false);
	const [servingSizeInput, setServingSizeInput] = useState('100');
	const activeFood = hasMultipleFoods
		? carouselFoods[Math.min(activeFoodIndex, carouselFoods.length - 1)]
		: foodData;

	const hasPer100gNutrition = Boolean(activeFood?.nutrition_per_100g);
	const nutrition = activeFood?.nutrition_per_100g || activeFood?.nutrition_per_serving || {};
	const parsedServingSize = Number.parseFloat(String(servingSizeInput).replace(',', '.'));
	const servingSize = Number.isFinite(parsedServingSize) && parsedServingSize > 0 ? parsedServingSize : 100;
	const scaleFactor = hasMultipleFoods ? 1 : (hasPer100gNutrition ? servingSize / 100 : 1);
	const servingSizeError = servingSizeInput.trim() !== '' && (!Number.isFinite(parsedServingSize) || parsedServingSize <= 0);
	const reference = getReferenceLabel(activeFood);
	const estimatedFields = activeFood?.nutrition_estimation?.estimated_fields || [];

	return {
		foodData,
		carouselFoods,
		hasMultipleFoods,
		activeFoodIndex,
		setActiveFoodIndex,
		progress,
		isAllergensExpanded,
		setIsAllergensExpanded,
		servingSizeInput,
		setServingSizeInput,
		activeFood,
		hasPer100gNutrition,
		nutrition,
		servingSize,
		scaleFactor,
		servingSizeError,
		reference,
		estimatedFields,
		formatNutritionValue,
		getReferenceLabel,
		formatEstimatedFields,
	};
}

function parseFoodDataParam(foodDataString) {
	if (!foodDataString) {
		return {};
	}

	const payload = Array.isArray(foodDataString) ? foodDataString[0] : foodDataString;
	try {
		return JSON.parse(payload);
	} catch {
		return {};
	}
}

function extractFoodItems(foodData) {
	if (Array.isArray(foodData)) {
		return foodData.filter((item) => item && typeof item === 'object');
	}

	if (!foodData || typeof foodData !== 'object') {
		return [];
	}

	const listKeys = ['food_items', 'foods', 'detected_foods', 'identified_foods', 'items'];
	for (const key of listKeys) {
		if (Array.isArray(foodData[key]) && foodData[key].length > 0) {
			return foodData[key].filter((item) => item && typeof item === 'object');
		}
	}

	return [foodData];
}

function formatNutritionValue(value, unit, scaleFactor = 1) {
	if (value === null || value === undefined || value === '') {
		return 'N/A';
	}

	const parsed = Number(value);
	if (Number.isNaN(parsed)) {
		return 'N/A';
	}

	const scaledValue = parsed * scaleFactor;
	return `${scaledValue.toFixed(2)}${unit ? ` ${unit}` : ''}`;
}

function getReferenceLabel(foodData) {
	if (!foodData || typeof foodData !== 'object') {
		return 'unknown';
	}

	if (foodData.nutrition_source === 'usda_fooddata_central' && foodData.nutrition_estimation?.estimated_fields?.length) {
		return 'USDA FoodData Central + Ingredient Blend Estimate';
	}

	if (foodData.nutrition_source === 'open_food_facts') {
		return 'Open Food Facts';
	}

	if (foodData.nutrition_source === 'usda_fooddata_central') {
		if (foodData.usda_match?.fdc_id) {
			return `USDA FoodData Central (${foodData.usda_match.fdc_id})`;
		}
		return 'USDA FoodData Central';
	}

	if (foodData.nutrition_source === 'fnri_table') {
		if (foodData.fnri_match?.food_id) {
			return `FNRI Table (${foodData.fnri_match.food_id})`;
		}
		return 'FNRI Table';
	}

	if (foodData.source === 'gemini_vision') {
		return 'Gemini Vision';
	}

	return foodData.source || 'unknown';
}

function formatEstimatedFields(fields) {
	const labels = {
		calories: 'Calories',
		protein_g: 'Protein',
		carbohydrates_g: 'Carbs',
		fat_g: 'Fat',
		fiber_g: 'Fiber',
		sugar_g: 'Sugar',
		sodium_mg: 'Sodium',
		saturated_fat_g: 'Sat. Fat',
	};

	return fields
		.map((field) => labels[field] || field)
		.join(', ');
}
