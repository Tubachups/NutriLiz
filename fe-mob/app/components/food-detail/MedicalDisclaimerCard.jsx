import React from 'react';
import { Card, Text } from 'react-native-paper';

const MedicalDisclaimerCard = ({ title, text, styles }) => (
  <Card style={[styles.card, styles.medicalDisclaimerCard]}>
    <Card.Content>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        {title}
      </Text>
      <Text style={styles.medicalDisclaimerText}>
        {text}
      </Text>
    </Card.Content>
  </Card>
);

export default MedicalDisclaimerCard;
