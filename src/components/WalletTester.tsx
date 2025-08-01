import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useWallet } from '@/contexts/WalletContext';
import { PublicKey } from '@solana/web3.js';
import { solanaService } from '@/services/SolanaService';
import { webWalletAdapter } from '@/services/WebWalletAdapter';
import Toast from 'react-native-toast-message';

const isWeb = Platform.OS === 'web';

export const WalletTester: React.FC = () => {
  const { connected, publicKey, signAndSendTransaction } = useWallet();
  const [testing, setTesting] = useState(false);

  // Test wallet connection by creating a minimal transaction
  const testWalletConnection = async () => {
    if (!connected || !publicKey) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    try {
      setTesting(true);

      // Test 1: Check if we can get account info
      const pubKey = new PublicKey(publicKey);
      const balance = await solanaService.getBalance(pubKey);
      
      Toast.show({
        type: 'success',
        text1: 'Wallet Test Passed',
        text2: `Balance: ${balance.toFixed(4)} SOL`,
      });

      // Test 2: Check if we can create a transaction (without sending)
      try {
        const testTransaction = await solanaService.createTransferTransaction(
          pubKey,
          pubKey, // Send to self
          0.001 // Very small amount
        );
        
        const fee = await solanaService.estimateTransactionFee(testTransaction);
        
        Toast.show({
          type: 'info',
          text1: 'Transaction Creation Test',
          text2: `Fee estimation: ${fee.toFixed(6)} SOL`,
        });

      } catch (error) {
        console.log('Transaction creation test failed (expected on some wallets):', error);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Test failed';
      
      Toast.show({
        type: 'error',
        text1: 'Wallet Test Failed',
        text2: errorMessage,
      });
    } finally {
      setTesting(false);
    }
  };

  const testDevnetConnection = async () => {
    try {
      setTesting(true);
      
      // Test connection to devnet
      const connection = solanaService['connection'];
      const slot = await connection.getSlot();
      const version = await connection.getVersion();
      
      Toast.show({
        type: 'success',
        text1: 'Devnet Connection Test',
        text2: `Slot: ${slot}, Version: ${version['solana-core']}`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Devnet test failed';
      
      Toast.show({
        type: 'error',
        text1: 'Devnet Test Failed',
        text2: errorMessage,
      });
    } finally {
      setTesting(false);
    }
  };

  if (!connected) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Wallet Testing</Text>
        <Text style={styles.notConnectedText}>
          Connect your wallet to run tests
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wallet Testing</Text>
      <Text style={styles.subtitle}>Test your Phantom wallet integration</Text>
      
      <View style={styles.testSection}>
        <TouchableOpacity
          style={styles.testButton}
          onPress={testDevnetConnection}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.testButtonText}>Test Devnet Connection</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={testWalletConnection}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.testButtonText}>Test Wallet Functions</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Testing Instructions:</Text>
        <Text style={styles.infoText}>
          {isWeb ? (
            `1. Make sure you have Phantom browser extension installed{'\n'}2. Switch to Devnet in Phantom settings{'\n'}3. Get some devnet SOL from a faucet{'\n'}4. Run the tests above to verify integration`
          ) : (
            `1. Make sure you have Phantom wallet installed{'\n'}2. Switch to Devnet in Phantom settings{'\n'}3. Get some devnet SOL from a faucet{'\n'}4. Run the tests above to verify integration`
          )}
        </Text>
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  testSection: {
    gap: 12,
    marginBottom: 16,
  },
  testButton: {
    backgroundColor: '#8b5cf6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0284c7',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  notConnectedText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    padding: 20,
  },
});
