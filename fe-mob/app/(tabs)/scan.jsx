import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, ActivityIndicator, IconButton } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useProductAPI } from '../../hooks/useProductAPI';
import { useRouter, Link } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

export default function Index() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const { fetchProduct, loading } = useProductAPI();
  const router = useRouter();

  // Reset scan state every time screen is focused
  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      setTorchEnabled(false);

      return () => {
        setTorchEnabled(false);
      };
    }, [])
  );

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

  const handleBarcodeScanned = async ({ type, data }) => {
    if (!scanned && !loading) {
      setScanned(true);
      console.log(`Scanned: ${data}`);

      const productData = await fetchProduct(data);

      if (productData) {
        router.push({
          pathname: '/product-detail',
          params: { 
            barcode: data,
            productData: JSON.stringify(productData)
          }
        });
      } else {
        Alert.alert('Error', 'Product not found');
        setTimeout(() => setScanned(false), 2000);
      }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={torchEnabled}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
        }}
      />

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading product...</Text>
        </View>
      )}

      {/* Scanned overlay */}
      {scanned && !loading && (
        <View style={styles.scannedOverlay}>
          <Text style={styles.scannedText}>✓ Barcode Scanned</Text>
        </View>
      )}

      {/* Torch button */}
      <View style={styles.topBar}>
        <IconButton
          icon={torchEnabled ? "flashlight" : "flashlight-off"}
          iconColor="white"
          size={30}
          onPress={() => setTorchEnabled(!torchEnabled)}
          style={styles.torchButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  camera: { flex: 1 },
  message: { textAlign: 'center', color: 'white', marginBottom: 16 },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { color: 'white', marginTop: 10, fontSize: 16 },

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

  topBar: {
    position: 'absolute',
    top: 40,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  torchButton: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
});