import React from 'react';
import { StyleSheet } from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';

const AIAssessment = ({ loading, assessment }) => {
  if (loading) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <ActivityIndicator size="small" />
          <Text style={styles.centerText}>Generating health assessment...</Text>
        </Card.Content>
      </Card>
    );
  }

  if (!assessment || !assessment.ai_analysis) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <Card.Title title="🤖 Health Assessment" />
      <Card.Content>
        <Text style={styles.analysisText}>
          {assessment.ai_analysis.replace(/\*\*/g, '')}
        </Text>
      </Card.Content>
    </Card>
  );
};


export default AIAssessment;

const styles = StyleSheet.create({
  card: {
    margin: 10,
    backgroundColor: 'white',
  },
  centerText: {
    textAlign: 'center',
    marginTop: 10,
  },
  analysisText: {
    lineHeight: 22,
    color: '#333',
  },
});
