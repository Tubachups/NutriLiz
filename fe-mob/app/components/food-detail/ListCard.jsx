import React from 'react';
import { Card, Text } from 'react-native-paper';

const ListCard = ({ title, items, styles }) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {title}
        </Text>
        {items.map((item, index) => (
          <Text key={index} style={styles.listItem}>
            • {item}
          </Text>
        ))}
      </Card.Content>
    </Card>
  );
};

export default ListCard;
