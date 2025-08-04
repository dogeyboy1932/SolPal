import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
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
      <View style={styles.container}>
        <Text style={styles.notConnectedText}>
          Please connect your wallet to use transaction templates
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transaction Templates</Text>
      <Text style={styles.subtitle}>
        Quick access to common transaction patterns
      </Text>

      {!selectedTemplate ? (
        <ScrollView style={styles.templatesList} showsVerticalScrollIndicator={false}>
          {PREDEFINED_TEMPLATES.map((template) => (
            <TouchableOpacity
              key={template.id}
              style={styles.templateCard}
              onPress={() => selectTemplate(template)}
            >
              <View style={styles.templateHeader}>
                <Text style={styles.templateName}>{template.name}</Text>
                <View style={[styles.typeBadge, { backgroundColor: getTypeColor(template.type) }]}>
                  <Text style={styles.typeText}>{template.type.replace('_', ' ').toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.templateDescription}>{template.description}</Text>
              {template.defaultAmount && (
                <Text style={styles.templateDetails}>
                  Default Amount: {template.defaultAmount} {template.type === 'transfer_spl' ? 'tokens' : 'SOL'}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.executionContainer}>
          <View style={styles.selectedTemplateHeader}>
            <Text style={styles.selectedTemplateName}>{selectedTemplate.name}</Text>
            <TouchableOpacity onPress={clearTemplate} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.selectedTemplateDescription}>
            {selectedTemplate.description}
          </Text>

          <View style={styles.inputContainer}>
            {(selectedTemplate.type === 'transfer_sol' || selectedTemplate.type === 'transfer_spl') && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Recipient Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={recipient}
                  onChangeText={setRecipient}
                  placeholder="Enter recipient's public key"
                  placeholderTextColor="#6b7280"
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                Amount {selectedTemplate.type === 'transfer_spl' ? '(tokens)' : '(SOL)'}
              </Text>
              <TextInput
                style={styles.textInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.0"
                keyboardType="numeric"
                placeholderTextColor="#6b7280"
              />
            </View>

            {selectedTemplate.type === 'transfer_spl' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Token Mint Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={mintAddress}
                  onChangeText={setMintAddress}
                  placeholder="Enter token mint address"
                  placeholderTextColor="#6b7280"
                />
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.executeButton,
              (executing || validateTemplate()) && styles.disabledButton
            ]}
            onPress={executeTemplate}
            disabled={executing || !!validateTemplate()}
          >
            {executing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.executeButtonText}>Execute Template</Text>
            )}
          </TouchableOpacity>

          {validateTemplate() && (
            <Text style={styles.validationError}>{validateTemplate()}</Text>
          )}
        </View>
      )}
    </View>
  );
};

const getTypeColor = (type: string): string => {
  switch (type) {
    case 'transfer_sol':
      return '#3b82f6';
    case 'transfer_spl':
      return '#10b981';
    case 'airdrop':
      return '#f59e0b';
    default:
      return '#6b7280';
  }
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
  templatesList: {
    maxHeight: 400,
  },
  templateCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  typeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  templateDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  templateDetails: {
    fontSize: 12,
    color: '#374151',
    fontStyle: 'italic',
  },
  executionContainer: {
    flex: 1,
  },
  selectedTemplateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedTemplateName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 18,
    color: '#6b7280',
  },
  selectedTemplateDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    color: '#374151',
  },
  executeButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  executeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  validationError: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
  },
  notConnectedText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    padding: 20,
  },
});
