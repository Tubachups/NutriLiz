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

      <Text style={styles.disclaimer}>
        Please consult a health professional to obtain accurate blood test results before completing these details.
      </Text>

      <TextInput
        label="Blood Sugar"
        value={sugarLevel}
        onChangeText={setSugarLevel}
        keyboardType="decimal-pad"
        mode="outlined"
        textColor="#082e21ff"
        style={styles.input}
        outlineColor="#abe7cdff"
        activeOutlineColor="#93BFC7"
        placeholder="e.g., 95"
        right={<TextInput.Affix text="mg/dL" />}
      />

      <TextInput
        label="Cholesterol"
        value={cholesterolLevel}
        onChangeText={setCholesterolLevel}
        keyboardType="decimal-pad"
        textColor="#082e21ff"
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
        textColor="#082e21ff"
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
        textColor="#082e21ff"
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
        textColor="#082e21ff"
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
    color: '#5d8c86ff',
    marginBottom: 8,
    marginTop: 8,
  },
  disclaimer: {
    fontSize: 12,
    color: '#e67e22',
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 18,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#fff',
  },
});

export default BloodTests;