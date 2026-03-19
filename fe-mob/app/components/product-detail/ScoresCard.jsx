import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card } from 'react-native-paper';
import NutriScoreBadge from './NutriScoreBadge';
import EcoScoreBadge from './EcoScoreBadge';

const ScoresCard = ({ productData }) => {
  const isNoDataValue = (value) => {
    if (value === null || value === undefined) {
      return true;
    }

    if (typeof value === 'number') {
      return Number.isNaN(value) || value < 0;
    }

    const text = String(value).trim().toLowerCase();
    return !text || text === 'n/a' || text === 'unknown' || text === 'none' || text === '-1';
  };

  const normalizeGrade = (grade) => String(grade || '').trim().toUpperCase();
  const isValidLetterGrade = (grade) => ['A', 'B', 'C', 'D', 'E'].includes(normalizeGrade(grade));

  const getNovaLabel = (novaGroup) => {
    const labels = {
      1: 'Unprocessed or minimally processed',
      2: 'Processed culinary ingredients',
      3: 'Processed foods',
      4: 'Ultra-processed foods'
    };
    return labels[novaGroup] || 'Unknown';
  };

  const nutriGrade = normalizeGrade(productData.nutri_grade);
  const ecoGrade = normalizeGrade(productData.ecoscore_grade);

  const hasNutriScore = isValidLetterGrade(nutriGrade) && !isNoDataValue(productData.nutri_score);
  const hasNovaGroup = !isNoDataValue(productData.nova_group);
  const hasEcoScore = isValidLetterGrade(ecoGrade) && !isNoDataValue(productData.ecoscore_score);

  return (
    <Card style={styles.card}>
      <Card.Title title="📊 Scores" titleStyle={styles.cardTitle} />
      <Card.Content>
        <View style={styles.nutriScoreContainer}>
          {hasNutriScore ? (
            <NutriScoreBadge grade={nutriGrade} score={productData.nutri_score} />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateTitle}>NUTRI-SCORE</Text>
              <Text style={styles.emptyStateText}>No data available</Text>
            </View>
          )}
        </View>

        <View style={styles.novaContainer}>
          <Text style={styles.novaTitle}>NOVA Group</Text>
          {hasNovaGroup ? (
            <>
              <Text style={styles.novaValue}>{String(productData.nova_group)}</Text>
              <Text style={styles.novaDescription}>{getNovaLabel(productData.nova_group)}</Text>
            </>
          ) : (
            <Text style={styles.emptyStateText}>No data available</Text>
          )}
        </View>

        <View style={styles.ecoScoreSection}>
          {hasEcoScore ? (
            <EcoScoreBadge
              grade={ecoGrade}
              score={productData.ecoscore_score}
            />
          ) : (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateTitle}>ECO-SCORE</Text>
              <Text style={styles.emptyStateText}>No data available</Text>
            </View>
          )}
        </View>
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
  cardTitle: {
    color: '#1e7d5dff',
    fontWeight: 'bold',
  },
  nutriScoreContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  emptyStateContainer: {
    width: '100%',
    backgroundColor: '#f2fcedff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 1,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  novaContainer: {
    backgroundColor: '#f2fcedff',
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
  novaValue: {
    fontWeight: '600',
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  ecoScoreSection: {
    marginTop: 16,
  },
});
