import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import NutriScoreBadge from './NutriScoreBadge';
import EcoScoreBadge from './EcoScoreBadge';

const ScoresCard = ({ productData }) => {
  const getNovaLabel = (novaGroup) => {
    const labels = {
      1: 'Unprocessed or minimally processed',
      2: 'Processed culinary ingredients',
      3: 'Processed foods',
      4: 'Ultra-processed foods'
    };
    return labels[novaGroup] || 'Unknown';
  };

  return (
    <Card style={styles.card}>
      <Card.Title title="📊 Scores" />
      <Card.Content>
        {productData.nutri_grade !== 'N/A' && (
          <View style={styles.nutriScoreContainer}>
            <NutriScoreBadge grade={productData.nutri_grade} score={productData.nutri_score}/>
          </View>
        )}
        {productData.nova_group !== 'N/A' && (
          <View style={styles.novaContainer}>
            <Text style={styles.novaTitle}>NOVA Group: {productData.nova_group}</Text>
            <Text style={styles.novaDescription}>{getNovaLabel(productData.nova_group)}</Text>
          </View>
        )}
        {productData.ecoscore_grade && productData.ecoscore_grade !== 'N/A' && (
          <View style={styles.ecoScoreSection}>
            <EcoScoreBadge 
              grade={productData.ecoscore_grade} 
              score={productData.ecoscore_score}
            />
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

export default ScoresCard;

const styles = StyleSheet.create({
  card: {
    margin: 10,
    backgroundColor: 'white',
  },
  nutriScoreContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  novaContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  novaTitle: {
    fontWeight: '600',
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  novaDescription: {
    fontSize: 13,
    color: '#666',
  },
  ecoScoreSection: {
    marginTop: 16,
  },
});
