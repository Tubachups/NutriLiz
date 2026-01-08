import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';

const RecommendationsCard = ({ recommendations, recommendationsCount }) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <Card.Title title={`🔍 Similar Products (${recommendationsCount})`} titleStyle={styles.cardTitle} />
      <Card.Content>
        {recommendations.slice(0, 9).map((rec) => (
          <Card key={rec.barcode} style={styles.recCard}>
            {rec.image_url && (
              <Card.Cover source={{ uri: rec.image_url }} style={styles.recImage} />
            )}
           <Card.Content>
              <Text variant="titleSmall" style={styles.recName}>{rec.name}</Text>
              <Text variant="bodySmall" style={styles.recBrand}>{rec.brand}</Text>
              <Chip style={styles.matchChip} textStyle={styles.matchChipText}>
                Match: {(rec.similarity_score * 100).toFixed(1)}% 
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
