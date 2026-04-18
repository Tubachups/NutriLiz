import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { TextInput, Button, Text, Portal, Modal, PaperProvider } from 'react-native-paper';
import { useAuth } from '@/hooks/auth-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import  TopographicBackground from './components/TopographicBg';

const { width, height } = Dimensions.get("window");

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const { forgotPassword } = useAuth();

  const handleSendLink = async () => {
    if (!email) {
      setErrorMessage("Please enter your email address");
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    const result = await forgotPassword(email);
    setLoading(false);

    if (result.success) {
      setShowSuccessModal(true);
    } else {
      setErrorMessage(result.error || "Failed to send reset link");
      setShowErrorModal(true);
    }
  };

  const handleSuccessDismiss = () => {
    setShowSuccessModal(false);
    router.back();
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <TopographicBackground />

        <Portal>
          {/* Success Modal */}
          <Modal
            visible={showSuccessModal}
            onDismiss={handleSuccessDismiss}
            contentContainerStyle={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#67caa9" style={styles.modalIcon} />
              <Text style={styles.modalTitle}>Success</Text>
              <Text style={styles.modalMessage}>Password reset link sent to your email.</Text>
              <Button
                mode="contained"
                onPress={handleSuccessDismiss}
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
              <Ionicons name="alert-circle-outline" size={48} color="#e74c3c" style={styles.modalIcon} />
              <Text style={styles.modalTitle}>Error</Text>
              <Text style={styles.modalMessage}>{errorMessage}</Text>
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
        </Portal>

        <View style={styles.formContainer}>
          <Text style={styles.title}>
            Reset Password
          </Text>
          <Text style={styles.subtitle}>
            Enter your email to receive a reset link
          </Text>

          <TextInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            mode="flat"
            textColor='black'
            style={styles.input}
            underlineColor="#ddd"
            activeUnderlineColor="#67caa9ff"
            placeholder="example@email.com"
            placeholderTextColor="#999"
            right={<TextInput.Icon icon="email-outline" color="#83b9a8ff" />}
          />

          <Button
            mode="contained"
            onPress={handleSendLink}
            disabled={loading}
            loading={loading}
            style={styles.button}
            buttonColor="#67caa9ff"
            textColor="#fff"
          >
            Send Reset Link
          </Button>

          <Button
            mode="text"
            onPress={() => router.back()}
            textColor="#58b294ff"
            style={styles.linkButton}
          >
            Back to Login
          </Button>
        </View>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#67caa9ff',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: height * 0.05,
  },
  title: { 
    fontSize: 28,
    fontWeight: 'bold', 
    marginBottom: 10, 
    textAlign: 'left',
    color: '#333',
  },
  subtitle: { 
    color: '#666', 
    marginBottom: 30, 
    textAlign: 'left',
    fontSize: 16,
  },
  input: { 
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  button: { 
    marginTop: 8,
    borderRadius: 25,
    paddingVertical: 4,
  },
  linkButton: { 
    marginTop: 16,
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
    borderRadius: 25,
    width: '100%',
  },
});