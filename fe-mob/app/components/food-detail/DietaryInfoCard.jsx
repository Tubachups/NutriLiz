import React from 'react';
import { View } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';

const DietaryInfoCard = ({ dietaryInfo, styles }) => {
  if (!dietaryInfo) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Dietary Information
        </Text>
        <View style={styles.chipContainer}>
          {dietaryInfo.is_vegetarian && (
            <Chip
              icon="leaf"
              style={styles.dietaryChip}
              textStyle={styles.dietaryChipText}
              selectedColor={styles.dietaryChipIconColor.color}
            >
              Vegetarian
            </Chip>
          )}
          {dietaryInfo.is_vegan && (
            <Chip
              icon="sprout"
              style={styles.dietaryChip}
              textStyle={styles.dietaryChipText}
              selectedColor={styles.dietaryChipIconColor.color}
            >
              Vegan
            </Chip>
          )}
          {dietaryInfo.is_gluten_free && (
            <Chip
              icon="barley-off"
              style={styles.dietaryChip}
              textStyle={styles.dietaryChipText}
              selectedColor={styles.dietaryChipIconColor.color}
            >
              Gluten-Free
            </Chip>
          )}
          {dietaryInfo.is_dairy_free && (
            <Chip
              icon="cow-off"
              style={styles.dietaryChip}
              textStyle={styles.dietaryChipText}
              selectedColor={styles.dietaryChipIconColor.color}
            >
              Dairy-Free
            </Chip>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

export default DietaryInfoCard;
