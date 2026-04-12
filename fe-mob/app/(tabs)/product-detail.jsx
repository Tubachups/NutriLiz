import { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { ActivityIndicator, Card, Text } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { useProductAPI } from '@/hooks/useProductAPI';
import { useAuth } from '@/hooks/auth-context';
import ProductHeader from '../components/product-detail/ProductHeader';
import NutritionInfo from '../components/product-detail/NutritionInfo';
import ScoresCard from '../components/product-detail/ScoresCard';
import IngredientsCard from '../components/product-detail/IngredientsCard';
import AllergensCard from '../components/product-detail/AllergensCard';
import AIAssessment from '../components/product-detail/AIAssessment';
import RecommendationsCard from '../components/product-detail/RecommendationsCard';

export default function ProductDetail() {
  const { barcode, productData: productDataString } = useLocalSearchParams();
  const [productData, setProductData] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const { fetchAssessment, loading } = useProductAPI();
  const { userProfile } = useAuth();

  useEffect(() => {
    if (productDataString) {
      const data = JSON.parse(productDataString);
      setProductData(data);
      
      // Fetch AI assessment
      fetchAssessment(barcode, userProfile).then(setAssessment);
    }
  }, [barcode, productDataString, userProfile]);

  if (!productData) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1e7d5dff" />
      </View>
    );
  }

  const isAppwriteProduct = productData.source === 'appwrite';

  return (
    <ScrollView style={styles.container}>
      <ProductHeader productData={productData} isAppwriteProduct={isAppwriteProduct} />
      
      <NutritionInfo productData={productData} isAppwriteProduct={isAppwriteProduct} />
      
      {!isAppwriteProduct && <ScoresCard productData={productData} />}
      
      <AIAssessment loading={loading} assessment={assessment} />

      <Card style={[styles.card, styles.disclaimerCard]}>
        <Card.Content>
          <Text style={styles.disclaimerTitle}>Medical Reminder</Text>
          <Text style={styles.disclaimerText}>
            This app provides nutrition guidance only and is not a substitute for medical advice, diagnosis, or treatment. Consult a licensed healthcare professional for personal medical concerns.
          </Text>
        </Card.Content>
      </Card>
      
      {!isAppwriteProduct && (
        <IngredientsCard ingredientsText={productData.ingredients_text} />
      )}
      
      {!isAppwriteProduct && productData.allergens && (
        <AllergensCard 
          allergens={productData.allergens} 
          traces={productData.traces} 
        />
      )}
      
      {!isAppwriteProduct && (
        <RecommendationsCard 
          recommendations={productData.recommendations}
          recommendationsCount={productData.recommendations_count}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#c6e9daff',
  },
  card: {
    marginHorizontal: 10,
    marginBottom: 10,
    backgroundColor: 'white',
  },
  disclaimerCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#e67e22',
  },
  disclaimerTitle: {
    fontWeight: '700',
    color: '#8a4b08',
    marginBottom: 6,
  },
  disclaimerText: {
    color: '#3f2f1f',
    lineHeight: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});