import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';

const RecommendationsCard = ({ recommendations, recommendationsCount }) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <Card.Title title={`🔍 Similar Products (${recommendationsCount})`} />
      <Card.Content>
        {recommendations.slice(0, 9).map((rec) => (
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
  );
};

export default RecommendationsCard;

const styles = StyleSheet.create({
  card: {
    margin: 10,
    backgroundColor: 'white',
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
