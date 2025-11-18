import { useRouter, Stack } from "expo-router";
import { useEffect } from "react";

function RouteGuard({ children }) {
  // Implement authentication logic here
  const isAuth = false;
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuth) {
      router.replace("/auth");
    }
  }, []); // Add dependency array

  return <>{children}</>; // Move return outside useEffect
}

export default function RootLayout() {
  return (
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
  );
}