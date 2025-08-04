import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
      <LinearGradient
        colors={['#007AFF', '#0056CC']}
        style={styles.balanceCard}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Wallet Balance</Text>
          <TouchableOpacity
            onPress={handleRefresh}
            disabled={refreshing}
            style={styles.refreshButton}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="refresh" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceAmount}>
            {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}
          </Text>
          <Text style={styles.balanceUSD}>
            ≈ ${balance !== null ? (balance * 20).toFixed(2) : '0.00'} USD
          </Text>
        </View>

        <View style={styles.publicKeyContainer}>
          <Text style={styles.publicKeyLabel}>Public Key:</Text>
          <Text style={styles.publicKeyValue}>
            {`${publicKey.toString().slice(0, 12)}...${publicKey.toString().slice(-12)}`}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  balanceCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  refreshButton: {
    padding: 4,
  },
  balanceContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  balanceUSD: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  publicKeyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
  },
  publicKeyLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
    fontWeight: '500',
  },
  publicKeyValue: {
    fontSize: 12,
    color: 'white',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
});
