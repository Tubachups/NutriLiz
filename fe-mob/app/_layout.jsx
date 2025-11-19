import { AuthProvider, useAuth } from "@/hooks/auth-context";
import { useRouter, Stack, useSegments } from "expo-router";
import { useEffect } from "react";

function RouteGuard({ children }) {
  const router = useRouter();
  const { user, isLoadingUser } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    const inAuthGroup = segments.includes("auth");

    if (!user && !inAuthGroup && !isLoadingUser) {
      router.replace("/auth");
    } else if (user && inAuthGroup && !isLoadingUser) {
      router.replace("/");
    }
  }, [user, segments]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}