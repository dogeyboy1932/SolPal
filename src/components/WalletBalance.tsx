import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useWallet } from '@/contexts/WalletContext';

export const WalletBalance: React.FC = () => {
  const { connected, balance, refreshBalance, publicKey } = useWallet();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBalance();
    setRefreshing(false);
  };

  if (!connected || !publicKey) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wallet Balance</Text>
        <TouchableOpacity
          onPress={handleRefresh}
          disabled={refreshing}
          style={styles.refreshButton}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#3b82f6" />
          ) : (
            <Text style={styles.refreshText}>↻</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceAmount}>
          {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}
        </Text>
        <Text style={styles.balanceLabel}>
          ≈ ${balance !== null ? (balance * 20).toFixed(2) : '0.00'} USD
        </Text>
      </View>

      <View style={styles.addressContainer}>
        <Text style={styles.addressLabel}>Public Key:</Text>
        <Text style={styles.addressText}>{publicKey}</Text>
      </View>
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
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
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
  balanceContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  addressContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  addressLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#374151',
    lineHeight: 16,
  },
});
