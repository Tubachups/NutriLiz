import { KeyboardAvoidingView, Platform, View, Text } from "react-native";

export default function AuthScreen() {
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{ flex: 1 }}>
      
      <View>
        <Text>Create Account</Text>
      </View>

    </KeyboardAvoidingView>
  );
}