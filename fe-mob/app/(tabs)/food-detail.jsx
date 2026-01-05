import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text, Chip, Divider } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { theme } from '../../theme';

export default function FoodDetail() {
  const { foodData: foodDataString } = useLocalSearchParams();
  const foodData = JSON.parse(foodDataString);

  const nutrition = foodData.nutrition_per_100g || foodData.nutrition_per_serving || {};

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineMedium" style={styles.title}>
            {foodData.food_name}
          </Text>
          {foodData.food_name_local && (
            <Text variant="bodyMedium" style={styles.subtitle}>
              {foodData.food_name_local}
            </Text>
          )}
          <Chip style={styles.categoryChip}>{foodData.category}</Chip>
          <Text variant="bodyMedium" style={styles.description}>
            {foodData.description}
          </Text>
        </Card.Content>
      </Card>

      {/* Nutri-Score Estimate */}
      {foodData.nutri_score_estimate && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Nutri-Score Estimate</Text>
            <View style={styles.nutriScoreContainer}>
              <Text style={[styles.nutriScore, styles[`nutriScore${foodData.nutri_score_estimate}`]]}>
                {foodData.nutri_score_estimate}
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Nutrition Info */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Nutrition per 100g
          </Text>
          <View style={styles.nutritionGrid}>
            <NutritionItem label="Calories" value={`${nutrition.calories || 0} kcal`} />
            <NutritionItem label="Protein" value={`${nutrition.protein_g || 0}g`} />
            <NutritionItem label="Carbs" value={`${nutrition.carbohydrates_g || 0}g`} />
            <NutritionItem label="Fat" value={`${nutrition.fat_g || 0}g`} />
            <NutritionItem label="Fiber" value={`${nutrition.fiber_g || 0}g`} />
            <NutritionItem label="Sugar" value={`${nutrition.sugar_g || 0}g`} />
            <NutritionItem label="Sodium" value={`${nutrition.sodium_mg || 0}mg`} />
            <NutritionItem label="Sat. Fat" value={`${nutrition.saturated_fat_g || 0}g`} />
          </View>
        </Card.Content>
      </Card>

      {/* Dietary Info */}
      {foodData.dietary_info && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Dietary Information
            </Text>
            <View style={styles.chipContainer}>
              {foodData.dietary_info.is_vegetarian && <Chip icon="leaf">Vegetarian</Chip>}
              {foodData.dietary_info.is_vegan && <Chip icon="sprout">Vegan</Chip>}
              {foodData.dietary_info.is_gluten_free && <Chip icon="barley-off">Gluten-Free</Chip>}
              {foodData.dietary_info.is_dairy_free && <Chip icon="cow-off">Dairy-Free</Chip>}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Allergens */}
      {foodData.allergens && foodData.allergens.length > 0 && (
        <Card style={[styles.card, styles.warningCard]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              ⚠️ Allergens
            </Text>
            <View style={styles.chipContainer}>
              {foodData.allergens.map((allergen, index) => (
                <Chip key={index} style={styles.allergenChip}>
                  {allergen}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Health Benefits */}
      {foodData.health_benefits && foodData.health_benefits.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              ✅ Health Benefits
            </Text>
            {foodData.health_benefits.map((benefit, index) => (
              <Text key={index} style={styles.listItem}>
                • {benefit}
              </Text>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Potential Concerns */}
      {foodData.potential_concerns && foodData.potential_concerns.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              ⚠️ Potential Concerns
            </Text>
            {foodData.potential_concerns.map((concern, index) => (
              <Text key={index} style={styles.listItem}>
                • {concern}
              </Text>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Personalized Advice */}
      {foodData.personalized_advice && (
        <Card style={[styles.card, styles.personalizedCard]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              🎯 Personalized Advice
            </Text>
            <Text style={styles.advice}>{foodData.personalized_advice}</Text>
          </Card.Content>
        </Card>
      )}

      {/* Ingredients if dish */}
      {foodData.ingredients_if_dish && foodData.ingredients_if_dish.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              🍳 Ingredients
            </Text>
            <Text style={styles.ingredients}>
              {foodData.ingredients_if_dish.join(', ')}
            </Text>
          </Card.Content>
        </Card>
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const NutritionItem = ({ label, value }) => (
  <View style={styles.nutritionItem}>
    <Text style={styles.nutritionLabel}>{label}</Text>
    <Text style={styles.nutritionValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  card: { marginBottom: 12, backgroundColor: '#1E1E1E' },
  warningCard: { borderLeftWidth: 4, borderLeftColor: '#FFA726' },
  personalizedCard: { borderLeftWidth: 4, borderLeftColor: '#4CAF50' },
  title: { color: 'white', fontWeight: 'bold' },
  subtitle: { color: '#888', marginTop: 4 },
  description: { color: '#CCC', marginTop: 8 },
  categoryChip: { alignSelf: 'flex-start', marginTop: 8 },
  sectionTitle: { color: 'white', marginBottom: 12 },
  
  nutritionGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  nutritionItem: { width: '50%', paddingVertical: 8 },
  nutritionLabel: { color: '#888', fontSize: 12 },
  nutritionValue: { color: 'white', fontSize: 16, fontWeight: '500' },
  
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  allergenChip: { backgroundColor: '#FF5722' },
  
  listItem: { color: '#CCC', marginBottom: 4 },
  advice: { color: '#CCC', lineHeight: 22 },
  ingredients: { color: '#CCC' },
  
  nutriScoreContainer: { alignItems: 'center', marginTop: 12 },
  nutriScore: { fontSize: 48, fontWeight: 'bold', width: 60, height: 60, textAlign: 'center', borderRadius: 8 },
  nutriScoreA: { backgroundColor: '#038141', color: 'white' },
  nutriScoreB: { backgroundColor: '#85BB2F', color: 'white' },
  nutriScoreC: { backgroundColor: '#FECB02', color: 'black' },
  nutriScoreD: { backgroundColor: '#EE8100', color: 'white' },
  nutriScoreE: { backgroundColor: '#E63E11', color: 'white' },
  
  bottomSpacer: { height: 40 },
});