import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { account } from '../lib/appwrite';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      // Create password recovery
      await account.createRecovery(
        email,
        'fe:mob/resetPass' // Update this URL based on your app scheme
      );
      
      Alert.alert(
        'Success',
        'Password reset link has been sent to your email',
        [{ text: 'OK', onPress: () => router.replace('/auth') }]
      );
    } catch (error) {
      console.error('Forgot password error:', error);
      Alert.alert('Error', error.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Forgot Password
      </Text>
      
      <TextInput
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          borderRadius: 5,
          marginBottom: 15,
        }}
      />

      <TouchableOpacity
        onPress={handleForgotPassword}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#ccc' : '#007AFF',
          padding: 15,
          borderRadius: 5,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 15 }}>
        <Text style={{ color: '#007AFF', textAlign: 'center' }}>
          Back to Login
        </Text>
      </TouchableOpacity>
    </View>
  );
}