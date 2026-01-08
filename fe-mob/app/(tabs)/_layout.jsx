import { Tabs, useRouter } from "expo-router";
import { PaperProvider, Portal, Modal, Button, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { TouchableOpacity, View, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/auth-context';
import { useState } from 'react';
import Svg, { Path } from "react-native-svg";

const { width } = Dimensions.get("window");


const TopographicHeader = ({ insetTop }) => (
  <Svg
    width={width}
    height={90 + insetTop}
    viewBox={`0 0 ${width} ${90 + insetTop}`}
  >
    {/* Base green background */}
    <Path d={`M0,0 L${width},0 L${width},${70 + insetTop} L0,${70 + insetTop} Z`} fill="#77dfbcff" />
    
    {/* Topographic contour lines */}
    {[...Array(10)].map((_, i) => (
      <Path
        key={i}
        d={`M${-50},${insetTop + 5 + i * 8} 
            Q${width * 0.25},${insetTop - 5 + i * 8} ${width * 0.5},${insetTop + 10 + i * 8}
            Q${width * 0.75},${insetTop + 25 + i * 8} ${width + 50},${insetTop + 5 + i * 8}`}
        stroke="rgba(255, 255, 255, 0.3)"
        strokeWidth="1.5"
        fill="none"
      />
    ))}
    
    {[...Array(8)].map((_, i) => (
      <Path
        key={`c2-${i}`}
        d={`M${-30},${insetTop + 8 + i * 10} 
            Q${width * 0.3},${insetTop + 20 + i * 10} ${width * 0.6},${insetTop + i * 10}
            Q${width * 0.85},${insetTop - 10 + i * 10} ${width + 30},${insetTop + 15 + i * 10}`}
        stroke="rgba(200, 255, 233, 0.25)"
        strokeWidth="1"
        fill="none"
      />
    ))}

    {/* Green wavy area at the bottom */}
    <Path
      d={`M0,${65 + insetTop} 
          Q${width * 0.15},${72 + insetTop} ${width * 0.3},${68 + insetTop}
          Q${width * 0.5},${62 + insetTop} ${width * 0.7},${72 + insetTop}
          Q${width * 0.85},${78 + insetTop} ${width},${68 + insetTop}
          L${width},${90 + insetTop} L0,${90 + insetTop} Z`}
      fill="#67caa9ff"
    />

    {/* Dark wavy border line at top of green area */}
    <Path
      d={`M0,${65 + insetTop} 
          Q${width * 0.15},${72 + insetTop} ${width * 0.3},${68 + insetTop}
          Q${width * 0.5},${62 + insetTop} ${width * 0.7},${72 + insetTop}
          Q${width * 0.85},${78 + insetTop} ${width},${68 + insetTop}`}
      stroke="#45a787ff"
      strokeWidth="2"
      fill="none"
    />

    {/* Dark green border at bottom of green area */}
    <Path
      d={`M0,${90 + insetTop} L${width},${90 + insetTop}`}
      stroke="#4ea387ff"
      strokeWidth="3"
      fill="none"
    />
  </Svg>
);

export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const handleSignOut = async () => {
    setShowSignOutModal(false);
    await signOut();
    router.replace('/auth');
  };

  const SignOutButton = () => (
    <TouchableOpacity
      onPress={() => setShowSignOutModal(true)}
      style={{ marginRight: 16 }}
    >
      <Ionicons name="log-out-outline" size={24} color="#336f5cff" />
    </TouchableOpacity>
  );

  const CustomHeader = ({ options, showBackButton = false }) => (
    <View style={styles.headerContainer}>
      <TopographicHeader insetTop={insets.top} />
      <View style={[styles.headerContent, { top: insets.top }]}>
        {showBackButton ? (
          <TouchableOpacity
            onPress={() => router.replace('/list')}
            style={{ marginLeft: 16 }}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <Text style={styles.headerTitleCenter}>{options.headerTitle || options.title}</Text>
        <SignOutButton />
      </View>
    </View>
  );

  return (
    <PaperProvider>
      <Portal>
        <Modal
          visible={showSignOutModal}
          onDismiss={() => setShowSignOutModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Ionicons name="arrow-back-circle-outline" size={48} color="#5ebb9cff" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Sign Out</Text>
            <Text style={styles.modalMessage}>Are you sure you want to sign out?</Text>
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setShowSignOutModal(false)}
                style={styles.cancelButton}
                textColor="#666"
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSignOut}
                style={styles.signOutButton}
                buttonColor="#67caa9"
                textColor="#fff"
              >
                Sign Out
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>

      <Tabs
        screenOptions={{
          header: ({ options }) => <CustomHeader options={options} />,
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShadowVisible: false,
          headerTitleAlign: 'center',
          tabBarActiveTintColor: '#7fc1c0ff',
          tabBarInactiveTintColor: '#717674ff',

          tabBarStyle: {
            backgroundColor: '#d7eee6ff',
            borderTopColor: '#ABE7B2',  //top and bottom border legend!
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
            headerShown: true,
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
            headerTitle: 'Home',
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
            header: ({ options }) => <CustomHeader options={options} showBackButton />,
          }}
        />

        <Tabs.Screen
          name="food-detail"
          options={{
            title: 'Food Details',
            headerShown: true,
            href: null,
            header: ({ options }) => <CustomHeader options={options} showBackButton />,
          }}
        />
      </Tabs>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#67caa9ff',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    paddingHorizontal: 0,
    margin: 10,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  headerTitleCenter: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    padding: 24,
  },
  modalContent: {
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    borderColor: '#ccc',
    borderRadius: 25,
  },
  signOutButton: {
    flex: 1,
    borderRadius: 25,
  },
});