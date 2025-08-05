import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useWallet } from '@/contexts/WalletContext';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

export const PrivateKeyInput: React.FC = () => {
  const { connectWithPrivateKey, connecting, connected } = useWallet();
  const [privateKey, setPrivateKey] = useState('3Pv9tZo1W9LZp4RsJLPJpKunuMoBEB7S35vMq7GXKNRswJ2CTPPJSE95oiHf27Trx2zCxvVJ7sWid9HX54TJW73H');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showModal, setShowModal] = useState(false);

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
      setShowModal(false); // Close modal on successful connection
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
    <View className="border-t border-accent-amber/30">
      <Text className="text-sm font-semibold text-neutral-light mb-1">
        Development Access
      </Text>
      
      {/* Simple Button to Open Modal */}
      <TouchableOpacity 
        className="px-4 py-1.5 bg-white rounded-xl mx-4 shadow-md"
        onPress={() => setShowModal(true)}
        activeOpacity={0.7}
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-2">
            <Ionicons name="key" size={20} color="#007AFF" />
            <Text className="text-base font-semibold text-gray-900">
              Private Key Connect
            </Text>
          </View>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color="#8E8E93" 
          />
        </View>
      </TouchableOpacity>
      

      {/* Modal */}
      <Modal
        visible={showModal}
        // animationType="slide"
        // presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-surface-primary">
          <View className="flex-row justify-between items-center px-5 py-4 bg-surface-secondary border-b border-accent-amber/20">
            <Text className="text-xl font-bold text-neutral-light">
              Private Key Connect
            </Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text className="text-base text-accent-gold font-semibold">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-1 p-5">
            <Text className="text-sm text-neutral-medium mb-4 leading-5">
              Enter your Solana private key for direct transaction signing (devnet only)
            </Text>

            <View className="mb-4">
              <Text className="text-sm font-medium text-neutral-light mb-2">
                Private Key (Base58/Base64)
              </Text>
              <View className="relative">
                <TextInput
                  className="border border-accent-amber/40 rounded-xl px-4 py-3 pr-12 text-sm bg-surface-secondary text-neutral-light min-h-20"
                  value={privateKey}
                  onChangeText={setPrivateKey}
                  placeholder="Enter your private key..."
                  placeholderTextColor="#8B7355"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  secureTextEntry={!showPrivateKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  className="absolute right-3 top-3 p-1"
                  onPress={() => setShowPrivateKey(!showPrivateKey)}
                >
                  <Ionicons 
                    name={showPrivateKey ? "eye-off" : "eye"} 
                    size={20} 
                    color="#8B7355" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View className="flex-row gap-3 mb-4">
              <TouchableOpacity
                onPress={generateTestWallet}
                className="flex-1 rounded-xl shadow-sm"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#E49B3F', '#D97539']}
                  className="py-3 px-4 rounded-xl flex-row items-center justify-center gap-1.5 min-h-12"
                >
                  <>
                    <Ionicons name="add-circle" size={18} color="white" />
                    <Text className="text-white text-base font-semibold">Generate</Text>
                  </>
                </LinearGradient>
              </TouchableOpacity>


              <TouchableOpacity
                onPress={handleConnect}
                disabled={connecting || !privateKey.trim()}
                className="flex-1 rounded-xl shadow-sm"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    (!privateKey.trim() || connecting) 
                      ? ['#8B7355', '#8B7355'] 
                      : ['#D97539', '#B85C38']
                  }
                  className="py-3 px-4 rounded-xl flex-row items-center justify-center gap-1.5 min-h-12"
                >
                  {connecting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Ionicons name="log-in" size={18} color="white" />
                      <Text className="text-white text-base font-semibold">Connect</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View className="bg-yellow-50 rounded-xl p-3 flex-row items-start gap-2 border border-yellow-200">
              <Ionicons name="warning" size={16} color="#FF9500" />
              <Text className="flex-1 text-xs text-yellow-800 leading-4">
                <Text className="font-semibold">Security Warning:</Text> Only use this for testing on devnet. 
                Never enter mainnet private keys.
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};
