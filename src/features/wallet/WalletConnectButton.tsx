import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
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
    return `${key.slice(0, 8)}...${key.slice(-8)}`;
  };

  return (
    <TouchableOpacity
      className={`px-5 py-3 rounded-lg items-center justify-center min-h-12 ${
        connected ? 'bg-green-500' : 'bg-blue-500'
      }`}
      onPress={handlePress}
      disabled={connecting}
    >
      <View className="items-center">
        {connecting ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <Text className="text-white text-base font-semibold">
              {connected ? 'Disconnect' : 'Connect Wallet'}
            </Text>
            {connected && publicKey && (
              <Text className="text-white/80 text-xs mt-1">
                {formatPublicKey(publicKey)}
              </Text>
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};
