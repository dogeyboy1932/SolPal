import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useWallet } from '@/contexts/WalletContext';
import { solanaService } from '@/services/solanaService';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import Toast from 'react-native-toast-message';

interface TransactionTemplate {
  id: string;
  name: string;
  description: string;
  type: 'transfer_sol' | 'transfer_spl' | 'airdrop' | 'custom';
  defaultAmount?: number;
  defaultRecipient?: string;
  defaultMint?: string;
}

const PREDEFINED_TEMPLATES: TransactionTemplate[] = [
  {
    id: 'quick_sol_transfer',
    name: 'Quick SOL Transfer',
    description: 'Send 0.1 SOL to a recipient',
    type: 'transfer_sol',
    defaultAmount: 0.1,
  },
  {
    id: 'micro_payment',
    name: 'Micro Payment',
    description: 'Send 0.01 SOL for small payments',
    type: 'transfer_sol',
    defaultAmount: 0.01,
  },
  {
    id: 'standard_payment',
    name: 'Standard Payment',
    description: 'Send 1 SOL for regular transactions',
    type: 'transfer_sol',
    defaultAmount: 1.0,
  },
  {
    id: 'request_airdrop',
    name: 'Request Devnet Airdrop',
    description: 'Request 1 SOL from devnet faucet',
    type: 'airdrop',
    defaultAmount: 1.0,
  },
  {
    id: 'usdc_transfer',
    name: 'USDC Transfer',
    description: 'Transfer USDC tokens',
    type: 'transfer_spl',
    defaultMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC mainnet mint
  },
];

export const TransactionTemplates: React.FC = () => {
  const { connected, publicKey, signAndSendTransaction } = useWallet();
  const [selectedTemplate, setSelectedTemplate] = useState<TransactionTemplate | null>(null);
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [mintAddress, setMintAddress] = useState('');
  const [executing, setExecuting] = useState(false);

  const selectTemplate = (template: TransactionTemplate) => {
    setSelectedTemplate(template);
    setAmount(template.defaultAmount?.toString() || '');
    setRecipient(template.defaultRecipient || '');
    setMintAddress(template.defaultMint || '');
  };

  const clearTemplate = () => {
    setSelectedTemplate(null);
    setAmount('');
    setRecipient('');
    setMintAddress('');
  };

  const executeTemplate = async () => {
    if (!selectedTemplate || !publicKey) return;

    setExecuting(true);
    try {
      switch (selectedTemplate.type) {
        case 'transfer_sol':
          await executeSOLTransfer();
          break;
        case 'transfer_spl':
          await executeSPLTransfer();
          break;
        case 'airdrop':
          await executeAirdrop();
          break;
        default:
          throw new Error('Unsupported template type');
      }

      Toast.show({
        type: 'success',
        text1: 'Template Executed',
        text2: `${selectedTemplate.name} completed successfully`,
      });
      clearTemplate();
    } catch (error) {
      console.error('Template execution error:', error);
      Toast.show({
        type: 'error',
        text1: 'Template Failed',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setExecuting(false);
    }
  };

  const executeSOLTransfer = async () => {
    if (!recipient || !amount) {
      throw new Error('Recipient and amount are required');
    }

    const recipientKey = new PublicKey(recipient);
    const amountInLamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);
    
    const transaction = await solanaService.createTransferTransaction(
      new PublicKey(publicKey!),
      recipientKey,
      parseFloat(amount)
    );

    await signAndSendTransaction(transaction);
  };

  const executeSPLTransfer = async () => {
    if (!recipient || !amount || !mintAddress) {
      throw new Error('Recipient, amount, and mint address are required');
    }

    const recipientKey = new PublicKey(recipient);
    const mintKey = new PublicKey(mintAddress);
    const transferAmount = parseFloat(amount);
    
    const transaction = await solanaService.createSPLTransferTransaction(
      new PublicKey(publicKey!),
      recipientKey,
      mintKey,
      transferAmount
    );

    await signAndSendTransaction(transaction);
  };

  const executeAirdrop = async () => {
    if (!amount) {
      throw new Error('Amount is required');
    }

    const amountInLamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);
    await solanaService.requestAirdrop(new PublicKey(publicKey!), amountInLamports);
  };

  const validateTemplate = (): string | null => {
    if (!selectedTemplate) return 'No template selected';
    
    switch (selectedTemplate.type) {
      case 'transfer_sol':
      case 'transfer_spl':
        if (!recipient) return 'Recipient address is required';
        if (!amount || parseFloat(amount) <= 0) return 'Valid amount is required';
        if (selectedTemplate.type === 'transfer_spl' && !mintAddress) {
          return 'Token mint address is required';
        }
        break;
      case 'airdrop':
        if (!amount || parseFloat(amount) <= 0) return 'Valid amount is required';
        break;
    }
    
    return null;
  };

  if (!connected) {
    return (
      <View className="bg-amber-50 rounded-xl p-4 mx-4 shadow-sm border border-gray-200">
        <Text className="text-center text-amber-800 text-base p-5">
          Please connect your wallet to use transaction templates
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 h-full">
      <Text className="text-xl font-semibold text-amber-900 mb-1">Transaction Templates</Text>
      <Text className="text-sm text-amber-700 mb-4">
        Quick access to common transaction patterns
      </Text>

      {!selectedTemplate ? (
        <ScrollView className="" showsVerticalScrollIndicator={false}>
          {PREDEFINED_TEMPLATES.map((template) => (
            <TouchableOpacity
              key={template.id}
              className="border border-gray-200 rounded-lg p-4 mb-3"
              onPress={() => selectTemplate(template)}
            >
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-base font-semibold text-amber-900 flex-1">{template.name}</Text>
                <View className="px-2 py-1 rounded-xl ml-2" style={{ backgroundColor: getTypeColor(template.type) }}>
                  <Text className="text-xs text-white font-semibold">{template.type.replace('_', ' ').toUpperCase()}</Text>
                </View>
              </View>
              <Text className="text-sm text-amber-700 mb-1">{template.description}</Text>
              {template.defaultAmount && (
                <Text className="text-xs text-amber-600 italic">
                  Default Amount: {template.defaultAmount} {template.type === 'transfer_spl' ? 'tokens' : 'SOL'}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View className="flex-1">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-lg font-semibold text-amber-900 flex-1">{selectedTemplate.name}</Text>
            <TouchableOpacity className="p-1" onPress={clearTemplate}>
              <Text className="text-lg text-amber-600">✕</Text>
            </TouchableOpacity>
          </View>
          
          <Text className="text-sm text-amber-700 mb-5">
            {selectedTemplate.description}
          </Text>

          <View className="mb-5">
            {(selectedTemplate.type === 'transfer_sol' || selectedTemplate.type === 'transfer_spl') && (
              <View className="mb-4">
                <Text className="text-sm font-medium text-amber-900 mb-1.5">Recipient Address</Text>
                <TextInput
                  className="border border-gray-200 rounded-lg p-3 text-base bg-white text-amber-900"
                  value={recipient}
                  onChangeText={setRecipient}
                  placeholder="Enter recipient's public key"
                  placeholderTextColor="#92400e"
                />
              </View>
            )}

            <View className="mb-4">
              <Text className="text-sm font-medium text-amber-900 mb-1.5">
                Amount {selectedTemplate.type === 'transfer_spl' ? '(tokens)' : '(SOL)'}
              </Text>
              <TextInput
                className="border border-gray-200 rounded-lg p-3 text-base bg-white text-amber-900"
                value={amount}
                onChangeText={setAmount}
                placeholder="0.0"
                keyboardType="numeric"
                placeholderTextColor="#92400e"
              />
            </View>

            {selectedTemplate.type === 'transfer_spl' && (
              <View className="mb-4">
                <Text className="text-sm font-medium text-amber-900 mb-1.5">Token Mint Address</Text>
                <TextInput
                  className="border border-gray-200 rounded-lg p-3 text-base bg-white text-amber-900"
                  value={mintAddress}
                  onChangeText={setMintAddress}
                  placeholder="Enter token mint address"
                  placeholderTextColor="#92400e"
                />
              </View>
            )}
          </View>

          <TouchableOpacity
            className={`rounded-lg p-4 items-center mb-3 ${
              (executing || validateTemplate()) ? 'bg-gray-400' : 'bg-orange-500'
            }`}
            onPress={executeTemplate}
            disabled={executing || !!validateTemplate()}
          >
            {executing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-white text-base font-semibold">Execute Template</Text>
            )}
          </TouchableOpacity>

          {validateTemplate() && (
            <Text className="text-red-500 text-sm text-center">{validateTemplate()}</Text>
          )}
        </View>
      )}
    </View>
  );
};

const getTypeColor = (type: string): string => {
  switch (type) {
    case 'transfer_sol':
      return '#E49B3F';
    case 'transfer_spl':
      return '#10b981';
    case 'airdrop':
      return '#f59e0b';
    default:
      return '#92400e';
  }
};
