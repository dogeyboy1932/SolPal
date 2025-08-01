import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
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
      style={[
        styles.button,
        connected ? styles.connectedButton : styles.disconnectedButton,
      ]}
      onPress={handlePress}
      disabled={connecting}
    >
      <View style={styles.buttonContent}>
        {connecting ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <Text style={styles.buttonText}>
              {connected ? 'Disconnect' : 'Connect Wallet'}
            </Text>
            {connected && publicKey && (
              <Text style={styles.addressText}>
                {formatPublicKey(publicKey)}
              </Text>
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  connectedButton: {
    backgroundColor: '#10b981',
  },
  disconnectedButton: {
    backgroundColor: '#3b82f6',
  },
  buttonContent: {
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  addressText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 4,
  },
});
