import { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { 
  Card, 
  Text, 
  ActivityIndicator, 
  Avatar, 
  Button,
  Surface,
  IconButton,
  Divider
} from 'react-native-paper';
import { useAuth } from '@/hooks/auth-context';
import { useRouter } from 'expo-router';

const API_URL = 'http://192.168.100.69:5000';
const USERS_PER_PAGE = 10;

export default function AdminDashboard() {
  const { user, isAdmin, isLoadingUser } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoadingUser && (!user || !isAdmin)) {
      router.replace('/auth');
    }
  }, [user, isAdmin, isLoadingUser]);

  useEffect(() => {
    if (isAdmin && user) {
      fetchUsers();
    }
  }, [currentPage, isAdmin, user]);

  const fetchUsers = async (refreshing = false) => {
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    
    try {
      const offset = (currentPage - 1) * USERS_PER_PAGE;
      
      const response = await fetch(
        `${API_URL}/api/admin/users?limit=${USERS_PER_PAGE}&offset=${offset}`,
        {
          headers: {
            'X-User-ID': user.$id,
          }
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }
      
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleUserPress = (selectedUser) => {
    router.push({
      pathname: '/(admin-tabs)/users-detail',
      params: { userId: selectedUser.$id, userName: selectedUser.name }
    });
  };

  const renderUserItem = ({ item }) => (
    <Card 
      style={styles.userCard}
      onPress={() => handleUserPress(item)}
      mode="elevated"
    >
      <Card.Title
        title={item.name || 'No name'}
        titleStyle={styles.titleText}
        subtitle={item.email}
        subtitleStyle={styles.subtitleText}
        subtitleNumberOfLines={2}
        left={(props) => (
          <Avatar.Text 
            {...props} 
            size={40} 
            label={item.name?.charAt(0)?.toUpperCase() || '?'}
            style={styles.avatar}
            labelStyle={styles.avatarLabel}
          />
        )}
        right={(props) => (
          <IconButton {...props} icon="chevron-right" size={18} />
        )}
      />
    </Card>
  );

  if (isLoadingUser) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#93BFC7" />
      </View>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.statsCard} elevation={2}>
        <Text variant="labelLarge" style={styles.statsLabel}>
          Total Users
        </Text>
        <Text variant="displayMedium" style={styles.statsValue}>
          {total}
        </Text>
      </Surface>

      {error && (
        <Surface style={styles.errorContainer} elevation={1}>
          <Text variant="bodyMedium" style={styles.errorText}>
            {error}
          </Text>
        </Surface>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#93BFC7" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.$id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchUsers(true)}
              colors={['#93BFC7']}
            />
          }
          ItemSeparatorComponent={() => <Divider style={styles.divider} />}
          ListFooterComponent={() => (
            <View style={styles.pagination}>
              <Button
                mode="contained"
                onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={styles.pageButton}
              >
                Previous
              </Button>
              <Text variant="bodyMedium" style={styles.pageInfo}>
                Page {currentPage} of {Math.ceil(total / USERS_PER_PAGE)}
              </Text>
              <Button
                mode="contained"
                onPress={() => setCurrentPage(p => p + 1)}
                disabled={currentPage >= Math.ceil(total / USERS_PER_PAGE)}
                style={styles.pageButton}
              >
                Next
              </Button>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECF4E8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    backgroundColor: '#93BFC7',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  statsLabel: {
    color: '#fff',
    opacity: 0.9,
  },
  statsValue: {
    color: '#fff',
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#dc2626',
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  avatar: {
    backgroundColor: '#93BFC7',
  },
  avatarLabel: {
    fontSize: 16,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '600',
  },
  subtitleText: {
    fontSize: 12,
    lineHeight: 16,
  },
  divider: {
    marginVertical: 4,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  pageButton: {
    backgroundColor: '#93BFC7',
  },
  pageInfo: {
    color: '#4b5563',
  },
});