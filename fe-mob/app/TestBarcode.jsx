import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { PaperProvider, Button, Text, IconButton } from 'react-native-paper';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraVisible, setCameraVisible] = useState(true);
  const [scanned, setScanned] = useState(false);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <PaperProvider>
        <View style={[styles.container, { backgroundColor: '#121212' }]}>
          <Text variant="titleMedium" style={styles.message}>
            We need your permission to show the camera
          </Text>
          <Button mode="contained" onPress={requestPermission}>
            Grant Permission
          </Button>
        </View>
      </PaperProvider>
    );
  }

  const handleBarcodeScanned = ({ type, data }) => {
    if (!scanned) {
      setScanned(true);
      console.log(`Scanned barcode of type ${type}: ${data}`);
      setTimeout(() => setScanned(false), 2000);
    }
  };

  const closeCamera = () => setCameraVisible(false);

  if (!cameraVisible) {
    return (
      <PaperProvider>
        <View style={[styles.container, { backgroundColor: '#121212' }]}>
          <Text variant="titleMedium" style={styles.message}>
            Camera Closed
          </Text>
          <Button mode="contained" onPress={() => setCameraVisible(true)}>
            Open Camera
          </Button>
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider>
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={handleBarcodeScanned}
        />

        {/* Close button using React Native Paper IconButton */}
        <IconButton
          icon="close"
          size={28}
          iconColor="white"
          style={styles.closeButton}
          onPress={closeCamera}
          mode="contained-tonal"
        />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  message: {
    textAlign: 'center',
    color: 'white',
    marginBottom: 16,
  },
  camera: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
  },
});
