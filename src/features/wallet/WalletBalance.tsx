import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
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
    <View className="">
      <LinearGradient
        colors={['#E49B3F', '#92400e']}
        className="rounded-lg p-5 shadow-lg"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <View className="flex-row justify-between items-center mb-5">
          <Text className="text-lg font-semibold text-white">
            Wallet Balance
          </Text>
          <TouchableOpacity
            onPress={handleRefresh}
            disabled={refreshing}
            className="p-1"
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#FDF7F0" />
            ) : (
              <Ionicons name="refresh" size={20} color="#FDF7F0" />
            )}
          </TouchableOpacity>
        </View>
        
        <View className="items-center mb-6">
          <Text className="text-3xl font-bold text-amber-50 mb-1">
            {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}
          </Text>
          <Text className="text-base text-amber-100/90 font-medium">
            ≈ ${balance !== null ? (balance * 20).toFixed(2) : '0.00'} USD
          </Text>
        </View>

        <View className="bg-amber-100/20 rounded-xl p-3">
          <Text className="text-xs text-amber-100/90 mb-1 font-medium">
            Public Key:
          </Text>
          <Text className="text-xs text-amber-50 font-mono leading-4">
            {`${publicKey.toString().slice(0, 12)}...${publicKey.toString().slice(-12)}`}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};
