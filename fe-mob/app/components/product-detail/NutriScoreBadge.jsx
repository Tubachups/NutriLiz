import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const NutriScoreBadge = ({ grade, score }) => {
  const grades = ['A', 'B', 'C', 'D', 'E'];
  const colors = {
    'A': '#008000',
    'B': '#85BB2F',
    'C': '#FFCC00',
    'D': '#FF6600',
    'E': '#FF0000'
  };
  
  const currentGrade = grade?.toUpperCase();
  
  return (
    <View style={styles.nutriScoreBadge}>
      <Text style={styles.nutriScoreTitle}>NUTRI-SCORE</Text>
      <View style={styles.nutriScoreGrades}>
        {grades.map((g) => {
          const isActive = g === currentGrade;
          return (
            <View
              key={g}
              style={[
                styles.gradeBox,
                {
                  backgroundColor: colors[g],
                  transform: [{ scale: isActive ? 1.25 : 1 }],
                  opacity: isActive ? 1 : 0.6,
                  borderRadius: isActive ? 20 : 4,
                  borderWidth: isActive ? 3 : 0,
                  borderColor: 'white',
                  elevation: isActive ? 5 : 0,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isActive ? 0.3 : 0,
                  shadowRadius: isActive ? 4 : 0,
                  zIndex: isActive ? 10 : 1,
                }
              ]}
            >
              <Text style={styles.gradeText}>{g}</Text>
            </View>
          );
        })}
      </View>
      {score && score !== 'N/A' && (
        <Text style={styles.scoreText}>Score: {score}</Text>
      )}
    </View>
  );
};

export default NutriScoreBadge;

const styles = StyleSheet.create({
  nutriScoreBadge: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nutriScoreTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    letterSpacing: 1,
  },
  nutriScoreGrades: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  gradeBox: {
    width: 40,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  gradeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scoreText: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
  },
});