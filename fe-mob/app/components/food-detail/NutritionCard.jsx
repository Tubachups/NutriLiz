import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Card, Text, TextInput } from 'react-native-paper';
import Carousel, { Pagination } from 'react-native-reanimated-carousel';
import { useSharedValue } from 'react-native-reanimated';

const NutritionCard = ({
  hasMultipleFoods,
  carouselFoods,
  activeFoodIndex,
  setActiveFoodIndex,
  hasPer100gNutrition,
  servingSizeInput,
  setServingSizeInput,
  servingSize,
  servingSizeError,
  reference,
  estimatedFields,
  nutrition,
  scaleFactor,
  formatNutritionValue,
  getReferenceLabel,
  formatEstimatedFields,
  carouselLayout,
  styles,
}) => {
  const [carouselServingInputs, setCarouselServingInputs] = useState(() => (
    carouselFoods.map(() => '100')
  ));
  const carouselRef = useRef(null);
  const lastSyncedIndex = useRef(activeFoodIndex);
  
  // Track carousel progress for the pagination dots
  const progress = useSharedValue(0);

  useEffect(() => {
    setCarouselServingInputs((prev) => {
      if (carouselFoods.length === 0) {
        return [];
      }

      if (prev.length === carouselFoods.length) {
        return prev;
      }

      return carouselFoods.map((_, index) => prev[index] ?? '100');
    });
  }, [carouselFoods]);

  useEffect(() => {
    if (!hasMultipleFoods || !carouselRef.current) {
      return;
    }

    if (lastSyncedIndex.current === activeFoodIndex) {
      return;
    }

    carouselRef.current.scrollTo({ index: activeFoodIndex, animated: true });
    lastSyncedIndex.current = activeFoodIndex;
  }, [activeFoodIndex, hasMultipleFoods]);

  const handleProgressChange = (offsetProgress, absoluteProgress) => {
    progress.value = absoluteProgress;
  };

  const onPressPagination = (index) => {
    carouselRef.current?.scrollTo({
      count: index - progress.value,
      animated: true,
    });
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        {hasMultipleFoods ? (
          <>
            <Text variant="titleMedium" style={styles.sectionTitle}>Nutrition by food</Text>
            <Carousel
              ref={carouselRef}
              data={carouselFoods}
              width={carouselLayout.itemWidth}
              height={430}
              loop={false}
              style={{
                alignSelf: 'center',
              }}
              pagingEnabled
              snapEnabled
              onProgressChange={handleProgressChange}
              onSnapToItem={(index) => {
                setActiveFoodIndex(index);
              }}
              renderItem={({ item, index }) => {
                const itemNutrition = item?.nutrition_per_100g || item?.nutrition_per_serving || {};
                const itemReference = getReferenceLabel(item);
                const itemEstimatedFields = item?.nutrition_estimation?.estimated_fields || [];
                const itemHasPer100g = Boolean(item?.nutrition_per_100g);
                const itemServingInput = carouselServingInputs[index] ?? '100';
                const parsedServingSize = Number.parseFloat(String(itemServingInput).replace(',', '.'));
                const itemServingSize = Number.isFinite(parsedServingSize) && parsedServingSize > 0
                  ? parsedServingSize
                  : 100;
                const itemServingError = itemServingInput.trim() !== ''
                  && (!Number.isFinite(parsedServingSize) || parsedServingSize <= 0);
                const itemScaleFactor = itemHasPer100g ? itemServingSize / 100 : 1;

                return (
                  <View style={styles.carouselItem}>
                    <Text variant="titleMedium" style={styles.title}>{item.food_name || 'Unknown Food'}</Text>
                    <Text variant="bodySmall" style={styles.referenceText}>Reference: {itemReference}</Text>
                    {itemHasPer100g && (
                      <>
                        <TextInput
                          mode="outlined"
                          label="Serving size (g)"
                          value={itemServingInput}
                          keyboardType="decimal-pad"
                          onChangeText={(value) => {
                            setCarouselServingInputs((prev) => {
                              const next = [...prev];
                              next[index] = value;
                              return next;
                            });
                          }}
                          style={styles.servingInput}
                          error={itemServingError}
                          textColor="black"
                          outlineColor="#1e7d5dff"
                          activeOutlineColor="#1e7d5dff"
                        />
                        <Text variant="bodySmall" style={styles.servingHint}>
                          {itemServingError
                            ? 'Enter a valid serving size. Showing values for 100g.'
                            : `Nutrition for ${itemServingSize.toFixed(0)}g.`}
                        </Text>
                      </>
                    )}
                    {itemEstimatedFields.length > 0 && (
                      <Text variant="bodySmall" style={styles.estimationText}>
                        Estimated from ingredients for: {formatEstimatedFields(itemEstimatedFields)}
                      </Text>
                    )}
                    <View style={styles.nutritionGrid}>
                      <NutritionItem label="Calories" value={formatNutritionValue(itemNutrition.calories, 'kcal', itemScaleFactor)} styles={styles} />
                      <NutritionItem label="Protein" value={formatNutritionValue(itemNutrition.protein_g, 'g', itemScaleFactor)} styles={styles} />
                      <NutritionItem label="Carbs" value={formatNutritionValue(itemNutrition.carbohydrates_g, 'g', itemScaleFactor)} styles={styles} />
                      <NutritionItem label="Fat" value={formatNutritionValue(itemNutrition.fat_g, 'g', itemScaleFactor)} styles={styles} />
                      <NutritionItem label="Fiber" value={formatNutritionValue(itemNutrition.fiber_g, 'g', itemScaleFactor)} styles={styles} />
                      <NutritionItem label="Sugar" value={formatNutritionValue(itemNutrition.sugar_g, 'g', itemScaleFactor)} styles={styles} />
                      <NutritionItem label="Sodium" value={formatNutritionValue(itemNutrition.sodium_mg, 'mg', itemScaleFactor)} styles={styles} />
                      <NutritionItem label="Sat. Fat" value={formatNutritionValue(itemNutrition.saturated_fat_g, 'g', itemScaleFactor)} styles={styles} />
                    </View>
                  </View>
                );
              }}
            />
            
            <Pagination.Basic
              progress={progress}
              data={carouselFoods}
              dotStyle={{
                width: 8,
                height: 8,
                borderRadius: 100,
                backgroundColor: "rgba(0,0,0,0.2)",
              }}
              activeDotStyle={{
                overflow: "hidden",
                backgroundColor: "#262626",
              }}
              containerStyle={{
                gap: 8,
                marginTop: 10,
                alignSelf: 'center',
              }}
              horizontal
              onPress={onPressPagination}
            />
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
                  activeOutlineColor="#1e7d5dff"
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
              <NutritionItem label="Calories" value={formatNutritionValue(nutrition.calories, 'kcal', scaleFactor)} styles={styles} />
              <NutritionItem label="Protein" value={formatNutritionValue(nutrition.protein_g, 'g', scaleFactor)} styles={styles} />
              <NutritionItem label="Carbs" value={formatNutritionValue(nutrition.carbohydrates_g, 'g', scaleFactor)} styles={styles} />
              <NutritionItem label="Fat" value={formatNutritionValue(nutrition.fat_g, 'g', scaleFactor)} styles={styles} />
              <NutritionItem label="Fiber" value={formatNutritionValue(nutrition.fiber_g, 'g', scaleFactor)} styles={styles} />
              <NutritionItem label="Sugar" value={formatNutritionValue(nutrition.sugar_g, 'g', scaleFactor)} styles={styles} />
              <NutritionItem label="Sodium" value={formatNutritionValue(nutrition.sodium_mg, 'mg', scaleFactor)} styles={styles} />
              <NutritionItem label="Sat. Fat" value={formatNutritionValue(nutrition.saturated_fat_g, 'g', scaleFactor)} styles={styles} />
            </View>
          </>
        )}
      </Card.Content>
    </Card>
  );
};

export default NutritionCard;

const NutritionItem = ({ label, value, styles }) => (
  <View style={styles.nutritionItem}>
    <Text style={styles.nutritionLabel}>{label}</Text>
    <Text style={styles.nutritionValue}>{value}</Text>
  </View>
);