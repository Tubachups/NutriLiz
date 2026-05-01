import React from 'react';
import { Card, Text } from 'react-native-paper';

const AdviceCard = ({ title, text, styles }) => {
  if (!text) {
    return null;
  }

  return (
    <Card style={[styles.card, styles.personalizedCard]}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {title}
        </Text>
        <Text style={styles.advice}>{text}</Text>
      </Card.Content>
    </Card>
  );
};

export default AdviceCard;
