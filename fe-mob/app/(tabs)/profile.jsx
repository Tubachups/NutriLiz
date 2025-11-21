import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Text, Card, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import ProfileHeader from '../components/profile/ProfileHeader';
import BodyMeasure from '../components/profile/BodyMeasure';
import BloodTests from '../components/profile/BloodTests';
import { useAuth } from '@/hooks/auth-context';

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
  const { userProfile, updateUserProfile } = useAuth();

  // Load existing profile data on mount
  useEffect(() => {
    if (userProfile) {
      setWeight(userProfile.weight || '');
      setHeight(userProfile.height || '');
      setSugarLevel(userProfile.sugarLevel || '');
      setCholesterolLevel(userProfile.cholesterolLevel || '');
      setTriglycerides(userProfile.triglycerides || '');
      setCreatinine(userProfile.creatinine || '');
      setUricAcid(userProfile.uricAcid || '');
    }
  }, [userProfile]);

  // Calculate BMI whenever weight or height changes
  useEffect(() => {
    if (weight && height) {
      const weightNum = parseFloat(weight);
      const heightNum = parseFloat(height);

      if (weightNum > 0 && heightNum > 0) {
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

  const handleSave = async () => {
    if (!weight || !height) {
      Alert.alert(
        'Required Fields',
        'Please enter both weight and height to calculate BMI.',
        [{ text: 'OK' }]
      );
      return;
    }

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

    try {
      await updateUserProfile(profileData);
      Alert.alert('Profile Saved', 'Your health profile has been saved successfully.', [{ text: 'OK' }]);
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');

    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Card style={styles.card}>
            <Card.Content>
              <ProfileHeader />

              <BodyMeasure
                weight={weight}
                setWeight={setWeight}
                height={height}
                setHeight={setHeight}
                bmi={bmi}
                bmiCategory={getBmiCategory()}
              />

              <Divider style={styles.divider} />

              <BloodTests
                sugarLevel={sugarLevel}
                setSugarLevel={setSugarLevel}
                cholesterolLevel={cholesterolLevel}
                setCholesterolLevel={setCholesterolLevel}
                triglycerides={triglycerides}
                setTriglycerides={setTriglycerides}
                creatinine={creatinine}
                setCreatinine={setCreatinine}
                uricAcid={uricAcid}
                setUricAcid={setUricAcid}
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