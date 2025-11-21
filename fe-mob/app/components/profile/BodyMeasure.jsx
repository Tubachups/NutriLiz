import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Text } from 'react-native-paper';
import BMIDisplay from './BMIDisplay';

const BodyMeasure = ({ weight, setWeight, height, setHeight, bmi, bmiCategory }) => {
  return (
    <View>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Body Measurements
      </Text>

      <TextInput
        label="Weight"
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
        mode="outlined"
        style={styles.input}
        outlineColor="#ABE7B2"
        activeOutlineColor="#93BFC7"
        placeholder="e.g., 70"
        right={<TextInput.Affix text="kg" />}
      />

      <TextInput
        label="Height"
        value={height}
        onChangeText={setHeight}
        keyboardType="decimal-pad"
        mode="outlined"
        style={styles.input}
        outlineColor="#ABE7B2"
        activeOutlineColor="#93BFC7"
        placeholder="e.g., 170"
        right={<TextInput.Affix text="cm" />}
      />

      <BMIDisplay bmi={bmi} category={bmiCategory} />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontWeight: '600',
    color: '#93BFC7',
    marginBottom: 12,
    marginTop: 8,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
});

export default BodyMeasure;