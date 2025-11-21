import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@/hooks/auth-context';

export default function ResetPassword() {
  // Appwrite appends ?userId=...&secret=...&expire=... to the redirect URL
  const { userId, secret } = useLocalSearchParams();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);
  const { resetPassword } = useAuth();

  useEffect(() => {
    if (!userId || !secret) {
      // If the page loads without params, it might be a direct navigation or the params haven't hydrated yet.
      // In a real app, you might want to show an error or redirect if they persist as undefined.
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
      <Text variant="headlineMedium" style={styles.title}>
        Set New Password
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
        mode="outlined"
        style={styles.input}
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
        mode="outlined"
        style={styles.input}
      />

      <Button 
        mode="contained"
        onPress={handleReset}
        disabled={loading}
        loading={loading}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Update Password
      </Button>

      <Button 
        mode="text"
        onPress={() => router.replace('/auth')}
        style={styles.linkButton}
      >
        Back to Login
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    justifyContent: 'center', 
    backgroundColor: '#fff' 
  },
  title: { 
    fontWeight: 'bold', 
    marginBottom: 30, 
    textAlign: 'center' 
  },
  input: { 
    marginBottom: 16 
  },
  button: { 
    marginTop: 8 
  },
  buttonContent: {
    paddingVertical: 6
  },
  linkButton: { 
    marginTop: 16 
  }
});