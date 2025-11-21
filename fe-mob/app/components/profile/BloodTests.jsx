import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Text } from 'react-native-paper';

const BloodTests = ({
  sugarLevel,
  setSugarLevel,
  cholesterolLevel,
  setCholesterolLevel,
  triglycerides,
  setTriglycerides,
  creatinine,
  setCreatinine,
  uricAcid,
  setUricAcid,
}) => {
  return (
    <View>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Blood Tests
      </Text>

      <TextInput
        label="Blood Sugar"
        value={sugarLevel}
        onChangeText={setSugarLevel}
        keyboardType="decimal-pad"
        mode="outlined"
        style={styles.input}
        outlineColor="#ABE7B2"
        activeOutlineColor="#93BFC7"
        placeholder="e.g., 95"
        right={<TextInput.Affix text="mg/dL" />}
      />

      <TextInput
        label="Cholesterol"
        value={cholesterolLevel}
        onChangeText={setCholesterolLevel}
        keyboardType="decimal-pad"
        mode="outlined"
        style={styles.input}
        outlineColor="#ABE7B2"
        activeOutlineColor="#93BFC7"
        placeholder="e.g., 180"
        right={<TextInput.Affix text="mg/dL" />}
      />

      <TextInput
        label="Triglycerides"
        value={triglycerides}
        onChangeText={setTriglycerides}
        keyboardType="decimal-pad"
        mode="outlined"
        style={styles.input}
        outlineColor="#ABE7B2"
        activeOutlineColor="#93BFC7"
        placeholder="e.g., 150"
        right={<TextInput.Affix text="mg/dL" />}
      />

      <TextInput
        label="Creatinine"
        value={creatinine}
        onChangeText={setCreatinine}
        keyboardType="decimal-pad"
        mode="outlined"
        style={styles.input}
        outlineColor="#ABE7B2"
        activeOutlineColor="#93BFC7"
        placeholder="e.g., 1.0"
        right={<TextInput.Affix text="mg/dL" />}
      />

      <TextInput
        label="Uric Acid"
        value={uricAcid}
        onChangeText={setUricAcid}
        keyboardType="decimal-pad"
        mode="outlined"
        style={styles.input}
        outlineColor="#ABE7B2"
        activeOutlineColor="#93BFC7"
        placeholder="e.g., 5.5"
        right={<TextInput.Affix text="mg/dL" />}
      />
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

export default BloodTests;