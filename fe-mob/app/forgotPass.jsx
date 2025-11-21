import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useAuth } from '@/hooks/auth-context';
import { router } from 'expo-router';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSendLink = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setLoading(true);
    const result = await forgotPassword(email);
    setLoading(false);

    if (result.success) {
      Alert.alert("Success", "Password reset link sent to your email.");
      router.back(); // Go back to login
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Reset Password
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Enter your email to receive a reset link
      </Text>

      <TextInput
        label="Email Address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        mode="outlined"
        style={styles.input}
        left={<TextInput.Icon icon="email" />}
      />

      <Button
        mode="contained"
        onPress={handleSendLink}
        disabled={loading}
        loading={loading}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Send Reset Link
      </Button>

      <Button
        mode="text"
        onPress={() => router.back()}
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
    marginBottom: 10, 
    textAlign: 'center' 
  },
  subtitle: { 
    color: '#666', 
    marginBottom: 30, 
    textAlign: 'center' 
  },
  input: { 
    marginBottom: 20 
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