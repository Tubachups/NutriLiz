import { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { 
  Card, 
  Text, 
  ActivityIndicator, 
  Surface,
  Divider,
  FAB
} from 'react-native-paper';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useAuth } from '@/hooks/auth-context';
import * as Print from 'expo-print';

const API_URL = 'http://192.168.100.69:5000';

export default function UserDetail() {
  const { userId, userName } = useLocalSearchParams();
  const { user } = useAuth();
  
  const [scanHistory, setScanHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

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

  const generatePdfHtml = () => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const historyRows = scanHistory.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${item.productName || 'Unknown Product'}</td>
        <td>${item.barcode || 'N/A'}</td>
        <td>${item.scannedAt ? new Date(item.scannedAt).toLocaleString() : 'N/A'}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Scan History Report</title>
          <style>
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              padding: 40px;
              color: #333;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #93BFC7;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #93BFC7;
              margin-bottom: 5px;
            }
            .report-title {
              font-size: 22px;
              color: #333;
              margin-top: 10px;
            }
            .user-info {
              background-color: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 25px;
            }
            .user-info h3 {
              color: #93BFC7;
              margin-bottom: 10px;
              font-size: 16px;
            }
            .user-info p {
              margin: 5px 0;
              font-size: 14px;
            }
            .summary {
              display: flex;
              justify-content: space-between;
              margin-bottom: 25px;
            }
            .summary-box {
              background-color: #93BFC7;
              color: white;
              padding: 15px 25px;
              border-radius: 8px;
              text-align: center;
              flex: 1;
              margin: 0 10px;
            }
            .summary-box:first-child {
              margin-left: 0;
            }
            .summary-box:last-child {
              margin-right: 0;
            }
            .summary-box .value {
              font-size: 24px;
              font-weight: bold;
            }
            .summary-box .label {
              font-size: 12px;
              opacity: 0.9;
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
            .no-data {
              text-align: center;
              padding: 40px;
              color: #888;
              font-style: italic;
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
            <div class="report-title">User Scan History Report</div>
          </div>
          
          <div class="user-info">
            <h3>User Information</h3>
            <p><strong>Name:</strong> ${userName || 'N/A'}</p>
            <p><strong>User ID:</strong> ${userId}</p>
            <p><strong>Report Generated:</strong> ${currentDate}</p>
          </div>

          <div class="summary">
            <div class="summary-box">
              <div class="value">${scanHistory.length}</div>
              <div class="label">Total Scans</div>
            </div>
          </div>

          ${scanHistory.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th style="width: 50px;">#</th>
                  <th>Product Name</th>
                  <th style="width: 140px;">Barcode</th>
                  <th style="width: 180px;">Scanned Date</th>
                </tr>
              </thead>
              <tbody>
                ${historyRows}
              </tbody>
            </table>
          ` : `
            <div class="no-data">
              No scan history available for this user.
            </div>
          `}

          <div class="footer">
            <p>Generated by NutriLiz Admin Panel</p>
            <p>© ${new Date().getFullYear()} NutriLiz. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  };

  const handlePrintPdf = async () => {
    if (scanHistory.length === 0) {
      Alert.alert('No Data', 'There is no scan history to print for this user.');
      return;
    }

    setIsPrinting(true);
    try {
      const html = generatePdfHtml();
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

  const renderScanItem = ({ item }) => (
    <Card style={styles.scanCard} mode="elevated">
      <Card.Content>
        <Text variant="titleMedium" style={styles.productName}>
          {item.productName || 'Unknown Product'}
        </Text>
        <Text variant="bodyMedium" style={styles.barcode}>
          Barcode: {item.barcode || 'N/A'}
        </Text>
        <Text variant="bodySmall" style={styles.scanDate}>
          Scanned: {item.scannedAt ? new Date(item.scannedAt).toLocaleString() : 'N/A'}
        </Text>
      </Card.Content>
    </Card>
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
        <Surface style={styles.userHeader} elevation={1}>
          <Text variant="titleLarge" style={styles.userName}>
            {userName || 'User'}
          </Text>
          <Text variant="bodySmall" style={styles.userId}>
            ID: {userId}
          </Text>
        </Surface>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Scan History
        </Text>

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
        ) : scanHistory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No scan history found
            </Text>
          </View>
        ) : (
          <FlatList
            data={scanHistory}
            keyExtractor={(item, index) => item.$id || index.toString()}
            renderItem={renderScanItem}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <Divider style={styles.divider} />}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => fetchUserScanHistory(true)}
                colors={['#93BFC7']}
              />
            }
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
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userId: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Extra padding for FAB
  },
  scanCard: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  barcode: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  scanDate: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  divider: {
    marginVertical: 4,
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
    fontSize: 15,
    color: '#888',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#93BFC7',
  },
});