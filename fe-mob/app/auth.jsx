import { KeyboardAvoidingView, Platform, View, Text } from "react-native";

export default function AuthScreen() {
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"} 
      style={{ flex: 1 }}>
      
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Create Account</Text>
      </View>

    </KeyboardAvoidingView>
  );
}