import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';

const ProductHeader = ({ productData, isAppwriteProduct }) => {
  const [isTypeExpanded, setIsTypeExpanded] = useState(false);

  // Get product name safely
  const productName = isAppwriteProduct 
    ? (productData.product?.name || productData.name || 'Unknown Product')
    : (productData.name || productData.product_name || 'Unknown Product');

  return (
    <Card style={styles.card}>
      {productData.image_url && (
        <Card.Cover source={{ uri: productData.image_url }} style={styles.image} />
      )}
      <Card.Content>
        <Text variant="headlineMedium" style={styles.productName}>
          {productName}
        </Text>
        {!isAppwriteProduct && productData.type && (
          <TouchableOpacity onPress={() => setIsTypeExpanded(!isTypeExpanded)}>
            <Chip 
              style={styles.chip} 
              textStyle={isTypeExpanded ? styles.chipTextExpanded : styles.chipText}
            >
              {isTypeExpanded ? productData.type : productData.type}
            </Chip>
            {!isTypeExpanded && productData.type.length > 30 && (
              <Text style={styles.tapHint}>Tap to expand</Text>
            )}
          </TouchableOpacity>
        )}
        {isTypeExpanded && (
          <Text style={styles.expandedType}>{productData.type}</Text>
        )}
      </Card.Content>
    </Card>
  );
};

export default ProductHeader;

const styles = StyleSheet.create({
  card: {
    margin: 10,
    backgroundColor: 'white',
  },
  image: {
    height: 200,
  },
  productName: {
    marginTop: 10,
    fontWeight: 'bold',
    color: '#1e7d5dff',
  },
  chip: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: '#c5e8d8ff',
  },
  chipText: {
    color: '#166249ff',
  },
  chipTextExpanded: {
    color: '#1e7d5dff',
  },
  tapHint: {
    fontSize: 11,
    color: '#8a8a8aff',
    paddingLeft: 3,
    marginTop: 4,
    fontStyle: 'italic',
  },
  expandedType: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#f0f9f4ff',
    borderRadius: 8,
    color: '#1e7d5dff',
    lineHeight: 20,
  },
});