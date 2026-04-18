import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, View, StyleSheet, Dimensions } from "react-native";
import { TextInput, Button, Text, useTheme } from "react-native-paper";
import { useAuth } from "@/hooks/auth-context";
import Svg, { Path } from "react-native-svg";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing 
} from "react-native-reanimated";
import TopographicBackground from "./components/TopographicBg";

const { width, height } = Dimensions.get("window");

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [userName, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [securePassword, setSecurePassword] = useState(true);
  const [oauthLoadingProvider, setOauthLoadingProvider] = useState(null);
  const theme = useTheme();
  const router = useRouter();
  const { signUp, signIn, signInWithGoogle, signInWithFacebook } = useAuth();

  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const toggleAuthMode = (toSignUp) => {
    const direction = toSignUp ? -1 : 1;
    
    // Fade out and slide
    opacity.value = withTiming(0, { duration: 150, easing: Easing.ease });
    translateX.value = withTiming(direction * -50, { duration: 180, easing: Easing.ease });

    setTimeout(() => {
      setIsSignUp(toSignUp);
      
      // Reset position to opposite side
      translateX.value = direction * 50;
      
      // Fade in and slide back
      opacity.value = withTiming(1, { duration: 150, easing: Easing.ease });
      translateX.value = withTiming(0, { duration: 150, easing: Easing.ease });
    }, 150);
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAuth = async () => {
    if (!email || !password || (isSignUp && !userName)) {
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
      const error = await signUp(email, password, userName);
      if (error) {
        setError(error);
        return;
      }
    } else {
      const error = await signIn(email, password);
      if (error) {
        setError(error);
        return;
      }
    }
  };

  const handleProviderAuth = async (provider, signInFn) => {
    setOauthLoadingProvider(provider);
    setError(null);

    try{
      const oauthResult = await signInFn();
      if (!oauthResult.success) {
        setError(oauthResult.error);
        return;
      }
    } catch (error) {
      setError('An unexpected error occurred during OAuth login.');
    } finally {
      setOauthLoadingProvider(null);
    }
  };
  

  return (
    <View style={styles.container}>
      <TopographicBackground />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <Animated.View style={[styles.formContainer, { paddingTop: isSignUp ? height * 0.08 : height * 0.03 }, animatedStyle]}>
          <Text style={styles.title}>{isSignUp ? "Create your account!" : "Welcome to NutriLiz!"}</Text>

          {isSignUp && (
            <TextInput
              label='Username'
              value={userName}
              onChangeText={(text) => {
                setUsername(text);
                setError(null);
              }}
              autoCapitalize="none"
              autoComplete="off"
              keyboardType="default"
              placeholder="john_lloyd"
              placeholderTextColor="#999"
              mode="flat"
              style={styles.input}
              underlineColor="#ddd"
              activeUnderlineColor="#67caa9ff"
              right={<TextInput.Icon icon="account-outline" color="#83b9a8ff" />}
            />
          )}

          <TextInput
            label='Email'
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError(null);
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="example@email.com"
            placeholderTextColor="#999"
            mode="flat"
            style={styles.input}
            underlineColor="#ddd"
            activeUnderlineColor="#67caa9ff"
            right={<TextInput.Icon icon="email-outline" color="#83b9a8ff" />}
          />

          <TextInput
            label='Password'
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError(null);
            }}
            autoCapitalize="none"
            secureTextEntry={securePassword}
            placeholder="enter your password"
            placeholderTextColor="#999"
            mode="flat"
            style={styles.input}
            underlineColor="#ddd"
            activeUnderlineColor="#67caa9ff"
            right={
              <TextInput.Icon 
                icon={securePassword ? "eye-off-outline" : "eye-outline"} 
                color="#83b9a8ff"
                onPress={() => setSecurePassword(!securePassword)}
              />
            }
          />

          {error && <Text style={{ color: theme.colors.error }}> {error}</Text>}

          <Button
            mode="contained"
            onPress={handleAuth}
            style={styles.button}
            buttonColor="#67caa9ff"
            textColor="#fff"
          >
            {isSignUp ? "Sign Up" : "Login"}
          </Button>

          {!isSignUp && (
            <>
            
            <Button
              mode="outlined"
              onPress={() => handleProviderAuth('google', signInWithGoogle)}
              style={styles.googleButton}
              textColor="#2b2b2b"
              loading={oauthLoadingProvider === 'google'}
              disabled={oauthLoadingProvider === 'google'}
              icon="google"
            >
              Continue with Google
            </Button>

            <Button
              mode="outlined"
              onPress={() => handleProviderAuth('facebook', signInWithFacebook)}
              style={styles.facebookButton}
              textColor="#2b2b2b"
              loading={oauthLoadingProvider === 'facebook'}
              disabled={oauthLoadingProvider === 'facebook'}
              icon="facebook"
            >
              Continue with Facebook
            </Button>
            </>

          )}

          <Button 
            mode="text" 
            onPress={() => {
              setError(null);
              toggleAuthMode(!isSignUp)

            }}
            textColor="#666"
          >
            {isSignUp ? "Already have an account? " : "Don't have an Account? "}
            <Text style={{ color: "#67caa9ff" }}>{isSignUp ? "Sign In" : "Sign up"}</Text>
          </Button>

          <Button 
            mode="text" 
            onPress={() => router.push('/forgotPass')}
            textColor="#58b294ff"
          >
            Forgot Password?
          </Button>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );

}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#67caa9ff',
  },
  keyboardView: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'left',
    color: '#333',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  button: {
    marginTop: 16,
    marginBottom: 10,
    borderRadius: 25,
    paddingVertical: 4,
  },
  googleButton: {
    marginBottom: 14,
    borderRadius: 25,
    borderColor: '#9cb6acff',
  },
  facebookButton: {
    marginBottom: 14,
    borderRadius: 25,
    borderColor: '#9cb6acff',
  },
});