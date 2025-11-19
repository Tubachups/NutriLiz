import { useState } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, View, StyleSheet } from "react-native";
import { TextInput, Button, Text, useTheme } from "react-native-paper";
import { useAuth } from "@/hooks/auth-context";

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const theme = useTheme();
  const router = useRouter();

  const { signUp, signIn } = useAuth();

  const toggleAuthMode = () => {
    setIsSignUp((prev) => !prev);
  }

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  const handleAuth = async () => {
    // Handle sign in or sign up logic here
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    setError(null);

    if (isSignUp) {
      // Sign up logic
      const error = await signUp(email, password);
      if (error) {
        setError(error);
        return
      }
    } else {
      // Sign in logic
      const error = await signIn(email, password);
      if (error) {
        setError(error);
        return
      }
    }
    router.replace("/");
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.formContainer}>
        <Text style={styles.title}>{isSignUp ? "Create Account" : "Welcome Back!"}</Text>

        <TextInput
          label='Email'
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="example@gmail.com"
          placeholderTextColor="#999"
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label='Password'
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          secureTextEntry
          mode="outlined"
          style={styles.input}
        />

        {
          error && <Text style={{ color: theme.colors.error }}> {error}</Text>
        }

        <Button
          mode="contained"
          onPress={handleAuth}
          style={styles.button}
        >
          {isSignUp ? "Sign Up" : "Sign In"}
        </Button>

        <Button mode="text" onPress={toggleAuthMode}>
          {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
});