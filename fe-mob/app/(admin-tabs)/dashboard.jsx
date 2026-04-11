import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, TextInput, Alert } from 'react-native';
import { FAB } from 'react-native-paper';
import { useAuth } from '@/hooks/auth-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { apiFetch } from '@/lib/api';

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
  const [pageInput, setPageInput] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);

  const totalPages = Math.ceil(total / USERS_PER_PAGE);

  // Get page numbers to display (up to 5 at a time)
  const getPageNumbers = () => {
    const pages = [];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    
    // Adjust start if we're near the end
    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handlePageInputSubmit = () => {
    const page = parseInt(pageInput, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
    setPageInput('');
  };

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
      
      const response = await apiFetch(`/api/admin/users?limit=${USERS_PER_PAGE}&offset=${offset}`, {
        headers: {
          'X-User-ID': user.$id,
        }
      });
      
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

  // Fetch all users for PDF generation
  const fetchAllUsersForPdf = async () => {
    try {
      const response = await apiFetch('/api/admin/users?limit=1000&offset=0', {
        headers: {
          'X-User-ID': user.$id,
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }
      
      return data.users;
    } catch (err) {
      console.error('Error fetching all users:', err);
      throw err;
    }
  };

  // Generate PDF HTML
  const generatePdfHtml = (allUsers) => {
    const currentDate = new Date().toLocaleString();
    
    const userRows = allUsers.map((u, index) => `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td>${u.name || 'No name'}</td>
        <td>${u.email}</td>
        <td style="text-align: center;">
          <span style="
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
            background-color: ${u.emailVerification ? '#dcfce7' : '#fef3c7'};
            color: ${u.emailVerification ? '#166534' : '#92400e'};
          ">${u.emailVerification ? 'Verified' : 'Unverified'}</span>
        </td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>NutriLiz User Accounts Report</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              color: #333;
              background: #fff;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #93BFC7;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #93BFC7;
              margin-bottom: 8px;
            }
            .report-title {
              font-size: 18px;
              color: #666;
            }
            .report-info {
              background: linear-gradient(135deg, #f0f9f4 0%, #e8f4f8 100%);
              padding: 20px;
              border-radius: 12px;
              margin-bottom: 24px;
            }
            .report-info h3 {
              color: #93BFC7;
              margin-bottom: 12px;
              font-size: 16px;
            }
            .report-info p {
              margin: 6px 0;
              font-size: 14px;
              color: #555;
            }
            .summary {
              display: flex;
              gap: 16px;
              margin-bottom: 24px;
            }
            .summary-box {
              flex: 1;
              background: #93BFC7;
              color: white;
              padding: 20px;
              border-radius: 12px;
              text-align: center;
            }
            .summary-box .value {
              font-size: 28px;
              font-weight: bold;
            }
            .summary-box .label {
              font-size: 12px;
              opacity: 0.9;
              margin-top: 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
              font-size: 13px;
            }
            th {
              background-color: #93BFC7;
              color: white;
              padding: 12px 10px;
              text-align: left;
              font-weight: 600;
            }
            td {
              padding: 10px;
              border-bottom: 1px solid #e0e0e0;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            tr:hover {
              background-color: #f0f7f8;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              text-align: center;
              font-size: 11px;
              color: #888;
            }
            @media print {
              body {
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">🥗 NutriLiz</div>
            <div class="report-title">Registered User Accounts Report</div>
          </div>
          
          <div class="report-info">
            <h3>Report Information</h3>
            <p><strong>Generated By:</strong> Admin</p>
            <p><strong>Report Date:</strong> ${currentDate}</p>
          </div>

          <div class="summary">
            <div class="summary-box">
              <div class="value">${allUsers.length}</div>
              <div class="label">Total Users</div>
            </div>
            <div class="summary-box">
              <div class="value">${allUsers.filter(u => u.emailVerification).length}</div>
              <div class="label">Verified</div>
            </div>
            <div class="summary-box">
              <div class="value">${allUsers.filter(u => !u.emailVerification).length}</div>
              <div class="label">Unverified</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">#</th>
                <th>Name</th>
                <th>Email</th>
                <th style="width: 100px; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${userRows}
            </tbody>
          </table>

          <div class="footer">
            <p>Generated by NutriLiz Admin Panel</p>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrintPdf = async () => {
    if (total === 0) {
      Alert.alert('No Data', 'There are no users to print.');
      return;
    }

    setIsPrinting(true);
    try {
      const allUsers = await fetchAllUsersForPdf();
      const html = generatePdfHtml(allUsers);
      await Print.printAsync({
        html,
        orientation: Print.Orientation.portrait,
      });
    } catch (err) {
      console.error('Error printing PDF:', err);
      Alert.alert('Print Error', 'Failed to generate PDF. Please try again.');
    } finally {
      setIsPrinting(false);
    }
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userCard} 
      onPress={() => handleUserPress(item)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name || 'No name'}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      <View style={[
        styles.statusBadge, 
        { backgroundColor: item.emailVerification ? '#dcfce7' : '#fef3c7' }
      ]}>
        <Text style={[
          styles.statusText,
          { color: item.emailVerification ? '#166534' : '#92400e' }
        ]}>
          {item.emailVerification ? 'Verified' : 'Unverified'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#888" />
    </TouchableOpacity>
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
      <View style={styles.statsCard}>
        <Text style={styles.statsLabel}>Total Users</Text>
        <Text style={styles.statsValue}>{total}</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
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
          ListFooterComponent={() => (
            <View style={styles.paginationContainer}>
              {/* Page Numbers */}
              <View style={styles.pageNumbersRow}>
                <TouchableOpacity
                  style={[styles.navButton, currentPage === 1 && styles.navButtonDisabled]}
                  onPress={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <Ionicons name="chevron-back-outline" size={16} color={currentPage === 1 ? '#999' : '#fff'} />
                  <Ionicons name="chevron-back-outline" size={16} color={currentPage === 1 ? '#999' : '#fff'} style={{ marginLeft: -10 }} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.navButton, currentPage === 1 && styles.navButtonDisabled]}
                  onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <Ionicons name="chevron-back-outline" size={18} color={currentPage === 1 ? '#999' : '#fff'} />
                </TouchableOpacity>
                
                {getPageNumbers().map(page => (
                  <TouchableOpacity
                    key={page}
                    style={[styles.pageNumber, currentPage === page && styles.pageNumberActive]}
                    onPress={() => setCurrentPage(page)}
                  >
                    <Text style={[styles.pageNumberText, currentPage === page && styles.pageNumberTextActive]}>
                      {page}
                    </Text>
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity
                  style={[styles.navButton, currentPage >= totalPages && styles.navButtonDisabled]}
                  onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <Ionicons name="chevron-forward-outline" size={18} color={currentPage >= totalPages ? '#999' : '#fff'} />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.navButton, currentPage >= totalPages && styles.navButtonDisabled]}
                  onPress={() => setCurrentPage(totalPages)}
                  disabled={currentPage >= totalPages}
                >
                  <Ionicons name="chevron-forward-outline" size={16} color={currentPage >= totalPages ? '#999' : '#fff'} />
                  <Ionicons name="chevron-forward-outline" size={16} color={currentPage >= totalPages ? '#999' : '#fff'} style={{ marginLeft: -10 }} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </Text>
            </View>
          )}
        />
      )}

      {/* FAB for Print PDF */}
      <FAB
        icon="file-pdf-box"
        label="Print PDF"
        style={styles.fab}
        onPress={handlePrintPdf}
        loading={isPrinting}
        disabled={isPrinting || isLoading}
      />
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
    fontSize: 14,
    opacity: 0.9,
  },
  statsValue: {
    color: '#fff',
    fontSize: 32,
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
    paddingBottom: 100, // Extra padding for FAB
  },
  userCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#93BFC7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  userEmail: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  paginationContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    gap: 12,
  },
  pageNumbersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navButton: {
    backgroundColor: '#93BFC7',
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  navButtonDisabled: {
    backgroundColor: '#e5e5e5',
  },
  pageNumber: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#93BFC7',
  },
  pageNumberActive: {
    backgroundColor: '#93BFC7',
  },
  pageNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#93BFC7',
  },
  pageNumberTextActive: {
    color: '#fff',
  },
  goToPageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goToPageLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  pageInput: {
    width: 60,
    height: 36,
    borderWidth: 1,
    borderColor: '#93BFC7',
    borderRadius: 8,
    paddingHorizontal: 10,
    textAlign: 'center',
    fontSize: 14,
    backgroundColor: '#fff',
  },
  goButton: {
    backgroundColor: '#93BFC7',
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  pageInfo: {
    color: '#6b7280',
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#93BFC7',
  },
});