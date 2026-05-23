import React, { useCallback, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Text,
  IconButton,
  ActivityIndicator,
  Button,
  Portal,
  Modal,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useProductHistory } from '@/hooks/useProductHistory';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TopographicHeader from '../components/TopographicHead';
import RenderProduct from '../components/list/RenderProduct';
import RenderEmptyList from '../components/list/RenderEmptyList';
import ActionModal from '../components/list/ActionModal';

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

  const renderProduct = ({ item }) => (
    <RenderProduct
      item={item}
      selected={isSelected(item.id)}
      onPress={() => handleProductPress(item)}
      onToggleSelection={() => toggleSelection(item.id)}
      onDelete={() => handleDeleteSingle(item.id, item.name)}
    />
  );

  const renderEmptyList = () => (
    <RenderEmptyList onScanPress={() => router.push('/scan')} />
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
        <ActionModal
          visible={showDeleteSingleModal}
          onDismiss={() => setShowDeleteSingleModal(false)}
          iconName="trash-outline"
          iconColor="#E63E11"
          title="Delete Product"
          message={`Remove ${productToDelete?.name} from history?`}
          primaryActionText="Delete"
          primaryActionColor="#E63E11"
          onPrimaryAction={confirmDeleteSingle}
          styles={styles}
        />

        <ActionModal
          visible={showDeleteSelectedModal}
          onDismiss={() => setShowDeleteSelectedModal(false)}
          iconName="trash-outline"
          iconColor="#E63E11"
          title="Delete Selected"
          message={`Are you sure you want to delete ${selectedCount} selected product(s)?`}
          primaryActionText="Delete"
          primaryActionColor="#E63E11"
          onPrimaryAction={confirmDeleteSelected}
          styles={styles}
        />

        <ActionModal
          visible={showClearAllModal}
          onDismiss={() => setShowClearAllModal(false)}
          iconName="warning-outline"
          iconColor="#E63E11"
          title="Clear All"
          message="Are you sure you want to remove all products from history?"
          primaryActionText="Clear All"
          primaryActionColor="#E63E11"
          onPrimaryAction={confirmClearAll}
          styles={styles}
        />

        <ActionModal
          visible={showNoSelectionModal}
          onDismiss={() => setShowNoSelectionModal(false)}
          iconName="information-circle-outline"
          iconColor="#67caa9"
          title="No Selection"
          message="Please select products to delete."
          primaryActionText="OK"
          primaryActionColor="#67caa9"
          onPrimaryAction={() => setShowNoSelectionModal(false)}
          showCancel={false}
          styles={styles}
        />

        <ActionModal
          visible={showEmptyListModal}
          onDismiss={() => setShowEmptyListModal(false)}
          iconName="information-circle-outline"
          iconColor="#67caa9"
          title="Empty List"
          message="There are no products to clear."
          primaryActionText="OK"
          primaryActionColor="#67caa9"
          onPrimaryAction={() => setShowEmptyListModal(false)}
          showCancel={false}
          styles={styles}
        />
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