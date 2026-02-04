import { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useAuth } from '@/hooks/auth-context';

const API_URL = 'http://192.168.100.69:5000';

export default function UserDetail() {
  const { userId, userName } = useLocalSearchParams();
  const { user } = useAuth();
  
  const [scanHistory, setScanHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchUserScanHistory();
    }
  }, [userId]);

  const fetchUserScanHistory = async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_URL}/api/admin/users/${userId}/scan-history`,
        {
          headers: {
            'X-User-ID': user.$id,
          }
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch scan history');
      }
      
      setScanHistory(data.history || []);
    } catch (err) {
      console.error('Error fetching scan history:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const renderScanItem = ({ item }) => (
    <View style={styles.scanCard}>
      <View style={styles.scanInfo}>
        <Text style={styles.productName}>{item.productName || 'Unknown Product'}</Text>
        <Text style={styles.barcode}>Barcode: {item.barcode || 'N/A'}</Text>
        <Text style={styles.scanDate}>
          Scanned: {item.scannedAt ? new Date(item.scannedAt).toLocaleString() : 'N/A'}
        </Text>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          headerTitle: userName || 'User Details',
          headerStyle: { backgroundColor: '#93BFC7' },
          headerTintColor: '#fff',
        }} 
      />
      <View style={styles.container}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>{userName || 'User'}</Text>
          <Text style={styles.userId}>ID: {userId}</Text>
        </View>

        <Text style={styles.sectionTitle}>Scan History</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#93BFC7" />
          </View>
        ) : scanHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No scan history found</Text>
          </View>
        ) : (
          <FlatList
            data={scanHistory}
            keyExtractor={(item, index) => item.$id || index.toString()}
            renderItem={renderScanItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => fetchUserScanHistory(true)}
                colors={['#93BFC7']}
              />
            }
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  userHeader: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  userId: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  scanCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scanInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  barcode: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  scanDate: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
});