import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';
import { useAuth } from "@/hooks/auth-context";

export default function HomeScreen() {
  const {signOut} = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>NutriLiz</Text>
          <Text style={styles.subtitle}>Your Nutrition Companion</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.welcomeText}>Welcome to NutriLiz!</Text>
          <Text style={styles.description}>
            Track your nutrition and make healthier choices.
          </Text>
          <Button mode='text' icon={'logout'} onPress={signOut}>Sign out</Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});