import React, { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, Image, Dimensions, RefreshControl, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Text,
  Card,
  Checkbox,
  IconButton,
  ActivityIndicator,
  Button,
  Chip,
  Portal,
  Modal,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useProductHistory } from '@/hooks/useProductHistory';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import TopographicHeader from '../components/TopographicHead';

const { width, height } = Dimensions.get('window');

export default function ProductList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [showDeleteSingleModal, setShowDeleteSingleModal] = useState(false);
  const [showDeleteSelectedModal, setShowDeleteSelectedModal] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [showNoSelectionModal, setShowNoSelectionModal] = useState(false);
  const [showEmptyListModal, setShowEmptyListModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const {
    products,
    loading,
    selectedCount,
    hasSelection,
    allSelected,
    deleteProduct,
    deleteSelected,
    clearAll,
    toggleSelection,
    selectAll,
    deselectAll,
    isSelected,
    refreshHistory
  } = useProductHistory();

  useFocusEffect(
    useCallback(() => {
    }, [])
  );

  const handleSelectAll = () => {
    if (allSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshHistory();
    } finally {
      setRefreshing(false);
    }
  }, [refreshHistory]);

  const handleDeleteSelected = () => {
    if (selectedCount === 0) {
      setShowNoSelectionModal(true);
      return;
    }
    setShowDeleteSelectedModal(true);
  };
  const confirmDeleteSelected = () => {
    deleteSelected();
    setShowDeleteSelectedModal(false);
  };


  const handleClearAll = () => {
    if (products.length === 0) {
      setShowEmptyListModal(true);
      return;
    }
    setShowClearAllModal(true);
  };

  const confirmClearAll = () => {
    clearAll();
    setShowClearAllModal(false);
  };


  const handleProductPress = (product) => {
    // Check if it's a food photo scan (type is 'food' or barcode starts with 'food_')
    const isFoodScan = product.type === 'food' || product.barcode?.startsWith('food_');

    if (isFoodScan) {
      // Navigate to food detail page for photo scans
      router.push({
        pathname: '/food-detail',
        params: {
          foodData: JSON.stringify(product.productData),
        },
      });
    } else {
      // Navigate to product detail page for barcode scans
      router.push({
        pathname: '/product-detail',
        params: {
          barcode: product.barcode,
          productData: JSON.stringify(product.productData),
        },
      });
    }
  };

  const handleDeleteSingle = (productId, productName) => {
    setProductToDelete({ id: productId, name: productName });
    setShowDeleteSingleModal(true);
  };

  const confirmDeleteSingle = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
    }
    setShowDeleteSingleModal(false);
    setProductToDelete(null);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getNutriscoreColor = (grade) => {
    const colors = {
      a: '#038141',
      b: '#85BB2F',
      c: '#FECB02',
      d: '#EE8100',
      e: '#E63E11',
    };
    return colors[grade?.toLowerCase()] || '#757575';
  };

  const renderProduct = ({ item }) => (
    <Card
      style={[
        styles.productCard,
        isSelected(item.id) && styles.selectedCard,
      ]}
      onPress={() => handleProductPress(item)}
      onLongPress={() => toggleSelection(item.id)}
    >
      <View style={styles.cardContent}>
        <Checkbox
          status={isSelected(item.id) ? 'checked' : 'unchecked'}
          onPress={() => toggleSelection(item.id)}
          color="#93BFC7"
        />

        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.productImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.brand && (
            <Text style={styles.brandText} numberOfLines={1}>
              {item.brand}
            </Text>
          )}
          <Text style={styles.dateText}>{formatDate(item.scannedAt)}</Text>
          <Text style={styles.barcodeText}>#{item.barcode}</Text>
        </View>

        <View style={styles.rightSection}>
          {item.nutriscore && (
            <Chip
              style={[
                styles.nutriscoreChip,
                { backgroundColor: getNutriscoreColor(item.nutriscore) },
              ]}
              textStyle={styles.nutriscoreText}
            >
              {item.nutriscore.toUpperCase()}
            </Chip>
          )}
          <IconButton
            icon="delete-outline"
            size={20}
            iconColor="#E63E11"
            onPress={() => handleDeleteSingle(item.id, item.name)}
          />
        </View>
      </View>
    </Card>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="scan-sharp" size={64} color="#5ac09eff" style={styles.emptyIcon} />
      <Text style={styles.emptyTitle}>No Products Scanned</Text>
      <Text style={styles.emptySubtitle}>
        Your scanned products will appear here.
      </Text>
      <Button
        mode="contained"
        onPress={() => router.push('/scan')}
        style={styles.scanButton}
        buttonColor="#5ec1a0ff"
        textColor='#fff'
      >
        Scan a Product
      </Button>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>

        <View style={styles.headerWrapper}>
          <TopographicHeader insetTop={insets.top} />
          <View style={[styles.headerContent, { top: insets.top + 15 }]}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Product History</Text>
              <Text style={styles.headerSubtitle}>Loading...</Text>
            </View>
          </View>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#67caa9" />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <Portal>
        {/* Delete Single Product Modal */}
        <Modal
          visible={showDeleteSingleModal}
          onDismiss={() => setShowDeleteSingleModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Ionicons name="trash-outline" size={48} color="#E63E11" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Delete Product</Text>
            <Text style={styles.modalMessage}>
              Remove {productToDelete?.name} from history?
            </Text>
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setShowDeleteSingleModal(false)}
                style={styles.cancelButton}
                textColor="#666"
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={confirmDeleteSingle}
                style={styles.deleteButton}
                buttonColor="#E63E11"
                textColor="#fff"
              >
                Delete
              </Button>
            </View>
          </View>
        </Modal>

        {/* Delete Selected Modal */}
        <Modal
          visible={showDeleteSelectedModal}
          onDismiss={() => setShowDeleteSelectedModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Ionicons name="trash-outline" size={48} color="#E63E11" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Delete Selected</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete {selectedCount} selected product(s)?
            </Text>
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setShowDeleteSelectedModal(false)}
                style={styles.cancelButton}
                textColor="#666"
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={confirmDeleteSelected}
                style={styles.deleteButton}
                buttonColor="#E63E11"
                textColor="#fff"
              >
                Delete
              </Button>
            </View>
          </View>
        </Modal>

        {/* Clear All Modal */}
        <Modal
          visible={showClearAllModal}
          onDismiss={() => setShowClearAllModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Ionicons name="warning-outline" size={48} color="#E63E11" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Clear All</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to remove all products from history?
            </Text>
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setShowClearAllModal(false)}
                style={styles.cancelButton}
                textColor="#666"
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={confirmClearAll}
                style={styles.deleteButton}
                buttonColor="#E63E11"
                textColor="#fff"
              >
                Clear All
              </Button>
            </View>
          </View>
        </Modal>

        {/* No Selection Modal */}
        <Modal
          visible={showNoSelectionModal}
          onDismiss={() => setShowNoSelectionModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Ionicons name="information-circle-outline" size={48} color="#67caa9" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>No Selection</Text>
            <Text style={styles.modalMessage}>
              Please select products to delete.
            </Text>
            <Button
              mode="contained"
              onPress={() => setShowNoSelectionModal(false)}
              style={styles.okButton}
              buttonColor="#67caa9"
              textColor="#fff"
            >
              OK
            </Button>
          </View>
        </Modal>

        {/* Empty List Modal */}
        <Modal
          visible={showEmptyListModal}
          onDismiss={() => setShowEmptyListModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Ionicons name="information-circle-outline" size={48} color="#67caa9" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Empty List</Text>
            <Text style={styles.modalMessage}>
              There are no products to clear.
            </Text>
            <Button
              mode="contained"
              onPress={() => setShowEmptyListModal(false)}
              style={styles.okButton}
              buttonColor="#67caa9"
              textColor="#fff"
            >
              OK
            </Button>
          </View>
        </Modal>
      </Portal>


      <View style={styles.headerWrapper}>
        <TopographicHeader insetTop={insets.top} />
        <View style={[styles.headerContent, { top: insets.top + 15 }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Product History</Text>
            <Text style={styles.headerSubtitle}>
              {products.length} product{products.length !== 1 ? 's' : ''}
              {hasSelection && ` • ${selectedCount} selected`}
            </Text>
          </View>

          <View style={styles.headerActions}>
            {products.length > 0 && (
              <>
                <IconButton
                  icon={allSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={24}
                  onPress={handleSelectAll}
                  iconColor="#1F2937"
                />

                {hasSelection && (
                  <IconButton
                    icon="delete"
                    size={24}
                    onPress={handleDeleteSelected}
                    iconColor="#E63E11"
                  />
                )}
                <IconButton
                  icon="delete-sweep"
                  size={24}
                  onPress={handleClearAll}
                  iconColor="#ce2d00ff"
                />
              </>
            )}
          </View>
        </View>
      </View>

      {/* Product List - wrapped in a flex container */}
      <View style={styles.listWrapper}>
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          ListEmptyComponent={renderEmptyList}
          contentContainerStyle={products.length === 0 ? styles.emptyList : styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#67caa9']}
              tintColor="#67caa9"
              progressBackgroundColor="#ffffff"
            />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECF4E8',
  },
  headerWrapper: {
    backgroundColor: '#67caa9ff',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#1e694bff',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#757575',
    fontSize: 14,
  },
  listContent: {
    padding: 12,
  },
  emptyList: {
    flex: 1,
  },
  productCard: {
    marginBottom: 10,
    backgroundColor: 'rgba(253, 255, 255, 0.95)',
    borderRadius: 5,
    elevation: 2,
  },
  selectedCard: {
    backgroundColor: 'rgba(232, 245, 240, 0.95)',
    borderWidth: 2,
    borderColor: '#93BFC7',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#e0e0e0ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 10,
    color: '#757575',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  brandText: {
    fontSize: 13,
    color: '#757575',
    marginTop: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#9e9e9e',
    marginTop: 4,
  },
  barcodeText: {
    fontSize: 11,
    color: '#bdbdbd',
    marginTop: 2,
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutriscoreChip: {
    marginBottom: 4,
  },
  nutriscoreText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 24,
  },
  scanButton: {
    borderRadius: 10,
  },
  listWrapper: {
    flex: 1,
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
  deleteButton: {
    flex: 1,
    borderRadius: 25,
  },
  okButton: {
    minWidth: 120,
    borderRadius: 25,
  },
});