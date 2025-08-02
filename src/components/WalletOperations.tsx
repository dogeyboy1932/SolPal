import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useWallet } from '@/contexts/WalletContext';
import { solanaService } from '@/services/SolanaService';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import Toast from 'react-native-toast-message';

interface WalletOperation {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'airdrop' | 'account_info' | 'token_accounts' | 'validate_address' | 'export_key';
}

const WALLET_OPERATIONS: WalletOperation[] = [
  {
    id: 'airdrop',
    name: 'Request Devnet Airdrop',
    description: 'Get 1 SOL from devnet faucet',
    icon: '💰',
    type: 'airdrop'
  },
  {
    id: 'account_info',
    name: 'Account Information',
    description: 'View detailed account information',
    icon: 'ℹ️',
    type: 'account_info'
  },
  {
    id: 'token_accounts',
    name: 'Token Accounts',
    description: 'View all token accounts',
    icon: '🪙',
    type: 'token_accounts'
  },
  {
    id: 'validate_address',
    name: 'Validate Address',
    description: 'Check if an address is valid',
    icon: '✅',
    type: 'validate_address'
  },
  {
    id: 'export_key',
    name: 'Export Public Key',
    description: 'Copy public key to clipboard',
    icon: '📋',
    type: 'export_key'
  }
];

export const WalletOperations: React.FC = () => {
  const { connected, publicKey, signAndSendTransaction } = useWallet();
  const [selectedOperation, setSelectedOperation] = useState<WalletOperation | null>(null);
  const [loading, setLoading] = useState(false);
  const [addressToValidate, setAddressToValidate] = useState('');
  const [operationResult, setOperationResult] = useState<any>(null);

  const executeOperation = async (operation: WalletOperation) => {
    if (!connected || !publicKey) {
      Alert.alert('Error', 'Wallet not connected');
      return;
    }

    setLoading(true);
    setSelectedOperation(operation);
    setOperationResult(null);

    try {
      switch (operation.type) {
        case 'airdrop':
          await executeAirdrop();
          break;
        case 'account_info':
          await getAccountInfo();
          break;
        case 'token_accounts':
          await getTokenAccounts();
          break;
        case 'validate_address':
          // This will be handled in UI
          break;
        case 'export_key':
          await exportPublicKey();
          break;
      }
    } catch (error) {
      console.error('Operation error:', error);
      Toast.show({
        type: 'error',
        text1: 'Operation Failed',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  const executeAirdrop = async () => {
    try {
      const pubKey = new PublicKey(publicKey!);
      const signature = await solanaService.requestAirdrop(pubKey, 1 * LAMPORTS_PER_SOL);
      
      setOperationResult({
        type: 'airdrop',
        signature,
        amount: 1,
        message: 'Airdrop request successful!'
      });

      Toast.show({
        type: 'success',
        text1: 'Airdrop Requested',
        text2: '1 SOL has been requested from devnet faucet',
      });
    } catch (error) {
      throw new Error('Failed to request airdrop. You may have reached the daily limit.');
    }
  };

  const getAccountInfo = async () => {
    try {
      const pubKey = new PublicKey(publicKey!);
      const accountInfo = await solanaService.getAccountInfo(pubKey);
      
      setOperationResult({
        type: 'account_info',
        data: {
          address: publicKey,
          balance: accountInfo.balance / LAMPORTS_PER_SOL,
          owner: accountInfo.owner?.toString() || 'System Program',
          executable: accountInfo.executable,
          rentEpoch: accountInfo.rentEpoch,
          dataSize: accountInfo.data?.length || 0
        }
      });
    } catch (error) {
      throw new Error('Failed to fetch account information');
    }
  };

  const getTokenAccounts = async () => {
    try {
      const pubKey = new PublicKey(publicKey!);
      const tokenAccounts = await solanaService.getTokenAccounts(pubKey);
      
      setOperationResult({
        type: 'token_accounts',
        data: tokenAccounts.map(account => ({
          mint: account.mint.toString(),
          balance: account.balance,
          decimals: account.decimals,
          address: account.address
        }))
      });
    } catch (error) {
      throw new Error('Failed to fetch token accounts');
    }
  };

  const exportPublicKey = async () => {
    try {
      // In React Native, we'd use Clipboard API
      // For now, just show the key
      setOperationResult({
        type: 'export_key',
        data: {
          publicKey: publicKey!,
          message: 'Public key ready to copy'
        }
      });

      Toast.show({
        type: 'success',
        text1: 'Public Key',
        text2: 'Public key displayed below',
      });
    } catch (error) {
      throw new Error('Failed to export public key');
    }
  };

  const validateAddress = () => {
    if (!addressToValidate.trim()) {
      Alert.alert('Error', 'Please enter an address to validate');
      return;
    }

    try {
      const pubKey = new PublicKey(addressToValidate);
      setOperationResult({
        type: 'validate_address',
        data: {
          address: addressToValidate,
          isValid: true,
          publicKey: pubKey.toString()
        }
      });

      Toast.show({
        type: 'success',
        text1: 'Valid Address',
        text2: 'The address is a valid Solana public key',
      });
    } catch (error) {
      setOperationResult({
        type: 'validate_address',
        data: {
          address: addressToValidate,
          isValid: false,
          error: 'Invalid Solana public key format'
        }
      });

      Toast.show({
        type: 'error',
        text1: 'Invalid Address',
        text2: 'The address is not a valid Solana public key',
      });
    }
  };

  const clearResult = () => {
    setOperationResult(null);
    setSelectedOperation(null);
    setAddressToValidate('');
  };

  const renderOperationResult = () => {
    if (!operationResult) return null;

    switch (operationResult.type) {
      case 'airdrop':
        return (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Airdrop Result</Text>
            <Text style={styles.resultText}>Amount: {operationResult.amount} SOL</Text>
            <Text style={styles.resultText}>Signature: {operationResult.signature}</Text>
            <Text style={styles.successText}>{operationResult.message}</Text>
          </View>
        );

      case 'account_info':
        const { data } = operationResult;
        return (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Account Information</Text>
            <Text style={styles.resultText}>Address: {data.address}</Text>
            <Text style={styles.resultText}>Balance: {data.balance} SOL</Text>
            <Text style={styles.resultText}>Owner: {data.owner}</Text>
            <Text style={styles.resultText}>Executable: {data.executable ? 'Yes' : 'No'}</Text>
            <Text style={styles.resultText}>Rent Epoch: {data.rentEpoch}</Text>
            <Text style={styles.resultText}>Data Size: {data.dataSize} bytes</Text>
          </View>
        );

      case 'token_accounts':
        return (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Token Accounts ({operationResult.data.length})</Text>
            {operationResult.data.length === 0 ? (
              <Text style={styles.resultText}>No token accounts found</Text>
            ) : (
              operationResult.data.map((account: any, index: number) => (
                <View key={index} style={styles.tokenAccount}>
                  <Text style={styles.tokenMint}>Mint: {account.mint.slice(0, 20)}...</Text>
                  <Text style={styles.resultText}>Balance: {account.balance}</Text>
                  <Text style={styles.resultText}>Decimals: {account.decimals}</Text>
                </View>
              ))
            )}
          </View>
        );

      case 'validate_address':
        return (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Address Validation</Text>
            <Text style={styles.resultText}>Address: {operationResult.data.address}</Text>
            <Text style={[
              styles.resultText,
              { color: operationResult.data.isValid ? '#10b981' : '#ef4444' }
            ]}>
              Status: {operationResult.data.isValid ? 'Valid' : 'Invalid'}
            </Text>
            {operationResult.data.error && (
              <Text style={styles.errorText}>{operationResult.data.error}</Text>
            )}
          </View>
        );

      case 'export_key':
        return (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Public Key Export</Text>
            <Text style={styles.resultText}>{operationResult.data.message}</Text>
            <View style={styles.keyContainer}>
              <Text style={styles.keyText}>{operationResult.data.publicKey}</Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  if (!connected) {
    return (
      <View style={styles.container}>
        <Text style={styles.notConnectedText}>
          Please connect your wallet to access wallet operations
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Wallet Operations</Text>
      <Text style={styles.subtitle}>
        Advanced wallet management and utility functions
      </Text>

      {/* Operations Grid */}
      <View style={styles.operationsGrid}>
        {WALLET_OPERATIONS.map((operation) => (
          <TouchableOpacity
            key={operation.id}
            style={[
              styles.operationCard,
              selectedOperation?.id === operation.id && styles.selectedCard
            ]}
            onPress={() => executeOperation(operation)}
            disabled={loading}
          >
            <Text style={styles.operationIcon}>{operation.icon}</Text>
            <Text style={styles.operationName}>{operation.name}</Text>
            <Text style={styles.operationDescription}>{operation.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Address Validation Input */}
      <View style={styles.validationSection}>
        <Text style={styles.sectionTitle}>Address Validation</Text>
        <TextInput
          style={styles.addressInput}
          value={addressToValidate}
          onChangeText={setAddressToValidate}
          placeholder="Enter Solana address to validate"
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          style={styles.validateButton}
          onPress={validateAddress}
          disabled={loading}
        >
          <Text style={styles.validateButtonText}>Validate Address</Text>
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>
            Executing {selectedOperation?.name}...
          </Text>
        </View>
      )}

      {/* Operation Result */}
      {renderOperationResult()}

      {/* Clear Result Button */}
      {operationResult && (
        <TouchableOpacity style={styles.clearButton} onPress={clearResult}>
          <Text style={styles.clearButtonText}>Clear Result</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  operationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  operationCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  operationIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  operationName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  operationDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  validationSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  addressInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  validateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  validateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  resultContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
    lineHeight: 20,
  },
  successText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 4,
  },
  tokenAccount: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  tokenMint: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  keyContainer: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  keyText: {
    fontSize: 12,
    color: '#333',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  clearButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  clearButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  notConnectedText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    padding: 40,
  },
});
