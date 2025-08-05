import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useWallet } from '@/contexts/WalletContext';
import { PublicKey } from '@solana/web3.js';
import { solanaService } from '@/services/solanaService';
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
      <View className="bg-amber-50 rounded-xl p-4 mx-4 shadow-sm border border-amber-200">
        <Text className="text-xl font-semibold text-amber-900 mb-1">Wallet Testing</Text>
        <Text className="text-center text-amber-800 text-base p-5">
          Connect your wallet to run tests
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-amber-50 rounded-xl p-4 mx-4 shadow-lg border border-amber-200">
      <Text className="text-xl font-semibold text-amber-900 mb-1">Wallet Testing</Text>
      <Text className="text-sm text-amber-700 mb-4">Test your Phantom wallet integration</Text>
      
      <View className="gap-3 mb-4">
        <TouchableOpacity
          className="bg-orange-500 p-3.5 rounded-lg items-center"
          onPress={testDevnetConnection}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="text-white text-base font-semibold">Test Devnet Connection</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-orange-500 p-3.5 rounded-lg items-center"
          onPress={testWalletConnection}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="text-white text-base font-semibold">Test Wallet Functions</Text>
          )}
        </TouchableOpacity>
      </View>

      <View className="bg-blue-50 p-3 rounded-lg border-l-4 border-l-blue-500">
        <Text className="text-sm font-semibold text-blue-700 mb-2">Testing Instructions:</Text>
        <Text className="text-sm text-amber-900 leading-5">
          {isWeb ? (
            `1. Make sure you have Phantom browser extension installed${'\n'}2. Switch to Devnet in Phantom settings${'\n'}3. Get some devnet SOL from a faucet${'\n'}4. Run the tests above to verify integration`
          ) : (
            `1. Make sure you have Phantom wallet installed${'\n'}2. Switch to Devnet in Phantom settings${'\n'}3. Get some devnet SOL from a faucet${'\n'}4. Run the tests above to verify integration`
          )}
        </Text>
      </View>
    </View>
  );
};
