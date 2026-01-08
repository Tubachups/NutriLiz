import React, { useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, Alert, Image, Dimensions, Animated } from 'react-native';

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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

const TopographicBackground = () => (
  <Svg
    style={StyleSheet.absoluteFill}
    width={width}
    height={height}
    viewBox={`0 0 ${width} ${height}`}
    preserveAspectRatio="xMidYMid slice"
  >
    {/* Base color */}
    <Path d={`M0,0 L${width},0 L${width},${height} L0,${height} Z`} fill="#e6fdf6ff" />
    
    {/* Topographic contour lines */}
    {[...Array(20)].map((_, i) => (
      <Path
        key={i}
        d={`M${-50},${50 + i * 40} 
            Q${width * 0.25},${30 + i * 40} ${width * 0.5},${60 + i * 40}
            Q${width * 0.75},${90 + i * 40} ${width + 50},${50 + i * 40}`}
        stroke="rgba(171, 231, 198, 0.4)"
        strokeWidth="1.5"
        fill="none"
      />
    ))}
    
    {[...Array(15)].map((_, i) => (
      <Path
        key={`c2-${i}`}
        d={`M${-30},${80 + i * 50} 
            Q${width * 0.3},${100 + i * 50} ${width * 0.6},${70 + i * 50}
            Q${width * 0.85},${40 + i * 50} ${width + 30},${90 + i * 50}`}
        stroke="rgba(203, 243, 187, 0.35)"
        strokeWidth="1"
        fill="none"
      />
    ))}
  </Svg>
);

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

    {/* Dark green border at bottom */}
    <Path
      d={`M0,${90 + insetTop} L${width},${90 + insetTop}`}
      stroke="#3d8a6e"
      strokeWidth="3"
      fill="none"
    />
  </Svg>
);

export default function ProductList() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const selectionBarAnim = useRef(new Animated.Value(0)).current;
  
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

  // Animate selection bar
  useEffect(() => {
    Animated.timing(selectionBarAnim, {
      toValue: hasSelection ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [hasSelection]);

  const selectionBarTranslateY = selectionBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  });

  const selectionBarOpacity = selectionBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

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
        buttonColor="#67caa9"
      >
        Scan a Product
      </Button>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <TopographicBackground />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#67caa9" />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopographicBackground />
      
      {/* Header with Topographic Background */}
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

      {/* Selection Actions Bar  */}
      <Animated.View 
        style={[
          styles.selectionBar,
          {
            transform: [{ translateY: selectionBarTranslateY }],
            opacity: selectionBarOpacity,
          },
          !hasSelection && styles.selectionBarHidden,
        ]}
        pointerEvents={hasSelection ? 'auto' : 'none'}
      >
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
          buttonColor="#f03b08ff"
          icon="delete"
        >
          Delete ({selectedCount})
        </Button>
      </Animated.View>

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
    color: '#297a5aff',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#67caa9ff',
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
    color: '#297a5aff',
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 10,
  },
  selectionBarHidden: {
    position: 'absolute',
    top: -50,
  },
  listContent: {
    padding: 12,
  },
  emptyList: {
    flex: 1,
  },
  productCard: {
    marginBottom: 10,
    backgroundColor: 'rgba(251, 255, 254, 0.95)',
    borderRadius: 12,
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
    borderRadius: 8,
  },
});