import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useWallet } from '@/contexts/WalletContext';
import { solanaService } from '@/services/SolanaService';
import { PublicKey } from '@solana/web3.js';
import Toast from 'react-native-toast-message';

interface TransactionHistoryItem {
  signature: string;
  slot: number;
  timestamp: number;
  confirmationStatus: string | undefined;
  err: any;
  transaction: any;
}

export const TransactionHistory: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadTransactionHistory = async (isRefresh = false) => {
    if (!publicKey) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const pubKey = new PublicKey(publicKey);
      const history = await solanaService.getTransactionHistory(pubKey, 20);
      setTransactions(history);

    } catch (error) {
      console.error('Failed to load transaction history:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to Load History',
        text2: 'Could not fetch transaction history',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatSignature = (signature: string) => {
    return `${signature.slice(0, 8)}...${signature.slice(-8)}`;
  };

  const getTransactionStatus = (tx: TransactionHistoryItem) => {
    if (tx.err) return 'Failed';
    return tx.confirmationStatus === 'finalized' ? 'Confirmed' : 'Processing';
  };

  const getStatusColor = (tx: TransactionHistoryItem) => {
    if (tx.err) return '#ef4444';
    return tx.confirmationStatus === 'finalized' ? '#10b981' : '#f59e0b';
  };

  const onRefresh = () => {
    loadTransactionHistory(true);
  };

  useEffect(() => {
    if (connected && publicKey) {
      loadTransactionHistory();
    }
  }, [connected, publicKey]);

  if (!connected) {
    return (
      <View style={styles.container}>
        <Text style={styles.notConnectedText}>
          Please connect your wallet to view transaction history
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
        <TouchableOpacity 
          onPress={() => loadTransactionHistory()}
          disabled={loading}
          style={styles.refreshButton}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#3b82f6" />
          ) : (
            <Text style={styles.refreshText}>↻</Text>
          )}
        </TouchableOpacity>
      </View>

      {loading && transactions.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No transactions found</Text>
          <Text style={styles.emptySubtext}>
            Your transaction history will appear here
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.transactionsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {transactions.map((tx, index) => (
            <View key={tx.signature} style={styles.transactionItem}>
              <View style={styles.transactionHeader}>
                <Text style={styles.transactionSignature}>
                  {formatSignature(tx.signature)}
                </Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(tx) }
                ]}>
                  <Text style={styles.statusText}>
                    {getTransactionStatus(tx)}
                  </Text>
                </View>
              </View>

              <View style={styles.transactionDetails}>
                <Text style={styles.transactionDate}>
                  {formatDate(tx.timestamp)}
                </Text>
                <Text style={styles.transactionSlot}>
                  Slot: {tx.slot.toLocaleString()}
                </Text>
              </View>

              {tx.err && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>
                    Error: {JSON.stringify(tx.err)}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  refreshButton: {
    padding: 4,
  },
  refreshText: {
    fontSize: 18,
    color: '#3b82f6',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  transactionsList: {
    maxHeight: 400,
  },
  transactionItem: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionSignature: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#374151',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  transactionSlot: {
    fontSize: 12,
    color: '#6b7280',
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
  },
  notConnectedText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    padding: 20,
  },
});
