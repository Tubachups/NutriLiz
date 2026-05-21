import React from 'react';
import { Card, Text } from 'react-native-paper';

const IngredientsCard = ({ title, ingredients, disclaimerText, styles }) => {
  if (!ingredients || ingredients.length === 0) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {title}
        </Text>
        <Text style={styles.ingredients}>
          {ingredients.join(', ')}
        </Text>
        <Text style={styles.ingredientDisclaimer}>
          {disclaimerText}
        </Text>
      </Card.Content>
    </Card>
  );
};

export default IngredientsCard;
