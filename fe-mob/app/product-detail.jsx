import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, Image } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, Divider } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { useProductAPI } from '../hooks/useProductAPI';

export default function ProductDetail() {
  const { barcode, productData: productDataString } = useLocalSearchParams();
  const [productData, setProductData] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const { fetchAssessment, loading } = useProductAPI();

  useEffect(() => {
    if (productDataString) {
      const data = JSON.parse(productDataString);
      setProductData(data);
      
      // Fetch AI assessment
      fetchAssessment(barcode).then(setAssessment);
    }
  }, [productDataString, barcode]);

  if (!productData) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const isAppwriteProduct = productData.source === 'appwrite';

  return (
    <ScrollView style={styles.container}>
      {/* Product Header */}
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

      {/* Nutrition Info */}
      <Card style={styles.card}>
        <Card.Title title="🥗 Nutrition Information" />
        <Card.Content>
          {isAppwriteProduct ? (
            <View>
              {Object.entries(productData.nutrition).map(([key, value]) => (
                <View key={key} style={styles.nutritionRow}>
                  <Text style={styles.nutritionLabel}>
                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                  </Text>
                  <Text style={styles.nutritionValue}>{value}</Text>
                </View>
              ))}
            </View>
          ) : (
            <View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Energy:</Text>
                <Text style={styles.nutritionValue}>
                  {productData.energy_kcal_100g} kcal / 100g
                </Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Carbohydrates:</Text>
                <Text style={styles.nutritionValue}>
                  {productData.carbohydrates_100g}g / 100g
                </Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Sugars:</Text>
                <Text style={styles.nutritionValue}>
                  {productData.sugars_100g}g / 100g
                </Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Fat:</Text>
                <Text style={styles.nutritionValue}>
                  {productData.fat_100g}g / 100g
                </Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Proteins:</Text>
                <Text style={styles.nutritionValue}>
                  {productData.proteins_100g}g / 100g
                </Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Fiber:</Text>
                <Text style={styles.nutritionValue}>
                  {productData.fiber_100g}g / 100g
                </Text>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Scores (OpenFoodFacts only) */}
      {!isAppwriteProduct && (
        <Card style={styles.card}>
          <Card.Title title="📊 Scores" />
          <Card.Content>
            {productData.nutri_grade !== 'N/A' && (
              <View style={styles.scoreRow}>
                <Text>Nutri-Score:</Text>
                <Chip style={styles.scoreChip}>{productData.nutri_grade?.toUpperCase()}</Chip>
              </View>
            )}
            {productData.nova_group !== 'N/A' && (
              <View style={styles.scoreRow}>
                <Text>NOVA Group:</Text>
                <Chip style={styles.scoreChip}>{productData.nova_group}</Chip>
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* AI Assessment */}
      {loading && (
        <Card style={styles.card}>
          <Card.Content>
            <ActivityIndicator size="small" />
            <Text style={styles.centerText}>Generating health assessment...</Text>
          </Card.Content>
        </Card>
      )}

      {assessment && assessment.ai_analysis && (
        <Card style={styles.card}>
          <Card.Title title="🤖 Health Assessment" />
          <Card.Content>
            <Text style={styles.analysisText}>
              {assessment.ai_analysis.replace(/\*\*/g, '')}
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Recommendations (OpenFoodFacts only) */}
      {!isAppwriteProduct && productData.recommendations && productData.recommendations.length > 0 && (
        <Card style={styles.card}>
          <Card.Title title={`🔍 Similar Products (${productData.recommendations_count})`} />
          <Card.Content>
            {productData.recommendations.slice(0, 3).map((rec) => (
              <Card key={rec.barcode} style={styles.recCard}>
                {rec.image_url && (
                  <Card.Cover source={{ uri: rec.image_url }} style={styles.recImage} />
                )}
                <Card.Content>
                  <Text variant="titleSmall">{rec.name}</Text>
                  <Text variant="bodySmall">{rec.brand}</Text>
                  <Chip style={styles.matchChip}>
                    Match: {(rec.similarity_score * 100).toFixed(1)}%
                  </Chip>
                </Card.Content>
              </Card>
            ))}
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECF4E8',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  nutritionLabel: {
    fontWeight: '600',
  },
  nutritionValue: {
    color: '#666',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  scoreChip: {
    backgroundColor: '#93BFC7',
  },
  analysisText: {
    lineHeight: 22,
    color: '#333',
  },
  centerText: {
    textAlign: 'center',
    marginTop: 10,
  },
  recCard: {
    marginBottom: 10,
  },
  recImage: {
    height: 150,
  },
  matchChip: {
    marginTop: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#CBF3BB',
  },
});