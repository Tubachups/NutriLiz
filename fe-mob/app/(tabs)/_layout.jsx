import { Tabs } from "expo-router";
import { PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <PaperProvider>
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: '#CBF3BB',      // secondary
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShadowVisible: false,
          headerTitleAlign: 'center',
          tabBarActiveTintColor: '#93BFC7',   // dark
          tabBarInactiveTintColor: '#757575',

          // ⭐ Add tabBarStyle here
          tabBarStyle: {
            backgroundColor: '#ECF4E8',      // primary
            borderTopColor: '#ABE7B2',       // accent
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
        }}
      >

        <Tabs.Screen
          name="profile"  // Keep this the same as your file name
          options={{
            title: 'Profile',  // Changed from 'Login'
            headerShown: true,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-circle" size={size} color={color} />  // Changed icon
            ),
          }}
        />

        

        <Tabs.Screen
          name="scan"
          options={{
            title: 'Scan Product',
            headerShown: true,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="scan" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: true,
            headerTitle: ' NutriLiz Scanner',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="product-detail"
          options={{
            title: 'Product Details',
            headerShown: true,
            href: null, // Hidden in tab bar
          }}
        />
      </Tabs>
    </PaperProvider>
  );
}
