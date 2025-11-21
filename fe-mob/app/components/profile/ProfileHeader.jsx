import React from 'react';
import { Text } from 'react-native-paper';
import { StyleSheet } from 'react-native';

const ProfileHeader = () => {
  return (
    <>
      <Text variant="headlineSmall" style={styles.title}>
        Health Profile
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Enter your health metrics
      </Text>
    </>
  );
};

const styles = StyleSheet.create({
  title: {
    fontWeight: 'bold',
    color: '#93BFC7',
    marginBottom: 8,
  },
  subtitle: {
    color: '#757575',
    marginBottom: 24,
  },
});

export default ProfileHeader;