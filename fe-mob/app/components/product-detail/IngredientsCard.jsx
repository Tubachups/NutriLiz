import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';

const IngredientsCard = ({ ingredientsText }) => {
  if (!ingredientsText || ingredientsText === 'N/A') {
    return null;
  }

  return (
    <Card style={styles.card}>
      <Card.Title title="🧪 Ingredients" />
      <Card.Content>
        <Text style={styles.ingredientsText}>
          {ingredientsText}
        </Text>
      </Card.Content>
    </Card>
  );
};

export default IngredientsCard;

const styles = StyleSheet.create({
  card: {
    margin: 10,
    backgroundColor: 'white',
  },
  ingredientsText: {
    lineHeight: 20,
    color: '#333',
  },
});
