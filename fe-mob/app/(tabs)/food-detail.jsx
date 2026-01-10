import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Chip, Divider } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { theme } from '../../theme';

export default function FoodDetail() {
  const { foodData: foodDataString } = useLocalSearchParams();
  const foodData = JSON.parse(foodDataString);
  const [isAllergensExpanded, setIsAllergensExpanded] = useState(false);

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
          <Chip style={styles.categoryChip} textStyle={styles.categoryChipText}>{foodData.category}</Chip>
          <Text variant="bodyMedium" style={styles.description}>
            {foodData.description}
          </Text>
        </Card.Content>
      </Card>

      {/* Nutri-Score Estimate */}
      {foodData.nutri_score_estimate && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Nutri-Score Estimate</Text>
            <View style={styles.nutriScoreContainer}>
              <Text style={[styles.nutriScore, styles[`nutriScore${foodData.nutri_score_estimate}`]]}>
                {foodData.nutri_score_estimate}
              </Text>
              <Text style={styles.nutriScoreDescription}>
                {
                  {
                    'A': 'Very healthy',
                    'B': 'Healthy',
                    'C': 'Moderate / okay',
                    'D': 'Less healthy',
                    'E': 'Unhealthy'
                  }[foodData.nutri_score_estimate]
                }
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
              {foodData.dietary_info.is_vegetarian && <Chip icon="leaf" style={styles.dietaryChip} textStyle={styles.dietaryChipText} selectedColor={styles.dietaryChipIconColor.color}>Vegetarian</Chip>}
              {foodData.dietary_info.is_vegan && <Chip icon="sprout" style={styles.dietaryChip} textStyle={styles.dietaryChipText} selectedColor={styles.dietaryChipIconColor.color}>Vegan</Chip>}
              {foodData.dietary_info.is_gluten_free && <Chip icon="barley-off" style={styles.dietaryChip} textStyle={styles.dietaryChipText} selectedColor={styles.dietaryChipIconColor.color}>Gluten-Free</Chip>}
              {foodData.dietary_info.is_dairy_free && <Chip icon="cow-off" style={styles.dietaryChip} textStyle={styles.dietaryChipText} selectedColor={styles.dietaryChipIconColor.color}>Dairy-Free</Chip>}
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
            <TouchableOpacity onPress={() => setIsAllergensExpanded(!isAllergensExpanded)}>
              <View style={styles.chipContainer}>
                {foodData.allergens.map((allergen, index) => (
                  <Chip 
                    key={index} 
                    style={styles.allergenChip} 
                    textStyle={[
                      styles.allergenChipText,
                      !isAllergensExpanded && styles.allergenChipTextCollapsed
                    ]}
                  >
                    {isAllergensExpanded ? allergen : (allergen.length > 45 ? allergen.substring(0, 45) + '...' : allergen)}
                  </Chip>
                ))}
              </View>
              {!isAllergensExpanded && foodData.allergens.some(a => a.length > 45) && (
                <Text style={styles.tapHint}>Tap to expand</Text>
              )}
            </TouchableOpacity>
            {isAllergensExpanded && (
              <View style={styles.expandedAllergens}>
                {foodData.allergens.map((allergen, index) => (
                  <Text key={index} style={styles.expandedAllergenItem}>
                    {allergen}
                  </Text>
                ))}
              </View>
            )}
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
  // Layout
  container: { 
    flex: 1, 
    backgroundColor: '#c6e9daff', 
    padding: 16 
  },
  bottomSpacer: { 
    height: 40 
  },

  // Cards
  card: { 
    marginBottom: 12, 
    backgroundColor: 'white' 
  },
  warningCard: { 
    borderLeftWidth: 4, 
    borderLeftColor: '#ffffff' //old yellow in left side
  },
  personalizedCard: { 
    borderLeftWidth: 4, 
   borderLeftColor: '#ffffff' //old green in left side
  },

  // Header Section
  title: { 
    color: '#1e7d5dff', 
    fontWeight: 'bold' 
  },
  subtitle: { 
    color: '#6f7472ff', 
    marginTop: 4 
  },
  description: { 
    color: '#000000ff', 
    marginTop: 8 
  },
  sectionTitle: { 
    color: '#1e7d5dff', 
    marginBottom: 12, 
    fontWeight: 'bold' 
  },

  // Chips - Category
  categoryChip: { 
    alignSelf: 'flex-start', 
    marginTop: 8, 
    backgroundColor: '#c5e8d8ff' 
  },
  categoryChipText: { 
    color: '#1e7d5dff' 
  },

  // Chips - Dietary Info
  chipContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8 
  },
  dietaryChip: { 
    backgroundColor: '#1e7d5dff' 
  },
  dietaryChipText: { 
    color: '#c5e8d8ff' 
  },
  dietaryChipIconColor: { 
    color: '#181818ff'
  },

  // Chips - Allergens
  allergenChip: { 
    backgroundColor: '#d32f2f' 
  },
  allergenChipText: { 
    color: '#ffffff' 
  },
  allergenChipTextCollapsed: {
    fontSize: 12,
  },
  tapHint: {
    fontSize: 11,
    paddingLeft: 3,
    color: '#888',
    marginTop: 8,
    fontStyle: 'italic',
  },
  expandedAllergens: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
  },
  expandedAllergenItem: {
    color: '#d32f2f',
    marginBottom: 4,
    lineHeight: 20,
    fontWeight: '500',
  },

  // Nutrition Grid
  nutritionGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap' 
  },
  nutritionItem: { 
    width: '50%', 
    paddingVertical: 8, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  nutritionLabel: { 
    color: '#1e7d5dff', 
    fontSize: 12, 
    fontWeight: '600' 
  },
  nutritionValue: { 
    color: '#4b514eff', 
    fontSize: 16, 
    fontWeight: '500' 
  },

  // List Items & Text
  listItem: { 
    color: '#173a31ff', 
    marginBottom: 4, 
    lineHeight: 20 
  },
  advice: { 
    color: '#173a31ff', 
    lineHeight: 22 
  },
  ingredients: { 
    color: '#173a31ff' 
  },

  // Nutri-Score Badge
  nutriScoreContainer: { 
    alignItems: 'center', 
    marginTop: 12 
  },
  nutriScore: { 
    fontSize: 48, 
    fontWeight: 'bold', 
    width: 60, 
    height: 60, 
    textAlign: 'center', 
    borderRadius: 8 
  },
  nutriScoreDescription: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgb(19, 20, 20)',
    fontWeight: '500',
  },
  nutriScoreA: { 
    backgroundColor: '#038141', 
    color: 'white' 
  },
  nutriScoreB: { 
    backgroundColor: '#85BB2F', 
    color: 'white' 
  },
  nutriScoreC: { 
    backgroundColor: '#FECB02', 
    color: 'black' 
  },
  nutriScoreD: { 
    backgroundColor: '#EE8100', 
    color: 'white' 
  },
  nutriScoreE: { 
    backgroundColor: '#E63E11', 
    color: 'white' 
  },
});