import { Tabs } from "expo-router";
import { PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <PaperProvider>
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: '#ECF4E8',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          tabBarActiveTintColor: '#4CAF50',
          tabBarInactiveTintColor: '#757575',
        }}
      >
        <Tabs.Screen 
          name="index" 
          options={{ 
            title: 'Scan Product',
            headerShown: true,
            headerTitle: '🥗 NutriLiz Scanner',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="scan" size={size} color={color} />
            ),
          }} 
        />

        <Tabs.Screen
          name="login"
          options={{
            title: 'Login',
            headerShown: true,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen 
          name="product-detail" 
          options={{ 
            title: 'Product Details',
            headerShown: true,
            href: null, // Hide from tab bar
          }} 
        />
      </Tabs>
    </PaperProvider>
  );
}