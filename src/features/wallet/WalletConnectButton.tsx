import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useWallet } from '@/contexts/WalletContext';

export const WalletConnectButton: React.FC = () => {
  const { connected, connecting, connect, disconnect, publicKey } = useWallet();

  const handlePress = () => {
    if (connected) {
      disconnect();
    } else {
      connect();
    }
  };

  const formatPublicKey = (key: string) => {
    return `${key.slice(0, 6)}...${key.slice(-6)}`;
  };

  if (connected && publicKey) {
    return (
      <View className="bg-accent-amber/20 border border-accent-gold/40 rounded-lg p-2">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-2">
            <View className="flex-row items-center mb-1">
              <MaterialCommunityIcons 
                name="check-circle" 
                size={14} 
                color="#34C759" 
                style={{ marginRight: 4 }}
              />
              <Text className="text-sm font-medium text-neutral-light">
                Connected
              </Text>
            </View>
            <Text className="text-xs text-neutral-medium font-mono">
              {formatPublicKey(publicKey.toString())}
            </Text>
          </View>
          <TouchableOpacity
            className="bg-red-500/20 border border-red-500/40 rounded-lg px-2 py-1"
            onPress={handlePress}
            activeOpacity={0.7}
          >
            <Text className="text-xs font-medium text-red-400">
              Disconnect
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      className="bg-warm-primary rounded-xl px-4 py-1.5 flex-row items-center justify-center mx-4"
      onPress={handlePress}
      disabled={connecting}
      activeOpacity={0.8}
      style={{ opacity: connecting ? 0.6 : 1 }}
    >
      {connecting ? (
        <ActivityIndicator color="#FDF7F0" size="small" style={{ marginRight: 6 }} />
      ) : (
        <MaterialCommunityIcons 
          name="wallet" 
          size={18} 
          color="#FDF7F0" 
          style={{ marginRight: 6 }}
        />
      )}
      <Text className="text-base font-semibold text-neutral-light">
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </Text>
    </TouchableOpacity>
  );
};
