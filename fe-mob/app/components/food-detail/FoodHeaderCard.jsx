import React, { useEffect, useRef } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import Carousel, { Pagination } from 'react-native-reanimated-carousel';
import { useSharedValue } from 'react-native-reanimated';

const FoodHeaderCard = ({
  activeFood,
  hasMultipleFoods,
  carouselFoods,
  activeFoodIndex,
  onHeaderProgress,
  onHeaderSnap,
  carouselLayout,
  styles,
}) => {
  const { width } = useWindowDimensions();
  const CARD_HORIZONTAL_PADDING = 16;
  const carouselRef = useRef(null);
  const lastSyncedIndex = useRef(activeFoodIndex);
  
  // Shared value required for the Reanimated Pagination component
  const progress = useSharedValue(0);

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
    if (onHeaderProgress) {
      onHeaderProgress(offsetProgress, absoluteProgress);
    }
  };

  const onPressPagination = (index) => {
    carouselRef.current?.scrollTo({
      count: index - progress.value,
      animated: true,
    });
  };

  if (hasMultipleFoods) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Detected Foods</Text>
          <Carousel
            ref={carouselRef}
            data={carouselFoods}
            width={width - CARD_HORIZONTAL_PADDING * 4}
            height={220}
            loop={false}
            pagingEnabled
            snapEnabled
            style={{
              width: width - CARD_HORIZONTAL_PADDING * 4,
              alignSelf: 'center',
            }}
            mode="parallax"
            modeConfig={{
              parallaxScrollingScale: 0.92,
              parallaxScrollingOffset: 50,
            }}
            onProgressChange={handleProgressChange}
            onSnapToItem={onHeaderSnap}
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
        </Card.Content>
      </Card>
    );
  }

  return (
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
  );
};

export default FoodHeaderCard;