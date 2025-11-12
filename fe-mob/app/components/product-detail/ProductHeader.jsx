import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';

const ProductHeader = ({ productData, isAppwriteProduct }) => {
  return (
    <Card style={styles.card}>
      {productData.image_url && (
        <Card.Cover source={{ uri: productData.image_url }} style={styles.image} />
      )}
      <Card.Content>
        <Text variant="headlineMedium" style={styles.productName}>
          {isAppwriteProduct ? productData.product?.name : productData.name}
        </Text>
        {!isAppwriteProduct && productData.type && (
          <Chip style={styles.chip}>{productData.type}</Chip>
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
  },
  chip: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
});
