import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { PaperProvider, Button, Text, Card, ActivityIndicator } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useProductAPI } from '../hooks/useProductAPI';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function Index() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(true);
  const { fetchProduct, loading } = useProductAPI();
  const router = useRouter();

  // Reset camera visibility when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setCameraVisible(true);
      setScanned(false);
      
      return () => {
        // Cleanup when screen loses focus
        setCameraVisible(false);
      };
    }, [])
  );

  if (!permission) {
    return <View />;
  }

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

  const handleBarcodeScanned = async ({ type, data }) => {
    if (!scanned && !loading) {
      setScanned(true);
      console.log(`Scanned: ${data}`);

      // Fetch product data
      const productData = await fetchProduct(data);
      
      if (productData) {
        // Navigate to product detail screen
        router.push({
          pathname: '/product-detail',
          params: { 
            barcode: data,
            productData: JSON.stringify(productData)
          }
        });
      } else {
        Alert.alert('Error', 'Product not found');
        // Reset scan state if product not found
        setTimeout(() => setScanned(false), 2000);
      }
    }
  };

  if (!cameraVisible) {
    return (
      <View style={styles.container}>
        <Text variant="titleMedium" style={styles.message}>
          Camera Closed
        </Text>
        <Button mode="contained" onPress={() => setCameraVisible(true)}>
          Open Camera
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
        }}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      )}

      {scanned && !loading && (
        <View style={styles.scannedOverlay}>
          <Text style={styles.scannedText}>✓ Barcode Scanned</Text>
        </View>
      )}

      <View style={styles.bottomBar}>
        <Button 
          mode="contained" 
          onPress={() => setCameraVisible(false)}
          style={styles.closeButton}
        >
          Close Camera
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  camera: {
    flex: 1,
  },
  message: {
    textAlign: 'center',
    color: 'white',
    marginBottom: 16,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  scannedOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scannedText: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    backgroundColor: '#f44336',
  },
});