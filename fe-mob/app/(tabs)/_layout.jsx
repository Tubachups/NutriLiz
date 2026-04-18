import { Tabs, useRouter } from "expo-router";
import { PaperProvider, Portal, Modal, Button, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { TouchableOpacity, View, StyleSheet, Dimensions, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/auth-context';
import { useState, useRef, useEffect } from 'react';
import Svg, { Path } from "react-native-svg";
import TopographicHeader from '../components/TopographicHead';

const { width } = Dimensions.get("window");

// Calculate tab width (4 visible tabs)
const TAB_COUNT = 4;
const TAB_WIDTH = width / TAB_COUNT;

const TAB_INDICES = {
  'index': 0,
  'scan': 1,
  'list': 2,
  'profile': 3,
};

export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const indicatorPosition = useRef(new Animated.Value(TAB_INDICES['index'] * TAB_WIDTH)).current;


  // CustomTabBar will receive the navigation state and update the indicator accordingly
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

  const CustomHeader = ({ options, showBackButton = false, showSignOut = false }) => (
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
        {showSignOut ? <SignOutButton /> : <View style={{ width: 40 }} />}
      </View>
    </View>
  );

  const CustomTabBar = ({ state, descriptors, navigation }) => {
    // Animate indicator when navigation state changes (including back button)
    useEffect(() => {
      // Get the current route name and map it to the visual tab index
      const currentRouteName = state.routes[state.index]?.name;
      const visualTabIndex = TAB_INDICES[currentRouteName];
      
      // Only animate if it's a visible tab
      if (visualTabIndex !== undefined) {
        Animated.spring(indicatorPosition, {
          toValue: visualTabIndex * TAB_WIDTH,
          useNativeDriver: true,
          tension: 68,
          friction: 12,
        }).start();
      }
    }, [state.index]);

    return (
      <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom }]}>
        {/* Animated indicator line */}
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              width: TAB_WIDTH - 20,
              transform: [{ translateX: Animated.add(indicatorPosition, 10) }],
            },
          ]}
        />
        
        <View style={styles.tabBar}>
          {state.routes.map((route, index) => {
            // Skip hidden tabs
            if (TAB_INDICES[route.name] === undefined) return null;

            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const getIcon = () => {
              const color = isFocused ? '#69aeadff' : 'rgba(94, 98, 97, 1)';
              const size = 24;
              
              switch (route.name) {
                case 'profile':
                  return <Ionicons name="person-circle" size={size} color={color} />;
                case 'scan':
                  return <Ionicons name="scan" size={size} color={color} />;
                case 'index':
                  return <Ionicons name="home" size={size} color={color} />;
                case 'list':
                  return <Ionicons name="list" size={size} color={color} />;
                default:
                  return null;
              }
            };

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.tabItem}
              >
                {getIcon()}
                <Text style={[
                  styles.tabLabel,
                  { color: isFocused ? '#7fc1c0ff' : '#717674ff' }
                ]}>
                  {options.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

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
        }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >

        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: true,
            headerTitle: 'Home',
          }}
        />

        <Tabs.Screen
          name="scan"
          options={{
            title: 'Scan',
            headerShown: true,
          }}
        />

        <Tabs.Screen
          name="list"
          options={{
            title: 'History',
            headerShown: false,
          }}
        />

        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerShown: true,
            header: ({ options }) => <CustomHeader options={options} showSignOut={true} />,
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
  // Custom Tab Bar Styles
  tabBarContainer: {
    backgroundColor: '#c9e9deff',
    borderTopColor: '#ABE7B2',
  },
  tabIndicator: {
    position: 'absolute',
    top: 0,
    height: 3,
    backgroundColor: '#69aeadff',
    borderRadius: 5,
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    paddingTop: 7,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
  },
});