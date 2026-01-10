import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';


const NutritionInfo = ({ productData, isAppwriteProduct }) => {
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
                {formatValue(productData.energy_kcal_100g, ' kcal')}
              </Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Carbohydrates:</Text>
              <Text style={styles.nutritionValue}>
                {formatValue(productData.carbohydrates_100g)}
              </Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Sugars:</Text>
              <Text style={styles.nutritionValue}>
                {formatValue(productData.sugars_100g)}
              </Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Fat:</Text>
              <Text style={styles.nutritionValue}>
                {formatValue(productData.fat_100g)}
              </Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Proteins:</Text>
              <Text style={styles.nutritionValue}>
                {formatValue(productData.proteins_100g)}
              </Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Fiber:</Text>
              <Text style={styles.nutritionValue}>
                {formatValue(productData.fiber_100g)}
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
