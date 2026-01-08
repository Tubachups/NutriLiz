import { Tabs, useRouter } from "expo-router";
import { PaperProvider } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <PaperProvider>
      <Tabs
        screenOptions={{
          headerStyle: {
            backgroundColor: '#77dfbcff',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShadowVisible: false,
          headerTitleAlign: 'center',
          tabBarActiveTintColor: '#7fc1baff',
          tabBarInactiveTintColor: '#717674ff',

          tabBarStyle: {
            backgroundColor: '#ECF4E8',
            borderTopColor: '#ABE7B2',
            height: 60 + insets.bottom,
            paddingBottom: 8 + insets.bottom,
            paddingTop: 8,
          },
        }}
      >
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerShown: true,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-circle" size={size} color={color} />
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
          name="food-scan"
          options={{
            title: 'Food Photo',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="food" size={24} color={color} />
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
          name="list"
          options={{
            title: 'History',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="product-detail"
          options={{
            title: 'Product Details',
            headerShown: true,
            href: null,
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.replace('/list')}
                style={{ marginLeft: 16 }}
              >
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
            ),
          }}
        />

        <Tabs.Screen
          name="food-detail"
          options={{
            title: 'Food Details',
            headerShown: true,
            href: null,
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.replace('/list')}
                style={{ marginLeft: 16 }}
              >
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
            ),
          }}
        />
      </Tabs>
    </PaperProvider>
  );
}