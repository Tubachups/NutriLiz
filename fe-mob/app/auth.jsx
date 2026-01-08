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

const { width, height } = Dimensions.get("window");

const TopographicBackground = () => (
  <Svg
    style={StyleSheet.absoluteFill}
    width={width}
    height={height}
    viewBox={`0 0 ${width} ${height}`}
  >
    <Path d={`M0,0 L${width},0 L${width},${height} L0,${height} Z`} fill="#79e0beff" />
    
    {[...Array(15)].map((_, i) => (
      <Path
        key={i}
        d={`M${-50 + i * 30},${50 + i * 25} 
            Q${width * 0.3},${40 + i * 22} ${width * 0.5},${60 + i * 28}
            T${width + 50},${45 + i * 25}`}
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="1.5"
        fill="none"
      />
    ))}
    
    {[...Array(12)].map((_, i) => (
      <Path
        key={`c2-${i}`}
        d={`M${-30},${80 + i * 30} 
            Q${width * 0.25},${100 + i * 28} ${width * 0.6},${70 + i * 32}
            T${width + 30},${90 + i * 30}`}
        stroke="rgba(200, 255, 233, 0.18)"
        strokeWidth="1"
        fill="none"
      />
    ))}

    <Path
      d={`M${width * 0.7},${height * 0.08} 
          Q${width * 0.85},${height * 0.12} ${width * 0.8},${height * 0.22}
          Q${width * 0.75},${height * 0.28} ${width * 0.9},${height * 0.25}`}
      stroke="rgba(255, 255, 255, 0.29)"
      strokeWidth="2"
      fill="none"
    />

    <Path
      d={`M0,${height * 0.22} 
          Q${width * 0.3},${height * 0.18} ${width * 0.5},${height * 0.24}
          Q${width * 0.7},${height * 0.30} ${width},${height * 0.20}
          L${width},${height} L0,${height} Z`}
      fill="#FFFFFF"
    />
  </Svg>
);

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [userName, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [securePassword, setSecurePassword] = useState(true);

  const theme = useTheme();
  const router = useRouter();
  const { signUp, signIn } = useAuth();

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
    router.replace("/");
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

          <Button 
            mode="text" 
            onPress={() => toggleAuthMode(!isSignUp)}
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
    marginBottom: 16,
    borderRadius: 25,
    paddingVertical: 4,
  },
});