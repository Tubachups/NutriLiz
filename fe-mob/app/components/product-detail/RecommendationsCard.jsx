import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';

const RecommendationsCard = ({ recommendations, recommendationsCount }) => {
  // Ensure recommendations is an array before rendering
  if (!recommendations || !Array.isArray(recommendations) || recommendations.length === 0) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <Card.Title title={`🔍 Similar Products (${recommendationsCount || recommendations.length})`} titleStyle={styles.cardTitle} />
      <Card.Content>
        {recommendations.slice(0, 9).map((rec, index) => (
          <Card key={rec.barcode || index} style={styles.recCard}>
            {rec.image_url && (
              <Card.Cover source={{ uri: rec.image_url }} style={styles.recImage} resizeMode="contain" />
            )}
           <Card.Content>
              <Text variant="titleSmall" style={styles.recName}>{rec.name || 'Unknown Product'}</Text>
              <Text variant="bodySmall" style={styles.recBrand}>{rec.brand || ''}</Text>
              <Chip style={styles.matchChip} textStyle={styles.matchChipText}>
                Match: {rec.similarity_score ? (rec.similarity_score * 100).toFixed(1) : 0}% 
              </Chip>
            </Card.Content>
          </Card>
        ))}
      </Card.Content>
    </Card>
  );
};

export default RecommendationsCard;

const styles = StyleSheet.create({
  card: {
    margin: 10,
    backgroundColor: 'white',
  },
  cardTitle: {
    color: '#1e7d5dff',
    fontWeight: 'bold',
  },
  recCard: {
    marginBottom: 10,
    backgroundColor: '#499c81ff',
  },
  recImage: {
    height: 150,
    backgroundColor: 'white',
  },
  recName: {
    color: '#fff',
    fontWeight: 'bold',
    paddingTop: 10,
  },
  recBrand: {
    color: '#e0f5ebff',
    paddingBottom: 5,
  },
  matchChip: {
    marginTop: 5,

    alignSelf: 'flex-start',
    backgroundColor: '#367452ff',
  },
  matchChipText: {
    color: '#fff',
    fontWeight: 'bold',
  
  },
});
