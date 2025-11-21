import { AuthProvider, useAuth } from "@/hooks/auth-context";
import { useRouter, Stack, useSegments } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, ActivityIndicator, StyleSheet } from "react-native";

function RouteGuard({ children }) {
  const router = useRouter();
  const { user, isLoadingUser } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoadingUser) return; // Don't do anything while loading

    const inAuthGroup = segments.includes("auth") || segments.includes("forgotPass") || segments.includes("resetPass");

    if (!user && !inAuthGroup) {
      // User is not signed in and not on auth screen
      router.replace("/auth");
    } else if (user && inAuthGroup) {
      // User is signed in but on auth screen
      router.replace("/(tabs)");
    }
  }, [user, segments, isLoadingUser]);

  // Show loading screen while checking authentication
  if (isLoadingUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#93BFC7" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <RouteGuard>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false
              }}
            />
            <Stack.Screen
              name="auth"
              options={{
                headerShown: false
              }}
            />
            <Stack.Screen
              name="forgotPass"
              options={{
                headerShown: false
              }}
            />
            <Stack.Screen
              name="resetPass"
              options={{
                headerShown: false
              }}
            />
            <Stack.Screen
              name="TestBarcode"
              options={{
                title: 'Test Barcode',
                headerShown: true,
                headerStyle: {
                  backgroundColor: '#ECF4E8',
                },
                headerTintColor: '#000',
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            />
          </Stack>
        </RouteGuard>
      </SafeAreaProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ECF4E8',
  },
});