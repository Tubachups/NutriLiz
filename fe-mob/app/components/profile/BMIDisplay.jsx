import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const BMIDisplay = ({ bmi, category }) => {
  if (!bmi) return null;

  return (
    <View style={styles.bmiResult}>
      <Text variant="titleMedium" style={styles.bmiText}>
        BMI: {bmi} kg/m² {category}
      </Text>
      <Text variant="bodySmall" style={styles.bmiFormula}>
        Formula: BMI = Weight (kg) ÷ Height² (m)
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  bmiResult: {
    backgroundColor: '#CBF3BB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  bmiText: {
    fontWeight: 'bold',
    color: '#2d5016',
    marginBottom: 4,
  },
  bmiFormula: {
    color: '#555',
    fontStyle: 'italic',
  },
});

export default BMIDisplay;