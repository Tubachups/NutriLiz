import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Button, Text, ActivityIndicator, IconButton } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useProductAPI } from '@/hooks/useProductAPI';
import { useProductHistory } from '@/hooks/useProductHistory';
import { useRouter, Link } from 'expo-router';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';

export default function Index() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const { fetchProduct, loading } = useProductAPI();
  const { addProduct } = useProductHistory();
  const router = useRouter();
  const isFocused = useIsFocused();

  // Reset scan state every time screen is focused
  useFocusEffect(
    useCallback(() => {
      setScanned(false);
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
  const isCameraActive = isFocused && cameraReady;

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
      setTorchEnabled(false);
      console.log(`Scanned: ${data}`);

      const productData = await fetchProduct(data);

      if (productData) {
        // Save to history
        await addProduct(productData, data);
        
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
      {isCameraActive ? (
        <CameraView
          style={styles.camera}
          facing="back"
          active={true}
          enableTorch={torchEnabled}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
          }}
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

      {/* Instruction Banner */}
      <View style={styles.instructionBanner}>
        <Text style={styles.instructionText}>
         📸 Aim your camera at a food barcode and wait for analysis
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  camera: { flex: 1 },
  cameraPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  message: { textAlign: 'center', color: 'white', marginBottom: 16 },

 // Camera Frame Borders
  frameBorderContainer: {
    position: 'absolute',
    top: 100,
    left: 30,
    right: 30,
    bottom: 200,
    borderRadius: 5,        // Adjust as needed for roundness
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

  scannedOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scannedText: {
    backgroundColor: '#4caf82',
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
    instructionBanner: {
    position: 'absolute',
    bottom: 70,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  instructionText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
});