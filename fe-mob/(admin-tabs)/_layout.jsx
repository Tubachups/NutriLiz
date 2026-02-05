import { Tabs, useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/auth-context';
import { useState, useEffect } from 'react';

export default function AdminTabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut, isAdmin, isLoadingUser } = useAuth();
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // Redirect non-admins to user tabs
  useEffect(() => {
    if (!isLoadingUser && !isAdmin) {
      router.replace('/(tabs)');
    }
  }, [isAdmin, isLoadingUser]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth');
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#93BFC7',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e5e5e5',
          paddingBottom: insets.bottom,
          height: 60 + insets.bottom,
        },
        headerStyle: {
          backgroundColor: '#93BFC7',
        },
        headerTintColor: '#fff',
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          headerTitle: 'Admin Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleSignOut} style={{ marginRight: 16 }}>
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="users-detail"
        options={{
          href: null, // Hide from tab bar - this is a detail screen accessed via navigation
          headerShown: false, // We handle header in the screen itself
        }}
      />
    </Tabs>
  );
}