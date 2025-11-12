import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Path } from 'react-native-svg';

const LeafBadge = ({ color, letter, isActive }) => {
  return (
    <View style={[styles.leafContainer, { opacity: isActive ? 1 : 0.3 }]}>
      <Svg 
        width={isActive ? 55 : 50} 
        height={isActive ? 55 : 50} 
        viewBox="0 0 100 100"
        style={styles.leafSvg}
      >
        <Path
          d="M50,10 Q80,20 85,50 Q80,80 50,95 Q30,80 20,60 Q15,40 25,25 Q35,15 50,10 Z"
          fill={color}
          stroke="white"
          strokeWidth="2"
        />
      </Svg>
      <Text style={[styles.gradeText, { fontSize: isActive ? 22 : 20 }]}>
        {letter}
      </Text>
    </View>
  );
};

const EcoScoreBadge = ({ grade, score }) => {
  const grades = ['A', 'B', 'C', 'D', 'E'];
  const normalizedGrade = grade?.toUpperCase();

  const getEcoscoreColor = (gradeValue) => {
    const colors = {
      'A': '#008000',
      'B': '#85BB2F',
      'C': '#FFCC00',
      'D': '#FF6600',
      'E': '#FF0000'
    };
    return colors[gradeValue] || '#999';
  };

  return (
    <View style={styles.ecoScoreContainer}>
      <Text style={styles.ecoScoreTitle}>ECO-SCORE</Text>
      <View style={styles.badgeContainer}>
        {grades.map((gradeValue) => {
          const isActive = gradeValue === normalizedGrade;
          return (
            <LeafBadge
              key={gradeValue}
              color={getEcoscoreColor(gradeValue)}
              letter={gradeValue}
              isActive={isActive}
            />
          );
        })}
      </View>
      {score && score !== 'N/A' && (
        <Text style={styles.scoreText}>Score: {score}/100</Text>
      )}
    </View>
  );
};

export default EcoScoreBadge;

const styles = StyleSheet.create({
  ecoScoreContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  ecoScoreTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 12,
    letterSpacing: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  leafContainer: {
    width: 55,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leafSvg: {
    position: 'absolute',
  },
  gradeText: {
    color: 'white',
    fontWeight: 'bold',
    zIndex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  scoreText: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
});