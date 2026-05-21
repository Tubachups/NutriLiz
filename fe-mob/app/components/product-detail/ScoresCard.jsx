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
          {hasNovaGroup ? (
            <NovaGroupBadge
              group={Number(productData.nova_group)}
              label={getNovaLabel(productData.nova_group)}
            />
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

const NovaGroupBadge = ({ group, label }) => {
  const groups = [1, 2, 3, 4];
  const colors = {
    1: '#2ca24c',
    2: '#f3c43b',
    3: '#f28b2d',
    4: '#e74c3c',
  };

  return (
    <View style={styles.novaBadge}>
      <Text style={styles.novaBadgeTitle}>NOVA</Text>
      <View style={styles.novaBadgeRow}>
        {groups.map((g) => {
          const isActive = g === group;
          return (
            <View
              key={g}
              style={[
                styles.novaGroupBox,
                {
                  backgroundColor: colors[g],
                  opacity: isActive ? 1 : 0.6,
                  transform: [{ scale: isActive ? 1.18 : 1 }],
                  borderRadius: isActive ? 18 : 6,
                  borderWidth: isActive ? 3 : 0,
                  borderColor: 'white',
                  elevation: isActive ? 5 : 0,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isActive ? 0.3 : 0,
                  shadowRadius: isActive ? 4 : 0,
                  zIndex: isActive ? 10 : 1,
                },
              ]}
            >
              <Text style={styles.novaGroupText}>{String(g)}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.novaDescription}>{label}</Text>
    </View>
  );
};

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
    marginVertical: 10,
    alignItems: 'center',
  },
  novaDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
    alignSelf: 'center',
  },
  novaBadge: {
    backgroundColor: '#f2fcedff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  novaBadgeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    letterSpacing: 1,
  },
  novaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  novaGroupBox: {
    width: 40,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    marginHorizontal: 2,
  },
  novaGroupText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  ecoScoreSection: {
    marginTop: 16,
  },
});
