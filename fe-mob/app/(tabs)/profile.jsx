import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Card, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';


const ProfileScreen = () => {
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmi, setBmi] = useState('');
  const [sugarLevel, setSugarLevel] = useState('');
  const [cholesterolLevel, setCholesterolLevel] = useState('');
  const [triglycerides, setTriglycerides] = useState('');
  const [creatinine, setCreatinine] = useState('');
  const [uricAcid, setUricAcid] = useState('');

  const router = useRouter();

  // Calculate BMI whenever weight or height changes
  useEffect(() => {
    if (weight && height) {
      const weightNum = parseFloat(weight);
      const heightNum = parseFloat(height);

      if (weightNum > 0 && heightNum > 0) {
        // BMI = weight (kg) / (height (m))²
        const heightInMeters = heightNum / 100;
        const calculatedBmi = weightNum / (heightInMeters * heightInMeters);
        setBmi(calculatedBmi.toFixed(1));
      } else {
        setBmi('');
      }
    } else {
      setBmi('');
    }
  }, [weight, height]);

  const getBmiCategory = () => {
    const bmiNum = parseFloat(bmi);
    if (!bmiNum) return '';
    if (bmiNum < 18.5) return '(Underweight)';
    if (bmiNum < 25) return '(Normal)';
    if (bmiNum < 30) return '(Overweight)';
    return '(Obese)';
  };

  const handleSave = () => {
    // Validate required fields
    if (!weight || !height) {
      Alert.alert(
        'Required Fields',
        'Please enter both weight and height to calculate BMI.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Prepare profile data with N/A for empty optional fields
    const profileData = {
      weight,
      height,
      bmi,
      bmiCategory: getBmiCategory(),
      sugarLevel: sugarLevel || 'N/A',
      cholesterolLevel: cholesterolLevel || 'N/A',
      triglycerides: triglycerides || 'N/A',
      creatinine: creatinine || 'N/A',
      uricAcid: uricAcid || 'N/A',
    };

    // Clear inputs after saving
    clearInputs();
    Alert.alert('Profile Saved', 'Your health profile has been saved successfully.', [{ text: 'OK' }]);

    // Navigate to home tab with profile data
    router.push({
      pathname: '/home',
      params: profileData
    });
  };

  const clearInputs = () => {
    setWeight('');
    setHeight('');
    setBmi('');
    setSugarLevel('');
    setCholesterolLevel('');
    setTriglycerides('');
    setCreatinine('');
    setUricAcid('');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="headlineSmall" style={styles.title}>
                Health Profile
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                Enter your health metrics
              </Text>

              {/* BMI Section */}
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

              {bmi ? (
                <View style={styles.bmiResult}>
                  <Text variant="titleMedium" style={styles.bmiText}>
                    BMI: {bmi} kg/m² {getBmiCategory()}
                  </Text>
                  <Text variant="bodySmall" style={styles.bmiFormula}>
                    Formula: BMI = Weight (kg) ÷ Height² (m)
                  </Text>
                </View>
              ) : null}

              <Divider style={styles.divider} />

              {/* Blood Tests Section */}
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

              <Button
                mode="contained"
                onPress={handleSave}
                style={styles.button}
                buttonColor="#93BFC7"
                textColor="#fff"
              >
                Save Profile
              </Button>
            </Card.Content>
          </Card>

          <View style={styles.infoSection}>
            <Text variant="bodySmall" style={styles.infoText}>
              💡 Tip: Keep your health metrics updated for personalized nutrition recommendations
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECF4E8',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    elevation: 2,
    borderRadius: 12,
  },
  title: {
    fontWeight: 'bold',
    color: '#93BFC7',
    marginBottom: 8,
  },
  subtitle: {
    color: '#757575',
    marginBottom: 24,
  },
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
  divider: {
    marginVertical: 16,
    backgroundColor: '#ABE7B2',
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  infoSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#CBF3BB',
    borderRadius: 8,
  },
  infoText: {
    color: '#555',
    textAlign: 'center',
  },
});

export default ProfileScreen;