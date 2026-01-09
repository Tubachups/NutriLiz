import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';

const AllergensCard = ({ allergens, traces }) => {
  const formatAllergenText = (allergenData) => {
    if (!allergenData) return '';
    
    // Handle arrays
    if (Array.isArray(allergenData)) {
      return allergenData
        .map(allergen => 
          String(allergen)
            .replace(/^en:/gi, '')
            .replace(/[-_]/g, ' ')
            .trim()
            .replace(/\b\w/g, char => char.toUpperCase())
        )
        .join(', ');
    }
    
    // Ensure it's a string before splitting
    if (typeof allergenData !== 'string') return '';
    
    // Remove 'en:' prefix and replace dashes/underscores with spaces
    return allergenData
      .split(',')
      .map(allergen => 
        allergen
          .replace(/^en:/gi, '')
          .replace(/[-_]/g, ' ')
          .trim()
          .replace(/\b\w/g, char => char.toUpperCase())
      )
      .join(', ');
  };

  if (!allergens && !traces) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <Card.Title title="⚠️ Allergen Information" titleStyle={styles.cardTitle} />
      <Card.Content>
        {allergens && allergens !== '' && (
          <View style={styles.allergenSection}>
            <Text style={styles.allergenLabel}>Contains:</Text>
            <Text style={styles.allergenText}>{formatAllergenText(allergens)}</Text>
          </View>
        )}
        {traces && traces !== '' && (
          <View style={styles.allergenSection}>
            <Text style={styles.allergenLabel}>May contain traces of:</Text>
            <Text style={styles.allergenText}>{formatAllergenText(traces)}</Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

export default AllergensCard;

const styles = StyleSheet.create({
  card: {
    margin: 10,
    backgroundColor: 'white',
  },
  cardTitle: {
    color: '#1e7d5dff',
    fontWeight: 'bold',
  },
  allergenSection: {
    marginBottom: 12,
  },
  allergenLabel: {
    fontWeight: '600',
    marginBottom: 4,
    color: '#173a31ff',
  },
  allergenText: {
    color: '#d32f2f',
    lineHeight: 20,
    fontSize: 18,
  },
});
