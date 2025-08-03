import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useWallet } from '@/contexts/WalletContext';
import { solanaService } from '@/services/SolanaService';
import { PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL, TransactionInstruction } from '@solana/web3.js';
import Toast from 'react-native-toast-message';

interface InstructionTemplate {
  type: 'transfer' | 'create_account' | 'custom';
  name: string;
  description: string;
  icon: string;
}

const INSTRUCTION_TEMPLATES: InstructionTemplate[] = [
  {
    type: 'transfer',
    name: 'System Transfer',
    description: 'Transfer SOL between accounts',
    icon: '💸'
  },
  {
    type: 'create_account',
    name: 'Create Account',
    description: 'Create a new account on Solana',
    icon: '🆕'
  },
  {
    type: 'custom',
    name: 'Custom Instruction',
    description: 'Build custom instruction manually',
    icon: '⚙️'
  }
];

interface TransactionBuilder {
  instructions: TransactionInstruction[];
  feePayer?: PublicKey;
  recentBlockhash?: string;
}

export const TransactionBuilder: React.FC = () => {
  const { connected, publicKey, signAndSendTransaction } = useWallet();
  const [builder, setBuilder] = useState<TransactionBuilder>({
    instructions: []
  });
  const [activeTemplate, setActiveTemplate] = useState<InstructionTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form fields for different instruction types
  const [transferForm, setTransferForm] = useState({
    from: '',
    to: '',
    amount: ''
  });
  
  const [createAccountForm, setCreateAccountForm] = useState({
    newAccount: '',
    space: '',
    owner: ''
  });
  
  const [customForm, setCustomForm] = useState({
    programId: '',
    data: '',
    accounts: ''
  });

  const addInstruction = async (template: InstructionTemplate) => {
    try {
      let instruction: TransactionInstruction | null = null;

      switch (template.type) {
        case 'transfer':
          instruction = await createTransferInstruction();
          break;
        case 'create_account':
          instruction = await createAccountInstruction();
          break;
        case 'custom':
          instruction = await createCustomInstruction();
          break;
      }

      if (instruction) {
        setBuilder(prev => ({
          ...prev,
          instructions: [...prev.instructions, instruction!]
        }));
        
        Toast.show({
          type: 'success',
          text1: 'Instruction Added',
          text2: `${template.name} instruction added to transaction`,
        });
        
        clearForms();
        setActiveTemplate(null);
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add instruction');
    }
  };

  const createTransferInstruction = async (): Promise<TransactionInstruction> => {
    if (!transferForm.from || !transferForm.to || !transferForm.amount) {
      throw new Error('All transfer fields are required');
    }

    const fromPubkey = new PublicKey(transferForm.from);
    const toPubkey = new PublicKey(transferForm.to);
    const lamports = Math.round(parseFloat(transferForm.amount) * LAMPORTS_PER_SOL);

    return SystemProgram.transfer({
      fromPubkey,
      toPubkey,
      lamports
    });
  };

  const createAccountInstruction = async (): Promise<TransactionInstruction> => {
    if (!createAccountForm.newAccount || !createAccountForm.space) {
      throw new Error('New account address and space are required');
    }

    // This is a simplified example - in reality you'd need to handle account creation properly
    throw new Error('Account creation not fully implemented in this demo');
  };

  const createCustomInstruction = async (): Promise<TransactionInstruction> => {
    if (!customForm.programId) {
      throw new Error('Program ID is required for custom instructions');
    }

    // This is a simplified example for custom instructions
    throw new Error('Custom instructions not fully implemented in this demo');
  };

  const removeInstruction = (index: number) => {
    setBuilder(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  const buildAndExecuteTransaction = async () => {
    if (builder.instructions.length === 0) {
      Alert.alert('Error', 'Add at least one instruction to the transaction');
      return;
    }

    if (!publicKey) {
      Alert.alert('Error', 'Wallet not connected');
      return;
    }

    setLoading(true);
    try {
      const transaction = new Transaction();
      
      // Add all instructions to transaction
      builder.instructions.forEach(instruction => {
        transaction.add(instruction);
      });

      // Set fee payer and recent blockhash
      const { blockhash } = await solanaService.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = new PublicKey(publicKey);

      // Sign and send transaction
      await signAndSendTransaction(transaction);

      Toast.show({
        type: 'success',
        text1: 'Transaction Sent',
        text2: `Transaction with ${builder.instructions.length} instructions executed`,
      });

      // Clear builder
      setBuilder({ instructions: [] });
      
    } catch (error) {
      console.error('Transaction execution error:', error);
      Toast.show({
        type: 'error',
        text1: 'Transaction Failed',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  const clearForms = () => {
    setTransferForm({ from: '', to: '', amount: '' });
    setCreateAccountForm({ newAccount: '', space: '', owner: '' });
    setCustomForm({ programId: '', data: '', accounts: '' });
  };

  const renderInstructionForm = () => {
    if (!activeTemplate) return null;

    switch (activeTemplate.type) {
      case 'transfer':
        return (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>System Transfer Instruction</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>From Address</Text>
              <TextInput
                style={styles.textInput}
                value={transferForm.from}
                onChangeText={(text) => setTransferForm(prev => ({ ...prev, from: text }))}
                placeholder={publicKey || "Enter sender address"}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>To Address</Text>
              <TextInput
                style={styles.textInput}
                value={transferForm.to}
                onChangeText={(text) => setTransferForm(prev => ({ ...prev, to: text }))}
                placeholder="Enter recipient address"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount (SOL)</Text>
              <TextInput
                style={styles.textInput}
                value={transferForm.amount}
                onChangeText={(text) => setTransferForm(prev => ({ ...prev, amount: text }))}
                placeholder="0.0"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => addInstruction(activeTemplate)}
              >
                <Text style={styles.addButtonText}>Add Instruction</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setActiveTemplate(null)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'create_account':
        return (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Create Account Instruction</Text>
            <Text style={styles.formDescription}>
              Note: This is a simplified demo. Real account creation requires proper key generation and rent calculations.
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Account Address</Text>
              <TextInput
                style={styles.textInput}
                value={createAccountForm.newAccount}
                onChangeText={(text) => setCreateAccountForm(prev => ({ ...prev, newAccount: text }))}
                placeholder="Enter new account public key"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Space (bytes)</Text>
              <TextInput
                style={styles.textInput}
                value={createAccountForm.space}
                onChangeText={(text) => setCreateAccountForm(prev => ({ ...prev, space: text }))}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.addButton, styles.disabledButton]}
                disabled
              >
                <Text style={styles.addButtonText}>Not Implemented</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setActiveTemplate(null)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'custom':
        return (
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Custom Instruction</Text>
            <Text style={styles.formDescription}>
              Note: This is a simplified demo. Real custom instructions require proper serialization.
            </Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Program ID</Text>
              <TextInput
                style={styles.textInput}
                value={customForm.programId}
                onChangeText={(text) => setCustomForm(prev => ({ ...prev, programId: text }))}
                placeholder="Enter program public key"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.addButton, styles.disabledButton]}
                disabled
              >
                <Text style={styles.addButtonText}>Not Implemented</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setActiveTemplate(null)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const renderInstructionsList = () => {
    if (builder.instructions.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No instructions added</Text>
          <Text style={styles.emptySubtext}>Add instructions to build your transaction</Text>
        </View>
      );
    }

    return (
      <View style={styles.instructionsList}>
        <Text style={styles.sectionTitle}>Transaction Instructions ({builder.instructions.length})</Text>
        {builder.instructions.map((instruction, index) => (
          <View key={index} style={styles.instructionItem}>
            <View style={styles.instructionHeader}>
              <Text style={styles.instructionType}>Instruction {index + 1}</Text>
              <TouchableOpacity
                onPress={() => removeInstruction(index)}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.instructionProgram}>
              Program: {instruction.programId.toString().slice(0, 20)}...
            </Text>
            <Text style={styles.instructionAccounts}>
              Accounts: {instruction.keys.length}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  if (!connected) {
    return (
      <View style={styles.container}>
        <Text style={styles.notConnectedText}>
          Please connect your wallet to use the transaction builder
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Transaction Builder</Text>
      <Text style={styles.subtitle}>
        Build custom transactions by adding instructions
      </Text>

      {/* Instruction Templates */}
      {!activeTemplate && (
        <View style={styles.templatesContainer}>
          <Text style={styles.sectionTitle}>Instruction Templates</Text>
          <View style={styles.templatesGrid}>
            {INSTRUCTION_TEMPLATES.map((template) => (
              <TouchableOpacity
                key={template.type}
                style={styles.templateCard}
                onPress={() => setActiveTemplate(template)}
              >
                <Text style={styles.templateIcon}>{template.icon}</Text>
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateDescription}>{template.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Instruction Form */}
      {renderInstructionForm()}

      {/* Instructions List */}
      {renderInstructionsList()}

      {/* Execute Transaction */}
      {builder.instructions.length > 0 && (
        <View style={styles.executeSection}>
          <TouchableOpacity
            style={[styles.executeButton, loading && styles.disabledButton]}
            onPress={buildAndExecuteTransaction}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.executeButtonText}>
                Execute Transaction ({builder.instructions.length} instructions)
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
  templatesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  templateCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  templateIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  formDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  addButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  instructionsList: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  instructionItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  instructionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  removeButton: {
    backgroundColor: '#ff4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  instructionProgram: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  instructionAccounts: {
    fontSize: 12,
    color: '#666',
  },
  executeSection: {
    marginBottom: 24,
  },
  executeButton: {
    backgroundColor: '#28a745',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  executeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  emptyText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  notConnectedText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    padding: 40,
  },
});
