import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Modal } from 'react-native';
import { Button, Text, ActivityIndicator, IconButton } from 'react-native-paper';
import { CameraView } from 'expo-camera';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import FoodDisambiguationModal from '@/app/components/FoodDisambiguationModal';
import { useScan } from '@/hooks/useScan';

export default function Index() {
  const {
    permission,
    requestPermission,
    cameraRef,
    loading,
    scanned,
    torchEnabled,
    scanMode,
    capturedImage,
    finalizing,
    showDisclaimerModal,
    errorModal,
    barcodeFinalizing,
    disambiguationData,
    showDisambiguationModal,
    isCameraActive,
    hideError,
    handleBarcodeScanned,
    takePicture,
    pickImage,
    handleDisambiguationConfirm,
    handleDisambiguationDismiss,
    toggleScanMode,
    setTorchEnabled,
    onDisclaimerAcknowledge,
  } = useScan();

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

  // ===== CAPTURED IMAGE PREVIEW (Food mode) =====
  if (capturedImage) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: capturedImage.uri }} style={styles.preview} />
        {loading && !finalizing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Analyzing food...</Text>
          </View>
        )}
        {finalizing && !showDisclaimerModal && (
          <View style={styles.loadingOverlay}>
            <Ionicons name="checkmark-circle" size={50} color="#4caf7c" />
            <Text style={styles.loadingText}>Finalizing...</Text>
            <Text style={styles.finalizingSubtext}>Preparing your results</Text>
          </View>
        )}

        {/* Disambiguation modal — shown for unlabeled liquids and sauce-heavy dishes */}
        <FoodDisambiguationModal
          visible={showDisambiguationModal}
          alternatives={disambiguationData?.foodData?.alternatives ?? []}
          foodContext={{
            food_name: disambiguationData?.foodData?.food_name ?? '',
            category: disambiguationData?.foodData?.category ?? '',
            description: disambiguationData?.foodData?.description ?? '',
          }}
          onConfirm={handleDisambiguationConfirm}
          onDismiss={handleDisambiguationDismiss}
        />

        <Modal
          visible={showDisclaimerModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {}}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Ionicons name="notifications-outline" size={40} color="#e67e22" style={styles.modalIcon} />
              <Text style={styles.modalTitle}>Reminder</Text>
              <Text style={styles.modalText}>
                Results may not be fully accurate as it mainly relies on labeled products and colors, which may resemble other items than expected. Always verify with proper information.
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={onDisclaimerAcknowledge}
              >
                <Text style={styles.modalButtonText}>OK, I Understand</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Error Modal */}
        <Modal
          visible={errorModal.visible}
          transparent={true}
          animationType="fade"
          onRequestClose={hideError}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Ionicons name="alert-circle-outline" size={50} color="#289993" style={styles.modalIcon} />
              <Text style={styles.modalTitle}>{errorModal.title}</Text>
              <Text style={styles.modalText}>{errorModal.message}</Text>
              <TouchableOpacity style={styles.errorModalButton} onPress={hideError}>
                <Text style={styles.modalButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
          active={true}
          enableTorch={torchEnabled}
          onBarcodeScanned={scanMode === 'barcode' && !scanned ? handleBarcodeScanned : undefined}
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
      {loading && !barcodeFinalizing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>
            {scanMode === 'barcode' ? 'Loading product...' : 'Analyzing food...'}
          </Text>
        </View>
      )}

      {/* Scanned overlay (barcode mode only) - positioned above finalizing */}
      {scanMode === 'barcode' && scanned && !loading && !barcodeFinalizing && (
        <View style={styles.scannedOverlay}>
          <Text style={styles.scannedText}>✓ Barcode Scanned</Text>
        </View>
      )}

      {/* Barcode Finalizing overlay */}
      {barcodeFinalizing && (
        <View style={styles.loadingOverlay}>
          <Ionicons name="checkmark-circle" size={50} color="#4caf7c" />
          <Text style={styles.loadingText}>Finalizing...</Text>
          <Text style={styles.finalizingSubtext}>Preparing your results</Text>
        </View>
      )}

      {/* Top bar - Toggle on left, Flashlight & Gallery on right */}
      <View style={styles.topBarLeft}>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={toggleScanMode}
        >
          {scanMode === 'barcode' ? (
            <Ionicons name="barcode" size={24} color="white" />
          ) : (
            <MaterialCommunityIcons name="food" size={24} color="white" />
          )}
          <View style={styles.toggleTextContainer}>
            <Text style={styles.toggleText}>
              {scanMode === 'barcode' ? 'Barcode' : 'Food'}
            </Text>
            <Text style={styles.toggleHint}>
              Tap to switch
            </Text>
          </View>
          <Ionicons name="swap-horizontal" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      <View style={styles.topBarRight}>
        {scanMode === 'food' && (
          <IconButton
            icon="image"
            iconColor="white"
            size={30}
            onPress={pickImage}
            style={styles.iconButton}
          />
        )}
        <IconButton
          icon={torchEnabled ? "flashlight" : "flashlight-off"}
          iconColor={torchEnabled ? "#FFD700" : "white"}
          size={30}
          onPress={() => setTorchEnabled(!torchEnabled)}
          style={styles.iconButton}
        />
      </View>

      {/* Capture button (food mode only) */}
      {scanMode === 'food' && (
        <View style={styles.captureButtonContainer}>
          <IconButton
            icon="camera"
            iconColor="white"
            size={50}
            onPress={takePicture}
            style={styles.captureButton}
          />
        </View>
      )}

      {/* Instruction Banner */}
      <View style={styles.instructionBanner}>
        <Text style={styles.instructionText}>
          {scanMode === 'barcode' 
            ? '📸 Aim your camera at a food barcode and wait for analysis'
            : '📸 Take a photo of your food to identify it'}
        </Text>
      </View>

      {/* Error Modal */}
      <Modal
        visible={errorModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={hideError}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="alert-circle-outline" size={50} color="#289993" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>{errorModal.title}</Text>
            <Text style={styles.modalText}>{errorModal.message}</Text>
            <TouchableOpacity style={styles.errorModalButton} onPress={hideError}>
              <Text style={styles.modalButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    borderRadius: 5,
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
  finalizingSubtext: { 
    color: 'rgba(255, 255, 255, 0.7)', 
    marginTop: 5, 
    fontSize: 13 
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  modalIcon: {
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#4caf7c',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  errorModalButton: {
    backgroundColor: '#289993',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  scannedOverlay: {
    position: 'absolute',
    bottom: 200,
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

  // Top bar - left side (toggle)
  topBarLeft: {
    position: 'absolute',
    top: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleButton: {
    backgroundColor: '#4caf7cff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 25,
    gap: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  toggleTextContainer: {
    flexDirection: 'column',
  },
  toggleText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  toggleHint: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '400',
  },

  // Top bar - right side (flashlight, gallery)
  topBarRight: {
    position: 'absolute',
    top: 40,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },

  // Capture button (food mode)
  captureButtonContainer: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
  },
  captureButton: {
    backgroundColor: '#4caf7cff',
    width: 80,
    height: 80,
    borderRadius: 40,
  },

  instructionBanner: {
    position: 'absolute',
    bottom: 40,
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

  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  button: { 
    marginTop: 10,
    borderColor: 'white',
  },
});