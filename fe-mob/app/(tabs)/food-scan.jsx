import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Alert, Image } from 'react-native';
import { Button, Text, ActivityIndicator, IconButton, Card } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useFoodImageAPI } from '@/hooks/useFoodImageAPI';
import { useProductHistory } from '@/hooks/useProductHistory';
import { useRouter } from 'expo-router';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useAuth } from '@/hooks/auth-context';
import { getUserProfile } from '@/lib/appwriteDb';


export default function FoodScan() {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef(null);
  const { analyzeFoodImage, loading } = useFoodImageAPI();
  const { addFoodItem } = useProductHistory();
  const { user } = useAuth();
  const router = useRouter();
  const isFocused = useIsFocused();

  useFocusEffect(
    useCallback(() => {
      setCapturedImage(null);
      setTorchEnabled(false);
      setCameraReady(false);

      // Add a small delay before activating camera to let the other camera release
      const timer = setTimeout(() => {
        setCameraReady(true);
      }, 100);

      return () => {
        clearTimeout(timer);
        setTorchEnabled(false);
        setCameraReady(false);
      };
    }, [])
  );

  // Only show camera when both focused AND ready
  const isCameraActive = isFocused && cameraReady && !capturedImage;

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text variant="titleMedium" style={styles.message}>
          We need your permission to use the camera
        </Text>
        <Button mode="contained" onPress={requestPermission}>
          Grant Camera Permission
        </Button>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.5,
        });
        setCapturedImage(photo);
        await analyzePhoto(photo.base64, photo.uri);
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setCapturedImage(result.assets[0]);
      await analyzePhoto(result.assets[0].base64, result.assets[0].uri);
    }
  };

  const analyzePhoto = async (base64Image, imageUri = null) => {
    // Get user profile for personalized assessment
    let userProfile = null;
    if (user) {
      try {
        userProfile = await getUserProfile(user.$id);
      } catch (e) {
        console.log('Could not fetch user profile');
      }
    }

    const foodData = await analyzeFoodImage(base64Image, userProfile);

    if (foodData && foodData.identified) {
      // Save to history
      await addFoodItem(foodData, imageUri);
      
      router.push({
        pathname: '/food-detail',
        params: { foodData: JSON.stringify(foodData) },
      });
    } else if (foodData && !foodData.identified) {
      Alert.alert('Not Recognized', foodData.description || 'Could not identify the food in this image');
      setCapturedImage(null);
    } else {
      Alert.alert('Error', 'Failed to analyze the image');
      setCapturedImage(null);
    }
  };

  const retake = () => {
    setCapturedImage(null);
  };

  if (capturedImage) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedImage.uri }} style={styles.preview} />
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Analyzing food...</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isCameraActive ? (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          enableTorch={torchEnabled}
          active={true}
        />
      ) : (
        <View style={[styles.camera, styles.cameraPlaceholder]}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}

      {/* Camera Frame Borders */}
      <View style={styles.frameBorderContainer}>
        {/* Top Left Corner */}
        <View style={[styles.corner, styles.cornerTopLeft]}>
          <View style={[styles.cornerBorder, styles.cornerBorderTop]} />
          <View style={[styles.cornerBorder, styles.cornerBorderLeft]} />
        </View>
        
        {/* Top Right Corner */}
        <View style={[styles.corner, styles.cornerTopRight]}>
          <View style={[styles.cornerBorder, styles.cornerBorderTop]} />
          <View style={[styles.cornerBorder, styles.cornerBorderRight]} />
        </View>
        
        {/* Bottom Left Corner */}
        <View style={[styles.corner, styles.cornerBottomLeft]}>
          <View style={[styles.cornerBorder, styles.cornerBorderBottom]} />
          <View style={[styles.cornerBorder, styles.cornerBorderLeft]} />
        </View>
        
        {/* Bottom Right Corner */}
        <View style={[styles.corner, styles.cornerBottomRight]}>
          <View style={[styles.cornerBorder, styles.cornerBorderBottom]} />
          <View style={[styles.cornerBorder, styles.cornerBorderRight]} />
        </View>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Analyzing food...</Text>
        </View>
      )}

      {/* Top bar with torch and gallery */}
      <View style={styles.topBar}>
        <IconButton
          icon="image"
          iconColor="white"
          size={30}
          onPress={pickImage}
          style={styles.iconButton}
        />
        <IconButton
          icon={torchEnabled ? 'flashlight' : 'flashlight-off'}
          iconColor="white"
          size={30}
          onPress={() => setTorchEnabled(!torchEnabled)}
          style={styles.iconButton}
        />
      </View>

      {/* Capture button */}
      <View style={styles.captureButtonContainer}>
        <IconButton
          icon="camera"
          iconColor="white"
          size={50}
          onPress={takePicture}
          style={styles.captureButton}
        />
      </View>

      {/* Instructions */}
      <View style={styles.instructionBanner}>
        <Text style={styles.instructionText}>
          📸 Take a photo of your food to identify it
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  camera: { flex: 1 },
  cameraPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  preview: { flex: 1, resizeMode: 'contain' },
  message: { textAlign: 'center', color: 'white', marginBottom: 16 },

  // Camera Frame Borders
  frameBorderContainer: {
    position: 'absolute',
    top: 100,
    left: 30,
    right: 30,
    bottom: 200,
    borderRadius: 5,        // <-- Add this line (adjust value as needed)
    overflow: 'hidden', 
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
  },
  cornerBorder: {
    position: 'absolute',
    backgroundColor: 'rgba(180, 180, 180, 0.8)',
  },
  cornerBorderTop: {
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  cornerBorderBottom: {
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  cornerBorderLeft: {
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
  },
  cornerBorderRight: {
    top: 0,
    right: 0,
    bottom: 0,
    width: 4,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { color: 'white', marginTop: 10, fontSize: 16 },

  instructionBanner: {
    position: 'absolute',
    bottom: 140,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  instructionText: { color: 'white', fontSize: 14 },

  topBar: {
    position: 'absolute',
    top: 40,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },

  captureButtonContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  captureButton: {
    backgroundColor: '#4caf7cff',
    width: 80,
    height: 80,
    borderRadius: 40,
  },

  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  button: { marginTop: 10 },
});