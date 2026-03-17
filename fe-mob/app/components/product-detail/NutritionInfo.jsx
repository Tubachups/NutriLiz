import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';


const NutritionInfo = ({ productData, isAppwriteProduct }) => {
  const nutriments = productData?.nutriments || {};

  const pickNutriment = (keys) => {
    for (const key of keys) {
      const value = nutriments?.[key];
      if (value !== undefined && value !== null && value !== '' && value !== 'N/A') {
        return value;
      }
    }
    return 'N/A';
  };

  const getEnergyValue = () => {
    if (productData?.energy_kcal_100g !== undefined && productData?.energy_kcal_100g !== null && productData?.energy_kcal_100g !== '' && productData?.energy_kcal_100g !== 'N/A') {
      return productData.energy_kcal_100g;
    }

    if (productData?.energy_kcal_serving !== undefined && productData?.energy_kcal_serving !== null && productData?.energy_kcal_serving !== '' && productData?.energy_kcal_serving !== 'N/A') {
      return productData.energy_kcal_serving;
    }

    const kcal = pickNutriment([
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
    ]);
    if (kcal !== 'N/A') return kcal;

    const kj = pickNutriment([
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
    const kjNum = parseFloat(kj);
    return Number.isFinite(kjNum) ? (kjNum / 4.184) : 'N/A';
  };

  const getNutrientValue = (topLevelValue, keys) => {
    if (topLevelValue !== undefined && topLevelValue !== null && topLevelValue !== '' && topLevelValue !== 'N/A') {
      return topLevelValue;
    }
    return pickNutriment(keys);
  };

  // Helper to safely display nutrition values with 2 decimal places
  const formatValue = (value, unit = 'g') => {
    if (value === undefined || value === null || value === '') return 'N/A';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'N/A';
    return `${numValue.toFixed(2)}${unit} / 100g`;
  };

  return (
    <Card style={styles.card}>
      <Card.Title 
        title="🥗 Nutrition Information" 
        titleStyle={styles.cardTitle}
      />
      <Card.Content>
        {isAppwriteProduct ? (
          <View>
            {productData.nutrition && Object.entries(productData.nutrition).map(([key, value]) => (
              <View key={key} style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                </Text>
                <Text style={styles.nutritionValue}>{value}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Energy:</Text>
              <Text style={styles.nutritionValue}>
                {formatValue(getEnergyValue(), ' kcal')}
              </Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Carbohydrates:</Text>
              <Text style={styles.nutritionValue}>
                {formatValue(getNutrientValue(productData.carbohydrates_100g || productData.carbohydrates_serving, ['carbohydrates_100g', 'carbohydrates_100ml', 'carbohydrates_serving', 'carbohydrates_prepared_100g', 'carbohydrates_prepared_100ml', 'carbohydrates_prepared_serving', 'carbohydrates', 'carbohydrates_value']))}
              </Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Sugars:</Text>
              <Text style={styles.nutritionValue}>
                {formatValue(getNutrientValue(productData.sugars_100g || productData.sugars_serving, ['sugars_100g', 'sugars_100ml', 'sugars_serving', 'sugars_prepared_100g', 'sugars_prepared_100ml', 'sugars_prepared_serving', 'sugars', 'sugars_value']))}
              </Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Fat:</Text>
              <Text style={styles.nutritionValue}>
                {formatValue(getNutrientValue(productData.fat_100g || productData.fat_serving, ['fat_100g', 'fat_100ml', 'fat_serving', 'fat_prepared_100g', 'fat_prepared_100ml', 'fat_prepared_serving', 'fat', 'fat_value']))}
              </Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Proteins:</Text>
              <Text style={styles.nutritionValue}>
                {formatValue(getNutrientValue(productData.proteins_100g || productData.proteins_serving, ['proteins_100g', 'proteins_100ml', 'proteins_serving', 'proteins_prepared_100g', 'proteins_prepared_100ml', 'proteins_prepared_serving', 'proteins', 'proteins_value']))}
              </Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Fiber:</Text>
              <Text style={styles.nutritionValue}>
                {formatValue(getNutrientValue(productData.fiber_100g || productData.fiber_serving, ['fiber_100g', 'fiber_100ml', 'fiber_serving', 'fiber_prepared_100g', 'fiber_prepared_100ml', 'fiber_prepared_serving', 'fiber', 'fiber_value']))}
              </Text>
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

export default NutritionInfo;

const styles = StyleSheet.create({
  card: {
    margin: 10,
    backgroundColor: 'white',
  },
  cardTitle: {
    color: '#1e7d5dff',
    fontWeight: 'bold',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  nutritionLabel: {
    fontWeight: '600',
    color: '#1e7d5dff',
  },
  nutritionValue: {
    color: '#6f7472ff',
  },
});
