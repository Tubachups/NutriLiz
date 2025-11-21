import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from 'react-native-paper';
import { useAuth } from "@/hooks/auth-context";

export default function HomeScreen() {
  const { signOut, user, userProfile } = useAuth();

  // Check if profile data is available
  const hasProfileData = userProfile?.weight && userProfile?.height;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>NutriLiz</Text>
          <Text style={styles.subtitle}>Your Nutrition Companion</Text>
          {user && (<Text style={styles.welcomeUser}>Hello, {user.name}!</Text>
          )}
        </View>

        {hasProfileData && (
          <Card style={styles.profileCard}>
            <Card.Content>
              <Text style={styles.cardTitle}>Your Health Profile</Text>
              
              <View style={styles.profileSection}>
                <Text style={styles.sectionTitle}>Body Measurements</Text>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Weight:</Text>
                  <Text style={styles.dataValue}>{userProfile.weight} kg</Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Height:</Text>
                  <Text style={styles.dataValue}>{userProfile.height} cm</Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>BMI:</Text>
                  <Text style={[styles.dataValue, styles.bmiValue]}>
                    {userProfile.bmi} kg/m² {userProfile.bmiCategory}
                  </Text>
                </View>
              </View>

              <View style={styles.profileSection}>
                <Text style={styles.sectionTitle}>Blood Tests</Text>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Blood Sugar:</Text>
                  <Text style={styles.dataValue}>
                    {userProfile.sugarLevel} {userProfile.sugarLevel !== 'N/A' && 'mg/dL'}
                  </Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Cholesterol:</Text>
                  <Text style={styles.dataValue}>
                    {userProfile.cholesterolLevel} {userProfile.cholesterolLevel !== 'N/A' && 'mg/dL'}
                  </Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Triglycerides:</Text>
                  <Text style={styles.dataValue}>
                    {userProfile.triglycerides} {userProfile.triglycerides !== 'N/A' && 'mg/dL'}
                  </Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Creatinine:</Text>
                  <Text style={styles.dataValue}>
                    {userProfile.creatinine} {userProfile.creatinine !== 'N/A' && 'mg/dL'}
                  </Text>
                </View>
                <View style={styles.dataRow}>
                  <Text style={styles.dataLabel}>Uric Acid:</Text>
                  <Text style={styles.dataValue}>
                    {userProfile.uricAcid} {userProfile.uricAcid !== 'N/A' && 'mg/dL'}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        <View style={styles.content}>
          <Text style={styles.welcomeText}>Welcome to NutriLiz!</Text>
          <Text style={styles.description}>
            Track your nutrition and make healthier choices.
          </Text>
          {!hasProfileData && (
            <Text style={styles.hint}>
              👉 Go to Profile tab to set up your health metrics
            </Text>
          )}
          <Button mode='text' icon={'logout'} onPress={signOut}>
            Sign out
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECF4E8',
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
    color: '#93BFC7',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  welcomeUser: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d5016',
    marginTop: 12,
  },
  profileCard: {
    marginBottom: 24,
    backgroundColor: '#fff',
    elevation: 2,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#93BFC7',
    marginBottom: 16,
  },
  profileSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ABE7B2',
    paddingBottom: 4,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  dataLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  dataValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  bmiValue: {
    color: '#2d5016',
  },
  content: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    elevation: 1,
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
    marginBottom: 12,
  },
  hint: {
    fontSize: 14,
    color: '#93BFC7',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
});