import React from 'react';
import { Dimensions, View, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  FoodHeaderCard,
  NutriScoreCard,
  NutritionCard,
  DietaryInfoCard,
  AllergensCard,
  ListCard,
  AdviceCard,
  IngredientsCard,
  MedicalDisclaimerCard,
} from '../components/food-detail';
import { useFoodDetail } from '../../hooks/useFoodDetail';

const windowWidth = Dimensions.get('window').width;
const SCREEN_HORIZONTAL_PADDING = 32;
const CARD_CONTENT_HORIZONTAL_PADDING = 32;
const CAROUSEL_CARD_GAP = 12;
const CAROUSEL_VIEWPORT_WIDTH = windowWidth - SCREEN_HORIZONTAL_PADDING - CARD_CONTENT_HORIZONTAL_PADDING;
const CAROUSEL_ITEM_WIDTH = CAROUSEL_VIEWPORT_WIDTH - CAROUSEL_CARD_GAP * 2;

export default function FoodDetail() {
  const { foodData: foodDataString } = useLocalSearchParams();
  const {
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
  } = useFoodDetail(foodDataString);
  const carouselLayout = {
    itemWidth: CAROUSEL_ITEM_WIDTH,
    viewportWidth: CAROUSEL_VIEWPORT_WIDTH,
  };

  return (
    <ScrollView style={styles.container}>
      <FoodHeaderCard
        activeFood={activeFood}d
        hasMultipleFoods={hasMultipleFoods}
        carouselFoods={carouselFoods}
        activeFoodIndex={activeFoodIndex}
        onHeaderProgress={(offsetProgress, absoluteProgress) => {
          progress.value = absoluteProgress;
        }}
        onHeaderSnap={(index) => {
          setActiveFoodIndex(index);
          setIsAllergensExpanded(false);
        }}
        carouselLayout={carouselLayout}
        styles={styles}
      />

      {activeFood?.nutri_score_estimate && (
        <NutriScoreCard
          nutriScore={activeFood.nutri_score_estimate}
          styles={styles}
        />
      )}

      <NutritionCard
        hasMultipleFoods={hasMultipleFoods}
        carouselFoods={carouselFoods}
        activeFoodIndex={activeFoodIndex}
        setActiveFoodIndex={setActiveFoodIndex}
        hasPer100gNutrition={hasPer100gNutrition}
        servingSizeInput={servingSizeInput}
        setServingSizeInput={setServingSizeInput}
        servingSize={servingSize}
        servingSizeError={servingSizeError}
        reference={reference}
        estimatedFields={estimatedFields}
        nutrition={nutrition}
        scaleFactor={scaleFactor}
        formatNutritionValue={formatNutritionValue}
        getReferenceLabel={getReferenceLabel}
        formatEstimatedFields={formatEstimatedFields}
        carouselLayout={carouselLayout}
        styles={styles}
      />

      <DietaryInfoCard
        dietaryInfo={activeFood?.dietary_info}
        styles={styles}
      />

      <AllergensCard
        title="⚠️ Allergens"
        allergens={activeFood?.allergens}
        isAllergensExpanded={isAllergensExpanded}
        setIsAllergensExpanded={setIsAllergensExpanded}
        styles={styles}
      />

      <ListCard
        title="✅ Health Benefits"
        items={activeFood?.health_benefits}
        styles={styles}
      />

      <ListCard
        title="⚠️ Potential Concerns"
        items={activeFood?.potential_concerns}
        styles={styles}
      />

      <AdviceCard
        title="🎯 Personalized Advice"
        text={activeFood?.personalized_advice}
        styles={styles}
      />

      

      <IngredientsCard
        title="🍳 Ingredients"
        ingredients={activeFood?.ingredients_if_dish}
        disclaimerText="⚠️ Note: This list is based on image recognition and may not include all ingredients. Some ingredients may not be visible or identifiable from the captured image."
        styles={styles}
      />

      <MedicalDisclaimerCard
        title="Medical Reminder"
        text="Nutrition information and suggestions in this app are for guidance only and are not a replacement for medical advice, diagnosis, or treatment. Please consult a licensed healthcare professional for medical decisions."
        styles={styles}
      />

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
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
    marginTop: 2,
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