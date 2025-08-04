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
      <TouchableOpacity
        style={styles.connectedButton}
        onPress={handlePress}
        disabled={connecting}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#34C759', '#30D158']}
          style={styles.gradientButton}
        >
          <View style={styles.connectedContent}>
            <Ionicons name="checkmark-circle" size={16} color="white" />
            <Text style={styles.connectedText}>
              {formatPublicKey(publicKey)}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handlePress}
      disabled={connecting}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['#007AFF', '#0056CC']}
        style={styles.gradientButton}
      >
        <View style={styles.buttonContent}>
          {connecting ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons name="wallet" size={18} color="white" />
              <Text style={styles.buttonText}>Connect</Text>
            </>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  connectedButton: {
    borderRadius: 12,
    shadowColor: '#34C759',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  gradientButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  connectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  connectedText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});
