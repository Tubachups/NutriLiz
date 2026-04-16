import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Chip, TextInput } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { useSharedValue } from 'react-native-reanimated';
import Carousel from 'react-native-reanimated-carousel';

const windowWidth = Dimensions.get('window').width;
const SCREEN_HORIZONTAL_PADDING = 32;
const CARD_CONTENT_HORIZONTAL_PADDING = 32;
const CAROUSEL_CARD_GAP = 12;
const CAROUSEL_VIEWPORT_WIDTH = windowWidth - SCREEN_HORIZONTAL_PADDING - CARD_CONTENT_HORIZONTAL_PADDING;
const CAROUSEL_ITEM_WIDTH = CAROUSEL_VIEWPORT_WIDTH - CAROUSEL_CARD_GAP * 2;

export default function FoodDetail() {
  const { foodData: foodDataString } = useLocalSearchParams();
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

  return (
    <ScrollView style={styles.container}>
      {hasMultipleFoods ? (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Detected Foods</Text>
            <Carousel
              autoPlayInterval={2000}
              data={carouselFoods}
              width={CAROUSEL_ITEM_WIDTH}
              height={220}
              loop={false}
              pagingEnabled
              snapEnabled
              style={styles.carousel}
              mode="parallax"
              modeConfig={{
                parallaxScrollingScale: 0.92,
                parallaxScrollingOffset: 50,
              }}
              onProgressChange={(offsetProgress, absoluteProgress) => {
                progress.value = absoluteProgress;

              }}
              onSnapToItem={(index) => {
                setActiveFoodIndex(index);
                setIsAllergensExpanded(false);
              }}
              renderItem={({ item }) => (
                <View style={styles.carouselItem}>
                  <Text variant="headlineSmall" style={styles.title}>{item.food_name || 'Unknown Food'}</Text>
                  {item.food_name_local && (
                    <Text variant="bodyMedium" style={styles.subtitle}>{item.food_name_local}</Text>
                  )}
                  {!!item.category && (
                    <Chip style={styles.categoryChip} textStyle={styles.categoryChipText}>{item.category}</Chip>
                  )}
                  {!!item.description && (
                    <Text variant="bodySmall" style={styles.description}>{item.description}</Text>
                  )}
                </View>
              )}
            />
            <Text style={styles.carouselCounterText}>
              Food {Math.min(activeFoodIndex + 1, carouselFoods.length)} of {carouselFoods.length}
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.title}>
              {activeFood?.food_name}
            </Text>

            {activeFood?.food_name_local && (
              <Text variant="bodyMedium" style={styles.subtitle}>
                {activeFood.food_name_local}
              </Text>
            )}
            {!!activeFood?.category && (
              <Chip style={styles.categoryChip} textStyle={styles.categoryChipText}>{activeFood.category}</Chip>
            )}
            {!!activeFood?.description && (
              <Text variant="bodyMedium" style={styles.description}>
                {activeFood.description}
              </Text>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Nutri-Score Estimate */}
      {activeFood?.nutri_score_estimate && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Nutri-Score Estimate</Text>
            <View style={styles.nutriScoreContainer}>
              <Text style={[styles.nutriScore, styles[`nutriScore${activeFood.nutri_score_estimate}`]]}>
                {activeFood.nutri_score_estimate}
              </Text>
              <Text style={styles.nutriScoreDescription}>
                {
                  {
                    'A': 'Very healthy',
                    'B': 'Healthy',
                    'C': 'Moderate',
                    'D': 'Less healthy',
                    'E': 'Unhealthy'
                  }[activeFood.nutri_score_estimate]
                }
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Nutrition Info */}
      <Card style={styles.card}>
        <Card.Content>
          {hasMultipleFoods ? (
            <>
              <Text variant="titleMedium" style={styles.sectionTitle}>Nutrition per 100g by food</Text>
              <Carousel
                data={carouselFoods}
                width={CAROUSEL_ITEM_WIDTH}
                height={310}
                loop={false}
                pagingEnabled
                snapEnabled
                style={styles.carousel}
                mode="parallax"
                modeConfig={{
                  parallaxScrollingScale: 0.94,
                  parallaxScrollingOffset: 48,
                }}
                onProgressChange={(offsetProgress, absoluteProgress) => {
                  const nextIndex = Math.min(
                    Math.max(Math.round(absoluteProgress), 0),
                    Math.max(carouselFoods.length - 1, 0)
                  );
                  setActiveFoodIndex((prev) => (prev === nextIndex ? prev : nextIndex));
                }}
                onSnapToItem={(index) => {
                  setActiveFoodIndex(index);
                }}
                renderItem={({ item }) => {
                  const itemNutrition = item?.nutrition_per_100g || item?.nutrition_per_serving || {};
                  const itemReference = getReferenceLabel(item);
                  const itemEstimatedFields = item?.nutrition_estimation?.estimated_fields || [];

                  return (
                    <View style={styles.carouselItem}>
                      <Text variant="titleMedium" style={styles.title}>{item.food_name || 'Unknown Food'}</Text>
                      <Text variant="bodySmall" style={styles.referenceText}>Reference: {itemReference}</Text>
                      {itemEstimatedFields.length > 0 && (
                        <Text variant="bodySmall" style={styles.estimationText}>
                          Estimated from ingredients for: {formatEstimatedFields(itemEstimatedFields)}
                        </Text>
                      )}
                      <View style={styles.nutritionGrid}>
                        <NutritionItem label="Calories" value={formatNutritionValue(itemNutrition.calories, 'kcal', 1)} />
                        <NutritionItem label="Protein" value={formatNutritionValue(itemNutrition.protein_g, 'g', 1)} />
                        <NutritionItem label="Carbs" value={formatNutritionValue(itemNutrition.carbohydrates_g, 'g', 1)} />
                        <NutritionItem label="Fat" value={formatNutritionValue(itemNutrition.fat_g, 'g', 1)} />
                        <NutritionItem label="Fiber" value={formatNutritionValue(itemNutrition.fiber_g, 'g', 1)} />
                        <NutritionItem label="Sugar" value={formatNutritionValue(itemNutrition.sugar_g, 'g', 1)} />
                        <NutritionItem label="Sodium" value={formatNutritionValue(itemNutrition.sodium_mg, 'mg', 1)} />
                        <NutritionItem label="Sat. Fat" value={formatNutritionValue(itemNutrition.saturated_fat_g, 'g', 1)} />
                      </View>
                    </View>
                  );
                }}
              />
              <Text style={styles.carouselCounterText}>
                Nutrition card {Math.min(activeFoodIndex + 1, carouselFoods.length)} of {carouselFoods.length}
              </Text>
            </>
          ) : (
            <>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {hasPer100gNutrition ? `Nutrition for ${servingSize.toFixed(0)}g` : 'Nutrition Information'}
              </Text>
              {hasPer100gNutrition && (
                <>
                  <TextInput
                    mode="outlined"
                    label="Serving size (g)"
                    value={servingSizeInput}
                    keyboardType="decimal-pad"
                    onChangeText={setServingSizeInput}
                    style={styles.servingInput}
                    error={servingSizeError}
                    textColor="black"
                    outlineColor="#1e7d5dff"
                    activeOutlineColor='#1e7d5dff'
                  />
                  <Text variant="bodySmall" style={styles.servingHint}>
                    {servingSizeError
                      ? 'Enter a valid serving size. Showing values for 100g.'
                      : 'Scaled from per 100g values.'}
                  </Text>
                </>
              )}
              <Text variant="bodySmall" style={styles.referenceText}>
                Reference: {reference}
              </Text>
              {estimatedFields.length > 0 && (
                <Text variant="bodySmall" style={styles.estimationText}>
                  Estimated from ingredients for: {formatEstimatedFields(estimatedFields)}
                </Text>
              )}
              <View style={styles.nutritionGrid}>
                <NutritionItem label="Calories" value={formatNutritionValue(nutrition.calories, 'kcal', scaleFactor)} />
                <NutritionItem label="Protein" value={formatNutritionValue(nutrition.protein_g, 'g', scaleFactor)} />
                <NutritionItem label="Carbs" value={formatNutritionValue(nutrition.carbohydrates_g, 'g', scaleFactor)} />
                <NutritionItem label="Fat" value={formatNutritionValue(nutrition.fat_g, 'g', scaleFactor)} />
                <NutritionItem label="Fiber" value={formatNutritionValue(nutrition.fiber_g, 'g', scaleFactor)} />
                <NutritionItem label="Sugar" value={formatNutritionValue(nutrition.sugar_g, 'g', scaleFactor)} />
                <NutritionItem label="Sodium" value={formatNutritionValue(nutrition.sodium_mg, 'mg', scaleFactor)} />
                <NutritionItem label="Sat. Fat" value={formatNutritionValue(nutrition.saturated_fat_g, 'g', scaleFactor)} />
              </View>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Dietary Info */}
      {activeFood?.dietary_info && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Dietary Information
            </Text>
            <View style={styles.chipContainer}>
              {activeFood.dietary_info.is_vegetarian && <Chip icon="leaf" style={styles.dietaryChip} textStyle={styles.dietaryChipText} selectedColor={styles.dietaryChipIconColor.color}>Vegetarian</Chip>}
              {activeFood.dietary_info.is_vegan && <Chip icon="sprout" style={styles.dietaryChip} textStyle={styles.dietaryChipText} selectedColor={styles.dietaryChipIconColor.color}>Vegan</Chip>}
              {activeFood.dietary_info.is_gluten_free && <Chip icon="barley-off" style={styles.dietaryChip} textStyle={styles.dietaryChipText} selectedColor={styles.dietaryChipIconColor.color}>Gluten-Free</Chip>}
              {activeFood.dietary_info.is_dairy_free && <Chip icon="cow-off" style={styles.dietaryChip} textStyle={styles.dietaryChipText} selectedColor={styles.dietaryChipIconColor.color}>Dairy-Free</Chip>}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Allergens */}
      {activeFood?.allergens && activeFood.allergens.length > 0 && (
        <Card style={[styles.card, styles.warningCard]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              ⚠️ Allergens
            </Text>
            <TouchableOpacity onPress={() => setIsAllergensExpanded(!isAllergensExpanded)}>
              <View style={styles.chipContainer}>
                {activeFood.allergens.map((allergen, index) => (
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
              {!isAllergensExpanded && activeFood.allergens.some(a => a.length > 45) && (
                <Text style={styles.tapHint}>Tap to expand</Text>
              )}
            </TouchableOpacity>
            {isAllergensExpanded && (
              <View style={styles.expandedAllergens}>
                {activeFood.allergens.map((allergen, index) => (
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
      {activeFood?.health_benefits && activeFood.health_benefits.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              ✅ Health Benefits
            </Text>
            {activeFood.health_benefits.map((benefit, index) => (
              <Text key={index} style={styles.listItem}>
                • {benefit}
              </Text>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Potential Concerns */}
      {activeFood?.potential_concerns && activeFood.potential_concerns.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              ⚠️ Potential Concerns
            </Text>
            {activeFood.potential_concerns.map((concern, index) => (
              <Text key={index} style={styles.listItem}>
                • {concern}
              </Text>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Personalized Advice */}
      {activeFood?.personalized_advice && (
        <Card style={[styles.card, styles.personalizedCard]}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              🎯 Personalized Advice
            </Text>
            <Text style={styles.advice}>{activeFood.personalized_advice}</Text>
          </Card.Content>
        </Card>
      )}

      <Card style={[styles.card, styles.medicalDisclaimerCard]}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Medical Reminder
          </Text>
          <Text style={styles.medicalDisclaimerText}>
            Nutrition information and suggestions in this app are for guidance only and are not a replacement for medical advice, diagnosis, or treatment. Please consult a licensed healthcare professional for medical decisions.
          </Text>
        </Card.Content>
      </Card>

      {/* Ingredients if dish */}
      {activeFood?.ingredients_if_dish && activeFood.ingredients_if_dish.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              🍳 Ingredients
            </Text>
            <Text style={styles.ingredients}>
              {activeFood.ingredients_if_dish.join(', ')}
            </Text>
            <Text style={styles.ingredientDisclaimer}>
              ⚠️ Note: This list is based on image recognition and may not include all ingredients. Some ingredients may not be visible or identifiable from the captured image.
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

const styles = StyleSheet.create({
  // Layout
  container: { 
    flex: 1, 
    backgroundColor: '#c6e9daff', 
    padding: 16 
  },
  carouselItem: {
    backgroundColor: '#f2fbf6',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: CAROUSEL_CARD_GAP,
    minHeight: 200,
    justifyContent: 'center',
  },
  carousel: {
    alignSelf: 'center',
    width: CAROUSEL_VIEWPORT_WIDTH,
  },
  carouselCounterText: {
    marginTop: 8,
    color: '#3c5a50',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
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
  referenceText: {
    color: '#3c5a50',
    marginTop: 4,
    fontSize: 12,
  },
  estimationText: {
    color: '#4f6d61',
    marginTop: 4,
    fontSize: 12,
  },
  servingInput: {
    marginTop: 2,
    marginBottom: 6,
    backgroundColor: 'white',
  },
  servingHint: {
    color: '#4f6d61',
    marginBottom: 4,
    fontSize: 12,
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
  ingredientDisclaimer: {
    color: '#6f7472',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    lineHeight: 18,
  },
  medicalDisclaimerCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#e67e22',
  },
  medicalDisclaimerText: {
    marginTop: 4,
    lineHeight: 20,
    color: '#4a3b2a',
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