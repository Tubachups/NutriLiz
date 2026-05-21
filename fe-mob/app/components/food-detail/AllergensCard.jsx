import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';

const AllergensCard = ({
  title,
  allergens,
  isAllergensExpanded,
  setIsAllergensExpanded,
  styles,
}) => {
  if (!allergens || allergens.length === 0) {
    return null;
  }

  return (
    <Card style={[styles.card, styles.warningCard]}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {title}
        </Text>
        <TouchableOpacity onPress={() => setIsAllergensExpanded(!isAllergensExpanded)}>
          <View style={styles.chipContainer}>
            {allergens.map((allergen, index) => (
              <Chip
                key={index}
                style={styles.allergenChip}
                textStyle={[
                  styles.allergenChipText,
                  !isAllergensExpanded && styles.allergenChipTextCollapsed,
                ]}
              >
                {isAllergensExpanded
                  ? allergen
                  : (allergen.length > 45 ? `${allergen.substring(0, 45)}...` : allergen)}
              </Chip>
            ))}
          </View>
          {!isAllergensExpanded && allergens.some((allergen) => allergen.length > 45) && (
            <Text style={styles.tapHint}>Tap to expand</Text>
          )}
        </TouchableOpacity>
        {isAllergensExpanded && (
          <View style={styles.expandedAllergens}>
            {allergens.map((allergen, index) => (
              <Text key={index} style={styles.expandedAllergenItem}>
                {allergen}
              </Text>
            ))}
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

export default AllergensCard;
