import { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { useProductAPI } from '../../hooks/useProductAPI';
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

  useEffect(() => {
    if (productDataString) {
      const data = JSON.parse(productDataString);
      setProductData(data);
      
      // Fetch AI assessment
      fetchAssessment(barcode).then(setAssessment);
    }
  }, [barcode, productDataString]);

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
      <ProductHeader productData={productData} isAppwriteProduct={isAppwriteProduct} />
      
      <NutritionInfo productData={productData} isAppwriteProduct={isAppwriteProduct} />
      
      {!isAppwriteProduct && <ScoresCard productData={productData} />}
      
      {!isAppwriteProduct && (
        <IngredientsCard ingredientsText={productData.ingredients_text} />
      )}
      
      {!isAppwriteProduct && (
        <AllergensCard 
          allergens={productData.allergens} 
          traces={productData.traces} 
        />
      )}
      
      <AIAssessment loading={loading} assessment={assessment} />
      
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
    backgroundColor: '#ECF4E8',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});