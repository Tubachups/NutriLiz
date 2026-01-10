import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Text, Card, Divider, Portal, Modal } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showRequiredModal, setShowRequiredModal] = useState(false);

  const router = useRouter();
  const { userProfile, updateUserProfile } = useAuth();

  // Reset form to saved data whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (userProfile) {
        setWeight(userProfile.weight || '');
        setHeight(userProfile.height || '');
        setSugarLevel(userProfile.sugarLevel || '');
        setCholesterolLevel(userProfile.cholesterolLevel || '');
        setTriglycerides(userProfile.triglycerides || '');
        setCreatinine(userProfile.creatinine || '');
        setUricAcid(userProfile.uricAcid || '');
      } else {
        // Reset to empty if no profile
        setWeight('');
        setHeight('');
        setSugarLevel('');
        setCholesterolLevel('');
        setTriglycerides('');
        setCreatinine('');
        setUricAcid('');
      }
    }, [userProfile])
  );

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
      setShowRequiredModal(true);
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
      setShowSuccessModal(true);
    } catch (error) {
      setShowErrorModal(true);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Portal>
        {/* Success Modal */}
        <Modal
          visible={showSuccessModal}
          onDismiss={() => setShowSuccessModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#67caa9" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Profile Saved</Text>
            <Text style={styles.modalMessage}>Your health profile has been saved successfully.</Text>
            <Button
              mode="contained"
              onPress={() => setShowSuccessModal(false)}
              style={styles.modalButton}
              buttonColor="#67caa9"
              textColor="#fff"
            >
              OK
            </Button>
          </View>
        </Modal>

        {/* Error Modal */}
        <Modal
          visible={showErrorModal}
          onDismiss={() => setShowErrorModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Ionicons name="alert-circle-outline" size={48} color="#E63E11" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Error</Text>
            <Text style={styles.modalMessage}>Failed to save profile. Please try again.</Text>
            <Button
              mode="contained"
              onPress={() => setShowErrorModal(false)}
              style={styles.modalButton}
              buttonColor="#67caa9"
              textColor="#fff"
            >
              OK
            </Button>
          </View>
        </Modal>

        {/* Required Fields Modal */}
        <Modal
          visible={showRequiredModal}
          onDismiss={() => setShowRequiredModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Ionicons name="information-circle-outline" size={48} color="#67caa9" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Required Fields</Text>
            <Text style={styles.modalMessage}>Please enter both weight and height to calculate BMI.</Text>
            <Button
              mode="contained"
              onPress={() => setShowRequiredModal(false)}
              style={styles.modalButton}
              buttonColor="#67caa9"
              textColor="#fff"
            >
              OK
            </Button>
          </View>
        </Modal>
      </Portal>

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
                buttonColor="#62a58aff"
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
    backgroundColor: '#e8f4edff',
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
    backgroundColor: '#95d9bdff',
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  infoSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#bbf3cbff',
    borderRadius: 8,
  },
  infoText: {
    color: '#444b49ff',
    textAlign: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    padding: 24,
  },
  modalContent: {
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    minWidth: 120,
    borderRadius: 25,
  },
});

export default ProfileScreen;