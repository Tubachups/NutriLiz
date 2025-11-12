import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';

const NutritionInfo = ({ productData, isAppwriteProduct }) => {
  return (
    <Card style={styles.card}>
      <Card.Title title="🥗 Nutrition Information" />
      <Card.Content>
        {isAppwriteProduct ? (
          <View>
            {Object.entries(productData.nutrition).map(([key, value]) => (
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
                {productData.energy_kcal_100g} kcal / 100g
              </Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Carbohydrates:</Text>
              <Text style={styles.nutritionValue}>
                {productData.carbohydrates_100g}g / 100g
              </Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Sugars:</Text>
              <Text style={styles.nutritionValue}>
                {productData.sugars_100g}g / 100g
              </Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Fat:</Text>
              <Text style={styles.nutritionValue}>
                {productData.fat_100g}g / 100g
              </Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Proteins:</Text>
              <Text style={styles.nutritionValue}>
                {productData.proteins_100g}g / 100g
              </Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Fiber:</Text>
              <Text style={styles.nutritionValue}>
                {productData.fiber_100g}g / 100g
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
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  nutritionLabel: {
    fontWeight: '600',
  },
  nutritionValue: {
    color: '#666',
  },
});
