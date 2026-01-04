import React, { useCallback } from 'react';
import { View, StyleSheet, FlatList, Alert, Image } from 'react-native';
import {
  Text,
  Card,
  Checkbox,
  IconButton,
  ActivityIndicator,
  Button,
  Chip,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useProductHistory } from '@/hooks/useProductHistory';

export default function ProductList() {
  const router = useRouter();
  
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
    
  } = useProductHistory();

  // Refresh list when screen is focused
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

  const handleDeleteSelected = () => {
    if (selectedCount === 0) {
      Alert.alert('No Selection', 'Please select products to delete.');
      return;
    }

    Alert.alert(
      'Delete Selected',
      `Are you sure you want to delete ${selectedCount} selected product(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteSelected();
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    if (products.length === 0) {
      Alert.alert('Empty List', 'There are no products to clear.');
      return;
    }

    Alert.alert(
      'Clear All',
      'Are you sure you want to remove all products from history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            clearAll();
          },
        },
      ]
    );
  };

  const handleProductPress = (product) => {
    router.push({
      pathname: '/product-detail',
      params: {
        barcode: product.barcode,
        productData: JSON.stringify(product.productData),
      },
    });
  };

  const handleDeleteSingle = (productId, productName) => {
    Alert.alert(
      'Delete Product',
      `Remove "${productName}" from history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteProduct(productId),
        },
      ]
    );
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
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No Products Scanned</Text>
      <Text style={styles.emptySubtitle}>
        Your scanned products will appear here
      </Text>
      <Button
        mode="contained"
        onPress={() => router.push('/scan')}
        style={styles.scanButton}
        buttonColor="#93BFC7"
      >
        Scan a Product
      </Button>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#93BFC7" />
        <Text style={styles.loadingText}>Loading history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
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
              <IconButton
                icon="delete-sweep"
                size={24}
                onPress={handleClearAll}
                iconColor="#E63E11"
              />
            </>
          )}
        </View>
      </View>

      {/* Selection Actions Bar */}
      {hasSelection && (
        <View style={styles.selectionBar}>
          <Button
            mode="text"
            onPress={deselectAll}
            textColor="#757575"
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleDeleteSelected}
            buttonColor="#E63E11"
            icon="delete"
          >
            Delete ({selectedCount})
          </Button>
        </View>
      )}

      {/* Product List */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={products.length === 0 ? styles.emptyList : styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECF4E8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ECF4E8',
  },
  loadingText: {
    marginTop: 12,
    color: '#757575',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#CBF3BB',
    borderBottomWidth: 1,
    borderBottomColor: '#ABE7B2',
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
    color: '#757575',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  listContent: {
    padding: 12,
  },
  emptyList: {
    flex: 1,
  },
  productCard: {
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
  },
  selectedCard: {
    backgroundColor: '#E8F5E9',
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
    backgroundColor: '#e0e0e0',
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
    borderRadius: 8,
  },
});