import { Stack } from "expo-router";
import { PaperProvider } from 'react-native-paper';

export default function RootLayout() {
  return (
    <PaperProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#ECF4E8',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: '🥗 NutriLiz Scanner',
            headerShown: true
          }} 
        />
        <Stack.Screen 
          name="product-detail" 
          options={{ 
            title: 'Product Details',
            headerShown: true
          }} 
        />
      </Stack>
    </PaperProvider>
  );
}