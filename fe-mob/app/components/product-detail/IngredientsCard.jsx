import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';

const IngredientsCard = ({ ingredientsText }) => {
  if (!ingredientsText || ingredientsText === 'N/A') {
    return null;
  }

  return (
    <Card style={styles.card}>
      <Card.Title title="🧪 Ingredients" titleStyle={styles.cardTitle} />
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
  cardTitle: {
    color: '#1e7d5dff',
    fontWeight: 'bold',
  },
  ingredientsText: {
    lineHeight: 20,
    color: '#333',
  },
});
