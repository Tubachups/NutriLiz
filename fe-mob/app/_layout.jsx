import { router, Stack } from "expo-router";
import { useEffect } from "react";
import { PaperProvider } from 'react-native-paper';

function RouteGuard({ children }) {
  // Implement authentication logic here
  const isAuthenticated = false;

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      // navigation logic to redirect to login
      router.replace("/auth");
    }
    return <>{children}</>
  });
}


export default function RootLayout() {
  return (
    <RouteGuard>
      <PaperProvider>
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
      </PaperProvider>
    </RouteGuard>

  );
}