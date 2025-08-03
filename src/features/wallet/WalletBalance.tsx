import React from 'react';
import {
  View,
  Text,
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
    <View className="bg-white rounded-xl p-4 m-4 shadow-lg">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-semibold text-gray-800">Wallet Balance</Text>
        <TouchableOpacity
          onPress={handleRefresh}
          disabled={refreshing}
          className="p-1"
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#3b82f6" />
          ) : (
            <Text className="text-lg text-blue-500">↻</Text>
          )}
        </TouchableOpacity>
      </View>
      
      <View className="items-center mb-4">
        <Text className="text-3xl font-bold text-gray-800">
          {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}
        </Text>
        <Text className="text-base text-gray-600 mt-1">
          ≈ ${balance !== null ? (balance * 20).toFixed(2) : '0.00'} USD
        </Text>
      </View>

      <View className="bg-gray-50 rounded-lg p-3">
        <Text className="text-xs text-gray-600 mb-1">Public Key:</Text>
        <Text className="text-xs text-gray-700 leading-4" style={{ fontFamily: 'monospace' }}>
          {publicKey}
        </Text>
      </View>
    </View>
  );
};
