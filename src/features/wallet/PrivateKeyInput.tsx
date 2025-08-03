import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useWallet } from '@/contexts/WalletContext';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

export const PrivateKeyInput: React.FC = () => {
  const { connectWithPrivateKey, connecting, connected } = useWallet();
  const [privateKey, setPrivateKey] = useState('3Pv9tZo1W9LZp4RsJLPJpKunuMoBEB7S35vMq7GXKNRswJ2CTPPJSE95oiHf27Trx2zCxvVJ7sWid9HX54TJW73H');
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const validatePrivateKey = (key: string): boolean => {
    try {
      // Try to decode as base58 first (standard Solana format)
      try {
        const keyBytes = bs58.decode(key);
        if (keyBytes.length === 64) {
          Keypair.fromSecretKey(keyBytes);
          return true;
        }
      } catch {}

      // Fallback: try base64 format
      try {
        const keyBytes = Buffer.from(key, 'base64');
        if (keyBytes.length === 64) {
          Keypair.fromSecretKey(keyBytes);
          return true;
        }
      } catch {}

      return false;
    } catch {
      return false;
    }
  };

  const handleConnect = async () => {
    console.log('🔑 Connecting with private key:', privateKey.slice(0, 10) + '...');
    
    if (!privateKey.trim()) {
      Alert.alert('Error', 'Please enter your private key');
      return;
    }

    if (!validatePrivateKey(privateKey.trim())) {
      Alert.alert(
        'Invalid Private Key',
        'Please enter a valid Solana private key (base58 or base64 format)'
      );
      return;
    }

    try {
      await connectWithPrivateKey(privateKey.trim());
    //   setPrivateKey(''); // Clear the private key from state for security
    } catch (error) {
      console.error('Private key connection failed:', error);
    }
  };

  const generateTestWallet = () => {
    Alert.alert(
      'Generate Test Wallet',
      'This will create a new test wallet with 0 SOL. You can request airdrop on devnet.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: () => {
            const newKeypair = Keypair.generate();
            const privateKeyBase64 = Buffer.from(newKeypair.secretKey).toString('base64');
            setPrivateKey(privateKeyBase64);
            
            Alert.alert(
              'Test Wallet Generated',
              `Public Key: ${newKeypair.publicKey.toBase58()}\n\nPrivate key has been filled in. Tap "Connect with Private Key" to connect.`,
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  if (connected) {
    return null; // Don't show if already connected
  }

  return (
    <View className="bg-white rounded-xl p-4 mx-4 mb-4 shadow-sm">
      <Text className="text-lg font-semibold text-gray-800 mb-2">
        Connect with Private Key
      </Text>
      
      <Text className="text-sm text-gray-600 mb-4">
        Enter your Solana private key (base58 or base64 format) for direct transaction signing (devnet only)
      </Text>

      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Private Key (Base58/Base64)
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-3 text-sm bg-gray-50"
          value={privateKey}
          onChangeText={setPrivateKey}
          placeholder="Enter your private key..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          secureTextEntry={!showPrivateKey}
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TouchableOpacity
          onPress={() => setShowPrivateKey(!showPrivateKey)}
          className="mt-2"
        >
          <Text className="text-blue-600 text-sm">
            {showPrivateKey ? 'Hide' : 'Show'} Private Key
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={handleConnect}
          disabled={connecting || !privateKey.trim()}
          className={`flex-1 py-3 px-4 rounded-lg ${
            connecting || !privateKey.trim()
              ? 'bg-gray-300'
              : 'bg-blue-600'
          }`}
        >
          {connecting ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="text-white font-medium text-center">
              Connect with Private Key
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={generateTestWallet}
          className="py-3 px-4 bg-green-600 rounded-lg"
        >
          <Text className="text-white font-medium text-center">
            Generate Test Wallet
          </Text>
        </TouchableOpacity>
      </View>

      <View className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
        <Text className="text-xs text-yellow-800">
          ⚠️ <Text className="font-medium">Security Warning:</Text> Only use this for testing on devnet. 
          Never enter your mainnet private keys in any application.
        </Text>
      </View>
    </View>
  );
};
