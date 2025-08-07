import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useWallet } from '@/contexts/WalletContext';
import { solanaService } from '@/services/solanaService';
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
          <View className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <Text className="text-lg font-semibold text-green-800 mb-2">Airdrop Result</Text>
            <Text className="text-sm text-green-700 mb-1">Amount: {operationResult.amount} SOL</Text>
            <Text className="text-sm text-green-700 mb-1">Signature: {operationResult.signature}</Text>
            <Text className="text-sm text-green-600 font-medium">{operationResult.message}</Text>
          </View>
        );

      case 'account_info':
        const { data } = operationResult;
        return (
          <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <Text className="text-lg font-semibold text-blue-800 mb-2">Account Information</Text>
            <Text className="text-sm text-blue-700 mb-1">Address: {data.address}</Text>
            <Text className="text-sm text-blue-700 mb-1">Balance: {data.balance} SOL</Text>
            <Text className="text-sm text-blue-700 mb-1">Executable: {data.executable ? 'Yes' : 'No'}</Text>
            <Text className="text-sm text-blue-700 mb-1">Rent Epoch: {data.rentEpoch}</Text>
          </View>
        );

      case 'token_accounts':
        return (
          <View className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
            <Text className="text-lg font-semibold text-purple-800 mb-2">Token Accounts ({operationResult.data.length})</Text>
            {operationResult.data.length === 0 ? (
              <Text className="text-sm text-purple-700">No token accounts found</Text>
            ) : (
              operationResult.data.map((account: any, index: number) => (
                <View key={index} className="bg-purple-100 rounded p-3 mb-2">
                  <Text className="text-sm font-semibold text-purple-800 mb-1">Mint: {account.mint.slice(0, 20)}...</Text>
                  <Text className="text-sm text-purple-700">Balance: {account.balance}</Text>
                  <Text className="text-sm text-purple-700">Decimals: {account.decimals}</Text>
                </View>
              ))
            )}
          </View>
        );

      case 'validate_address':
        return (
          <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <Text className="text-lg font-semibold text-yellow-800 mb-2">Address Validation</Text>
            <Text className="text-sm text-yellow-700 mb-1">Address: {operationResult.data.address}</Text>
            <Text 
              className="text-sm font-medium mb-1"
              style={{ color: operationResult.data.isValid ? '#10b981' : '#ef4444' }}
            >
              Status: {operationResult.data.isValid ? 'Valid' : 'Invalid'}
            </Text>
            {operationResult.data.error && (
              <Text className="text-sm text-red-600">{operationResult.data.error}</Text>
            )}
          </View>
        );

      case 'export_key':
        return (
          <View className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
            <Text className="text-lg font-semibold text-indigo-800 mb-2">Public Key Export</Text>
            <Text className="text-sm text-indigo-700 mb-2">{operationResult.data.message}</Text>
            <View className="bg-indigo-100 rounded p-3">
              <Text className="text-xs font-mono text-indigo-800">{operationResult.data.publicKey}</Text>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  if (!connected) {
    return (
      <View className="flex-1 bg-amber-50">
        <Text className="text-center text-amber-800 text-base p-8">
          Please connect your wallet to access wallet operations
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-neutral-light p-4" showsVerticalScrollIndicator={false}>
      <Text className="text-2xl font-bold text-amber-900 mb-2">Wallet Operations</Text>
      <Text className="text-base text-amber-700 mb-6">
        Advanced wallet management and utility functions
      </Text>

      {/* Operations Grid */}
      <View className="grid grid-cols-3 grid-rows-2 gap-3 mb-6">
        {WALLET_OPERATIONS.map((operation) => (
          <TouchableOpacity
            key={operation.id}
            className={`flex-1 min-w-40% bg-white p-4 rounded-xl border-2 shadow-sm ${
              selectedOperation?.id === operation.id 
                ? 'border-orange-500 bg-orange-50' 
                : 'border-amber-200'
            }`}
            onPress={() => executeOperation(operation)}
            disabled={loading}
          >
            <Text className="text-2xl text-center mb-2">{operation.icon}</Text>
            <Text className="text-sm font-semibold text-amber-900 text-center mb-1">{operation.name}</Text>
            <Text className="text-xs text-amber-700 text-center">{operation.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Address Validation Input */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-amber-900 mb-3">Address Validation</Text>
        <TextInput
          className="bg-white border border-amber-200 rounded-lg p-3 mb-3 text-amber-900"
          value={addressToValidate}
          onChangeText={setAddressToValidate}
          placeholder="Enter Solana address to validate"
          placeholderTextColor="#92400e"
        />
        <TouchableOpacity
          className="bg-orange-500 p-3 rounded-lg items-center"
          onPress={validateAddress}
          disabled={loading}
        >
          <Text className="text-white font-semibold">Validate Address</Text>
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View className="items-center py-6">
          <ActivityIndicator size="large" color="#E49B3F" />
          <Text className="text-amber-700 mt-2 text-center">
            Executing {selectedOperation?.name}...
          </Text>
        </View>
      )}

      {/* Operation Result */}
      {renderOperationResult()}

      {/* Clear Result Button */}
      {operationResult && (
        <TouchableOpacity className="bg-gray-500 p-3 rounded-lg items-center mt-4" onPress={clearResult}>
          <Text className="text-white font-semibold">Clear Result</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};
