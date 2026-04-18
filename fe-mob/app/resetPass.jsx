import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Dimensions } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@/hooks/auth-context';
import Svg, { Path } from "react-native-svg";
import TopographicBackground from './components/TopographicBg';

const { width, height } = Dimensions.get("window");

export default function ResetPassword() {
  const { userId, secret } = useLocalSearchParams();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
  const { resetPassword } = useAuth();

  useEffect(() => {
    if (!userId || !secret) {
      console.log("Waiting for reset parameters...");
    }
  }, [userId, secret]);

  const handleReset = async () => {
    if (!userId || !secret) {
      Alert.alert("Error", "Invalid link. Missing recovery information.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    const result = await resetPassword(userId, secret, password, confirmPassword);
    setLoading(false);

    if (result.success) {
      Alert.alert("Success", "Password updated successfully", [
        { text: "Login", onPress: () => router.replace('/auth') }
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <TopographicBackground />
      <View style={styles.formContainer}>
        <Text style={styles.title}>
          Set New Password
        </Text>
        <Text style={styles.subtitle}>
          Enter your new password below
        </Text>
        
        <TextInput
          label="New Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={securePassword}
          right={
            <TextInput.Icon 
              icon={securePassword ? "eye" : "eye-off"}
              onPress={() => setSecurePassword(!securePassword)}
            />
          }
          mode="flat"
          style={styles.input}
          underlineColor="#ddd"
          activeUnderlineColor="#67caa9ff"
          placeholder="enter new password"
          placeholderTextColor="#999"
        />

        <TextInput
          label="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={secureConfirm}
          right={
            <TextInput.Icon 
              icon={secureConfirm ? "eye" : "eye-off"}
              onPress={() => setSecureConfirm(!secureConfirm)}
            />
          }
          mode="flat"
          style={styles.input}
          underlineColor="#ddd"
          activeUnderlineColor="#67caa9ff"
          placeholder="confirm new password"
          placeholderTextColor="#999"
        />

        <Button 
          mode="contained"
          onPress={handleReset}
          disabled={loading}
          loading={loading}
          style={styles.button}
          buttonColor="#67caa9ff"
          textColor="#fff"
        >
          Update Password
        </Button>

        <Button 
          mode="text"
          onPress={() => router.replace('/auth')}
          textColor="#58b294ff"
          style={styles.linkButton}
        >
          Back to Login
        </Button>
      </View>
    </View>
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
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  button: { 
    marginTop: 16,
    borderRadius: 25,
    paddingVertical: 4,
  },
  linkButton: { 
    marginTop: 16,
  }
});