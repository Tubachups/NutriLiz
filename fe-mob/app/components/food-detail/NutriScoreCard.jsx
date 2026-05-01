import React from 'react';
import { Card, Text } from 'react-native-paper';
import NutriScoreBadge from '../product-detail/NutriScoreBadge';

const NutriScoreCard = ({ nutriScore, styles }) => (
  <Card style={styles.card}>
    <Card.Content>
      <Text variant="titleMedium" style={styles.sectionTitle}>Nutri-Score Estimate</Text>
      <NutriScoreBadge grade={nutriScore} />
    </Card.Content>
  </Card>
);

export default NutriScoreCard;
