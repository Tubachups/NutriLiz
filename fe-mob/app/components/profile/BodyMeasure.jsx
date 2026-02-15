import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Text, SegmentedButtons } from 'react-native-paper';
import BMIDisplay from './BMIDisplay';

const BodyMeasure = ({ weight, setWeight, height, setHeight, bmi, bmiCategory }) => {
  const [heightUnit, setHeightUnit] = useState('cm'); // 'cm' or 'ft'
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');

  // Convert feet/inches to cm when they change
  useEffect(() => {
    if (heightUnit === 'ft' && (feet || inches)) {
      const feetNum = parseFloat(feet) || 0;
      const inchesNum = parseFloat(inches) || 0;
      const totalInches = (feetNum * 12) + inchesNum;
      const cm = (totalInches * 2.54).toFixed(1);
      if (totalInches > 0) {
        setHeight(cm);
      }
    }
  }, [feet, inches, heightUnit]);

  // When switching to ft mode, convert existing cm to ft/in
  useEffect(() => {
    if (heightUnit === 'ft' && height && !feet && !inches) {
      const totalInches = parseFloat(height) / 2.54;
      const ft = Math.floor(totalInches / 12);
      const inch = Math.round(totalInches % 12);
      if (ft > 0 || inch > 0) {
        setFeet(ft.toString());
        setInches(inch.toString());
      }
    }
  }, [heightUnit]);

  // Reset ft/in when switching to cm mode
  const handleUnitChange = (value) => {
    setHeightUnit(value);
    if (value === 'cm') {
      setFeet('');
      setInches('');
    }
  };

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
        textColor="#082e21ff"
        style={styles.input}
        outlineColor="#abe7d1ff"
        activeOutlineColor="#86bcb4ff"
        placeholder="e.g., 70"
        right={<TextInput.Affix text="kg" />}
      />

      {/* Height Unit Toggle */}
      <Text variant="bodySmall" style={styles.unitLabel}>Height Unit</Text>
      <SegmentedButtons
        value={heightUnit}
        onValueChange={handleUnitChange}
        buttons={[
          { 
            value: 'cm', 
            label: 'Centimeters',
            checkedColor: '#fff',
            uncheckedColor: '#5d8c86',
            style: heightUnit === 'cm' ? styles.segmentedButtonActive : styles.segmentedButtonInactive,
          },
          { 
            value: 'ft', 
            label: 'Feet & Inches',
            checkedColor: '#fff',
            uncheckedColor: '#5d8c86',
            style: heightUnit === 'ft' ? styles.segmentedButtonActive : styles.segmentedButtonInactive,
          },
        ]}
        style={styles.segmentedButtons}
      />

      {heightUnit === 'cm' ? (
        <TextInput
          label="Height"
          value={height}
          onChangeText={setHeight}
          keyboardType="decimal-pad"
          mode="outlined"
          style={styles.input}
          outlineColor="#ABE7B2"
          activeOutlineColor="#93BFC7"
          textColor="#082e21ff"
          placeholder="e.g., 170"
          right={<TextInput.Affix text="cm" />}
        />
      ) : (
        <View style={styles.ftInContainer}>
          <TextInput
            label="Feet"
            value={feet}
            onChangeText={setFeet}
            keyboardType="decimal-pad"
            mode="outlined"
            style={[styles.input, styles.ftInput]}
            outlineColor="#ABE7B2"
            activeOutlineColor="#93BFC7"
            textColor="#082e21ff"
            placeholder="e.g., 5"
            right={<TextInput.Affix text="ft" />}
          />
          <TextInput
            label="Inches"
            value={inches}
            onChangeText={setInches}
            keyboardType="decimal-pad"
            mode="outlined"
            style={[styles.input, styles.inInput]}
            outlineColor="#ABE7B2"
            activeOutlineColor="#93BFC7"
            textColor="#082e21ff"
            placeholder="e.g., 7"
            right={<TextInput.Affix text="in" />}
          />
        </View>
      )}

      {heightUnit === 'ft' && height && (
        <Text style={styles.convertedText}>
          = {height} cm
        </Text>
      )}

      <BMIDisplay bmi={bmi} category={bmiCategory} />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontWeight: '600',
    color: '#5d8c86ff',
    marginBottom: 12,
    marginTop: 8,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  unitLabel: {
    color: '#5d8c86ff',
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  segmentedButtonActive: {
    backgroundColor: '#62a58a',
    borderColor: '#62a58a',
  },
  segmentedButtonInactive: {
    backgroundColor: '#fff',
    borderColor: '#abe7d1',
  },
  ftInContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  ftInput: {
    flex: 1,
  },
  inInput: {
    flex: 1,
  },
  convertedText: {
    color: '#62a58a',
    fontSize: 14,
    fontWeight: '500',
    marginTop: -8,
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default BodyMeasure;