import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useWallet } from '@/contexts/WalletContext';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

export const PrivateKeyInput: React.FC = () => {
  const { connectWithPrivateKey, connecting, connected } = useWallet();
  const [privateKey, setPrivateKey] = useState('3Pv9tZo1W9LZp4RsJLPJpKunuMoBEB7S35vMq7GXKNRswJ2CTPPJSE95oiHf27Trx2zCxvVJ7sWid9HX54TJW73H');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

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
    <View className="border-t border-accent-amber/30 pt-2 mt-4">
      <Text className="text-sm font-semibold text-neutral-light mb-2">
        Development Access
      </Text>
    
    <View style={styles.container} >
      
      
      {/* Collapsible Header */}
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="key" size={20} color="#007AFF" />
            <Text style={styles.headerTitle}>Private Key Connect</Text>
          </View>
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#8E8E93" 
          />
        </View>
      </TouchableOpacity>

      {/* Expandable Content */}
      {isExpanded && (
        <View style={styles.content}>
          <Text style={styles.description}>
            Enter your Solana private key for direct transaction signing (devnet only)
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              Private Key (Base58/Base64)
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={privateKey}
                onChangeText={setPrivateKey}
                placeholder="Enter your private key..."
                placeholderTextColor="#C7C7CC"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                secureTextEntry={!showPrivateKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.showHideButton}
                onPress={() => setShowPrivateKey(!showPrivateKey)}
              >
                <Ionicons 
                  name={showPrivateKey ? "eye-off" : "eye"} 
                  size={20} 
                  color="#8E8E93" 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleConnect}
              disabled={connecting || !privateKey.trim()}
              style={[
                styles.button,
                (!privateKey.trim() || connecting) && styles.buttonDisabled
              ]}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  (!privateKey.trim() || connecting) 
                    ? ['#E5E5EA', '#E5E5EA'] 
                    : ['#007AFF', '#0056CC']
                }
                style={styles.gradientButton}
              >
                {connecting ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Ionicons name="log-in" size={18} color="white" />
                    <Text style={styles.buttonText}>Connect</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={generateTestWallet}
              style={styles.button}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#34C759', '#30D158']}
                style={styles.gradientButton}
              >
                <Ionicons name="add-circle" size={18} color="white" />
                <Text style={styles.buttonText}>Generate</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.warningContainer}>
            <Ionicons name="warning" size={16} color="#FF9500" />
            <Text style={styles.warningText}>
              <Text style={styles.warningBold}>Security Warning:</Text> Only use this for testing on devnet. 
              Never enter mainnet private keys.
            </Text>
          </View>
        </View>
      )}
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 48,
    fontSize: 14,
    backgroundColor: '#F2F2F7',
    color: '#1C1C1E',
    minHeight: 80,
  },
  showHideButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  gradientButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  warningContainer: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#8B6914',
    lineHeight: 16,
  },
  warningBold: {
    fontWeight: '600',
  },
});
