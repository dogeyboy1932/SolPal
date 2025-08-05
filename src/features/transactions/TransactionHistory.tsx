import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useWallet } from '@/contexts/WalletContext';
import { solanaService } from '@/services/solanaService';
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

type FilterType = 'all' | 'success' | 'failed' | 'pending';

export const TransactionHistory: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const [transactions, setTransactions] = useState<TransactionHistoryItem[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const applyFilters = (txList: TransactionHistoryItem[], search: string, filter: FilterType) => {
    let filtered = [...txList];

    // Apply search filter
    if (search.trim()) {
      filtered = filtered.filter(tx => 
        tx.signature.toLowerCase().includes(search.toLowerCase()) ||
        formatDate(tx.timestamp).toLowerCase().includes(search.toLowerCase())
      );
    }

    // Apply status filter
    switch (filter) {
      case 'success':
        filtered = filtered.filter(tx => !tx.err && tx.confirmationStatus === 'finalized');
        break;
      case 'failed':
        filtered = filtered.filter(tx => tx.err);
        break;
      case 'pending':
        filtered = filtered.filter(tx => !tx.err && tx.confirmationStatus !== 'finalized');
        break;
      case 'all':
      default:
        // No additional filtering
        break;
    }

    setFilteredTransactions(filtered);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    applyFilters(transactions, query, activeFilter);
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    applyFilters(transactions, searchQuery, filter);
  };

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
      applyFilters(history, searchQuery, activeFilter);

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
  }, []);

  if (!connected) {
    return (
      <View className="bg-amber-50 rounded-xl p-4 mx-4 shadow-sm border border-amber-200">
        <Text className="text-center text-amber-800 text-base p-5">
          Please connect your wallet to view transaction history
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-xl p-4 shadow-lg border border-amber-200">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-xl font-semibold text-amber-900">Transaction History</Text>
        <TouchableOpacity 
          onPress={() => loadTransactionHistory()}
          disabled={loading}
          className="p-1"
        >
          {loading ? (
            <ActivityIndicator size="small" color="#E49B3F" />
          ) : (
            <Text className="text-lg text-orange-500">↻</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View className="mb-4">
        <TextInput
          className="bg-white border border-amber-300 rounded-lg px-3 py-2 text-amber-900"
          placeholder="Search by signature or date..."
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholderTextColor="#6b7280"
        />
      </View>

      {/* Filter Buttons */}
      <View className="flex-row flex-wrap gap-2 mb-4">
        {(['all', 'success', 'failed', 'pending'] as FilterType[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            className={`px-3 py-2 rounded-lg border ${
              activeFilter === filter 
                ? 'bg-orange-500 border-orange-600' 
                : 'bg-white border-amber-300'
            }`}
            onPress={() => handleFilterChange(filter)}
          >
            <Text className={`text-sm font-medium ${
              activeFilter === filter ? 'text-white' : 'text-amber-800'
            }`}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && transactions.length === 0 ? (
        <View className="flex-1 justify-center items-center py-8">
          <ActivityIndicator size="large" color="#E49B3F" />
          <Text className="text-amber-700 text-base mt-2">Loading transactions...</Text>
        </View>
      ) : filteredTransactions.length === 0 && transactions.length > 0 ? (
        <View className="py-8 items-center">
          <Text className="text-amber-800 text-base font-medium">No transactions match your filters</Text>
          <Text className="text-amber-600 text-sm mt-1">
            Try adjusting your search or filter criteria
          </Text>
        </View>
      ) : filteredTransactions.length === 0 ? (
        <View className="py-8 items-center">
          <Text className="text-amber-800 text-base font-medium">No transactions found</Text>
          <Text className="text-amber-600 text-sm mt-1">
            Your transaction history will appear here
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredTransactions.map((tx, index) => (
            <View key={tx.signature} className="bg-white rounded-lg p-4 mb-3 border border-amber-200 shadow-sm">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-amber-900 font-mono text-sm">
                  {formatSignature(tx.signature)}
                </Text>
                <View 
                  className="px-2 py-1 rounded-full"
                  style={{ backgroundColor: getStatusColor(tx) }}
                >
                  <Text className="text-white text-xs font-medium">
                    {getTransactionStatus(tx)}
                  </Text>
                </View>
              </View>

              <View className="gap-1">
                <Text className="text-amber-700 text-sm">
                  {formatDate(tx.timestamp)}
                </Text>
                <Text className="text-amber-600 text-xs">
                  Slot: {tx.slot.toLocaleString()}
                </Text>
              </View>

              {tx.err && (
                <View className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                  <Text className="text-red-700 text-xs">
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
