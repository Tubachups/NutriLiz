import { Tabs, useRouter } from "expo-router";
import { PaperProvider, Portal, Modal, Button, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { TouchableOpacity, View, StyleSheet, Dimensions, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/auth-context';
import { useState, useRef, useEffect } from 'react';
import Svg, { Path } from "react-native-svg";

const { width } = Dimensions.get("window");

// Calculate tab width (5 visible tabs)
const TAB_COUNT = 5;
const TAB_WIDTH = width / TAB_COUNT;

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

const TAB_INDICES = {
  'profile': 0,
  'scan': 1,
  'food-scan': 2,
  'index': 3,
  'list': 4,
};

export default function TabsLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const indicatorPosition = useRef(new Animated.Value(TAB_INDICES['index'] * TAB_WIDTH)).current;

  // This state is only for animation, not for tracking the actual tab
  // The actual tab index comes from the navigation state
  // So we don't need activeTab state anymore

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
      const tabIndex = state.index;
      Animated.spring(indicatorPosition, {
        toValue: tabIndex * TAB_WIDTH,
        useNativeDriver: true,
        tension: 68,
        friction: 12,
      }).start();
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
                case 'food-scan':
                  return <MaterialCommunityIcons name="food" size={size} color={color} />;
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
            title: 'Scan Product',
            headerShown: true,
          }}
        />

        <Tabs.Screen
          name="food-scan"
          options={{
            title: 'Food Photo',
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