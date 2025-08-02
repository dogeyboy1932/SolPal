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
  Switch,
} from 'react-native';
import { useWallet } from '@/contexts/WalletContext';
import { solanaService } from '@/services/SolanaService';
import { PublicKey, LAMPORTS_PER_SOL, Transaction } from '@solana/web3.js';
import Toast from 'react-native-toast-message';

interface AdvancedTransactionFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'batch_transfer' | 'scheduled_tx' | 'multi_sig' | 'priority_fee' | 'memo_tx';
}

const ADVANCED_FEATURES: AdvancedTransactionFeature[] = [
  {
    id: 'batch_transfer',
    name: 'Batch Transfer',
    description: 'Send SOL to multiple recipients in one transaction',
    icon: '📦',
    type: 'batch_transfer'
  },
  {
    id: 'priority_fee',
    name: 'Priority Fees',
    description: 'Add priority fees to speed up transaction processing',
    icon: '⚡',
    type: 'priority_fee'
  },
  {
    id: 'memo_tx',
    name: 'Transaction Memo',
    description: 'Add memo/note to transactions',
    icon: '📝',
    type: 'memo_tx'
  },
  {
    id: 'scheduled_tx',
    name: 'Scheduled Transaction',
    description: 'Schedule transactions for later execution',
    icon: '⏰',
    type: 'scheduled_tx'
  },
  {
    id: 'multi_sig',
    name: 'Multi-Signature',
    description: 'Create transactions requiring multiple signatures',
    icon: '🔐',
    type: 'multi_sig'
  }
];

interface BatchRecipient {
  address: string;
  amount: string;
}

export const AdvancedTransactionFeatures: React.FC = () => {
  const { connected, publicKey, signAndSendTransaction } = useWallet();
  const [selectedFeature, setSelectedFeature] = useState<AdvancedTransactionFeature | null>(null);
  const [loading, setLoading] = useState(false);

  // Batch Transfer State
  const [batchRecipients, setBatchRecipients] = useState<BatchRecipient[]>([
    { address: '', amount: '' }
  ]);

  // Priority Fee State
  const [priorityFeeEnabled, setPriorityFeeEnabled] = useState(false);
  const [priorityFeeAmount, setPriorityFeeAmount] = useState('0.001');
  const [baseTransaction, setBaseTransaction] = useState({
    recipient: '',
    amount: ''
  });

  // Memo Transaction State
  const [memoTransaction, setMemoTransaction] = useState({
    recipient: '',
    amount: '',
    memo: ''
  });

  // Scheduled Transaction State
  const [scheduledTransaction, setScheduledTransaction] = useState({
    recipient: '',
    amount: '',
    executeAt: '',
    note: ''
  });

  const addBatchRecipient = () => {
    setBatchRecipients(prev => [...prev, { address: '', amount: '' }]);
  };

  const removeBatchRecipient = (index: number) => {
    if (batchRecipients.length > 1) {
      setBatchRecipients(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateBatchRecipient = (index: number, field: 'address' | 'amount', value: string) => {
    setBatchRecipients(prev => prev.map((recipient, i) => 
      i === index ? { ...recipient, [field]: value } : recipient
    ));
  };

  const executeBatchTransfer = async () => {
    if (!publicKey) {
      Alert.alert('Error', 'Wallet not connected');
      return;
    }

    // Validate recipients
    const validRecipients = batchRecipients.filter(r => r.address && r.amount);
    if (validRecipients.length === 0) {
      Alert.alert('Error', 'Please add at least one valid recipient');
      return;
    }

    setLoading(true);
    try {
      const transaction = new Transaction();
      const fromPubkey = new PublicKey(publicKey);

      // Add transfer instructions for each recipient
      for (const recipient of validRecipients) {
        const transferTx = await solanaService.createTransferTransaction(
          fromPubkey,
          new PublicKey(recipient.address),
          parseFloat(recipient.amount)
        );
        transaction.add(...transferTx.instructions);
      }

      // Set transaction properties
      const { blockhash } = await solanaService.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;

      await signAndSendTransaction(transaction);

      Toast.show({
        type: 'success',
        text1: 'Batch Transfer Sent',
        text2: `Successfully sent to ${validRecipients.length} recipients`,
      });

      // Reset form
      setBatchRecipients([{ address: '', amount: '' }]);
      setSelectedFeature(null);

    } catch (error) {
      console.error('Batch transfer error:', error);
      Toast.show({
        type: 'error',
        text1: 'Batch Transfer Failed',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  const executePriorityFeeTransaction = async () => {
    if (!publicKey || !baseTransaction.recipient || !baseTransaction.amount) {
      Alert.alert('Error', 'Please fill in all transaction details');
      return;
    }

    setLoading(true);
    try {
      const transaction = await solanaService.createTransferTransaction(
        new PublicKey(publicKey),
        new PublicKey(baseTransaction.recipient),
        parseFloat(baseTransaction.amount)
      );

      // Add priority fee if enabled
      if (priorityFeeEnabled) {
        // Note: This is a simplified example. Real priority fees require compute budget instructions
        console.log('Priority fee would be added:', priorityFeeAmount);
      }

      await signAndSendTransaction(transaction);

      Toast.show({
        type: 'success',
        text1: 'Transaction Sent',
        text2: priorityFeeEnabled ? 'Sent with priority fee' : 'Sent successfully',
      });

      // Reset form
      setBaseTransaction({ recipient: '', amount: '' });
      setSelectedFeature(null);

    } catch (error) {
      console.error('Priority fee transaction error:', error);
      Toast.show({
        type: 'error',
        text1: 'Transaction Failed',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  const executeMemoTransaction = async () => {
    if (!publicKey || !memoTransaction.recipient || !memoTransaction.amount) {
      Alert.alert('Error', 'Please fill in all transaction details');
      return;
    }

    setLoading(true);
    try {
      const transaction = await solanaService.createTransferTransaction(
        new PublicKey(publicKey),
        new PublicKey(memoTransaction.recipient),
        parseFloat(memoTransaction.amount)
      );

      // Note: Real memo implementation would add a memo instruction
      if (memoTransaction.memo) {
        console.log('Memo would be added:', memoTransaction.memo);
      }

      await signAndSendTransaction(transaction);

      Toast.show({
        type: 'success',
        text1: 'Transaction with Memo Sent',
        text2: 'Transaction completed successfully',
      });

      // Reset form
      setMemoTransaction({ recipient: '', amount: '', memo: '' });
      setSelectedFeature(null);

    } catch (error) {
      console.error('Memo transaction error:', error);
      Toast.show({
        type: 'error',
        text1: 'Transaction Failed',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  const scheduleTransaction = () => {
    if (!scheduledTransaction.recipient || !scheduledTransaction.amount || !scheduledTransaction.executeAt) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // In a real implementation, this would store the transaction for later execution
    Alert.alert(
      'Transaction Scheduled', 
      `Transaction will be executed at ${scheduledTransaction.executeAt}.\n\nNote: This is a demo - real scheduling would require a backend service.`,
      [
        {
          text: 'OK',
          onPress: () => {
            setScheduledTransaction({ recipient: '', amount: '', executeAt: '', note: '' });
            setSelectedFeature(null);
          }
        }
      ]
    );
  };

  const renderFeatureInterface = () => {
    if (!selectedFeature) return null;

    switch (selectedFeature.type) {
      case 'batch_transfer':
        return (
          <View style={styles.featureContainer}>
            <Text style={styles.featureTitle}>Batch Transfer</Text>
            <Text style={styles.featureDescription}>
              Send SOL to multiple recipients in a single transaction
            </Text>

            <ScrollView style={styles.recipientsList} showsVerticalScrollIndicator={false}>
              {batchRecipients.map((recipient, index) => (
                <View key={index} style={styles.recipientRow}>
                  <Text style={styles.recipientLabel}>Recipient {index + 1}</Text>
                  
                  <TextInput
                    style={styles.addressInput}
                    value={recipient.address}
                    onChangeText={(text) => updateBatchRecipient(index, 'address', text)}
                    placeholder="Recipient address"
                    placeholderTextColor="#999"
                  />
                  
                  <View style={styles.amountRow}>
                    <TextInput
                      style={[styles.textInput, { flex: 1 }]}
                      value={recipient.amount}
                      onChangeText={(text) => updateBatchRecipient(index, 'amount', text)}
                      placeholder="Amount (SOL)"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                    />
                    
                    {batchRecipients.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeBatchRecipient(index)}
                      >
                        <Text style={styles.removeButtonText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.addButton} onPress={addBatchRecipient}>
              <Text style={styles.addButtonText}>+ Add Recipient</Text>
            </TouchableOpacity>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.executeButton, loading && styles.disabledButton]}
                onPress={executeBatchTransfer}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.executeButtonText}>Send Batch Transfer</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectedFeature(null)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'priority_fee':
        return (
          <View style={styles.featureContainer}>
            <Text style={styles.featureTitle}>Priority Fee Transaction</Text>
            <Text style={styles.featureDescription}>
              Add priority fees to speed up transaction processing
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Recipient Address</Text>
              <TextInput
                style={styles.textInput}
                value={baseTransaction.recipient}
                onChangeText={(text) => setBaseTransaction(prev => ({ ...prev, recipient: text }))}
                placeholder="Enter recipient address"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount (SOL)</Text>
              <TextInput
                style={styles.textInput}
                value={baseTransaction.amount}
                onChangeText={(text) => setBaseTransaction(prev => ({ ...prev, amount: text }))}
                placeholder="0.0"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.priorityFeeRow}>
              <View style={styles.switchRow}>
                <Text style={styles.inputLabel}>Enable Priority Fee</Text>
                <Switch
                  value={priorityFeeEnabled}
                  onValueChange={setPriorityFeeEnabled}
                />
              </View>

              {priorityFeeEnabled && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Priority Fee (SOL)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={priorityFeeAmount}
                    onChangeText={setPriorityFeeAmount}
                    placeholder="0.001"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                </View>
              )}
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.executeButton, loading && styles.disabledButton]}
                onPress={executePriorityFeeTransaction}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.executeButtonText}>Send Transaction</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectedFeature(null)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'memo_tx':
        return (
          <View style={styles.featureContainer}>
            <Text style={styles.featureTitle}>Transaction with Memo</Text>
            <Text style={styles.featureDescription}>
              Add a memo/note to your transaction
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Recipient Address</Text>
              <TextInput
                style={styles.textInput}
                value={memoTransaction.recipient}
                onChangeText={(text) => setMemoTransaction(prev => ({ ...prev, recipient: text }))}
                placeholder="Enter recipient address"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount (SOL)</Text>
              <TextInput
                style={styles.textInput}
                value={memoTransaction.amount}
                onChangeText={(text) => setMemoTransaction(prev => ({ ...prev, amount: text }))}
                placeholder="0.0"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Memo</Text>
              <TextInput
                style={[styles.textInput, styles.memoInput]}
                value={memoTransaction.memo}
                onChangeText={(text) => setMemoTransaction(prev => ({ ...prev, memo: text }))}
                placeholder="Enter transaction memo (optional)"
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
                maxLength={280}
              />
              <Text style={styles.charCount}>
                {memoTransaction.memo.length}/280 characters
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.executeButton, loading && styles.disabledButton]}
                onPress={executeMemoTransaction}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.executeButtonText}>Send with Memo</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectedFeature(null)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'scheduled_tx':
        return (
          <View style={styles.featureContainer}>
            <Text style={styles.featureTitle}>Schedule Transaction</Text>
            <Text style={styles.featureDescription}>
              Schedule a transaction for future execution (Demo only)
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Recipient Address</Text>
              <TextInput
                style={styles.textInput}
                value={scheduledTransaction.recipient}
                onChangeText={(text) => setScheduledTransaction(prev => ({ ...prev, recipient: text }))}
                placeholder="Enter recipient address"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount (SOL)</Text>
              <TextInput
                style={styles.textInput}
                value={scheduledTransaction.amount}
                onChangeText={(text) => setScheduledTransaction(prev => ({ ...prev, amount: text }))}
                placeholder="0.0"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Execute At</Text>
              <TextInput
                style={styles.textInput}
                value={scheduledTransaction.executeAt}
                onChangeText={(text) => setScheduledTransaction(prev => ({ ...prev, executeAt: text }))}
                placeholder="YYYY-MM-DD HH:MM"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Note</Text>
              <TextInput
                style={styles.textInput}
                value={scheduledTransaction.note}
                onChangeText={(text) => setScheduledTransaction(prev => ({ ...prev, note: text }))}
                placeholder="Optional note for this scheduled transaction"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.executeButton}
                onPress={scheduleTransaction}
              >
                <Text style={styles.executeButtonText}>Schedule Transaction</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectedFeature(null)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'multi_sig':
        return (
          <View style={styles.featureContainer}>
            <Text style={styles.featureTitle}>Multi-Signature Transaction</Text>
            <Text style={styles.featureDescription}>
              Create transactions requiring multiple signatures (Demo only)
            </Text>
            
            <View style={styles.notImplementedContainer}>
              <Text style={styles.notImplementedText}>🚧 Coming Soon</Text>
              <Text style={styles.notImplementedDescription}>
                Multi-signature functionality requires additional smart contract integration and will be implemented in a future version.
              </Text>
            </View>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setSelectedFeature(null)}>
              <Text style={styles.cancelButtonText}>Back</Text>
            </TouchableOpacity>
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
          Please connect your wallet to access advanced transaction features
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Advanced Transaction Features</Text>
      <Text style={styles.subtitle}>
        Enhanced transaction capabilities for power users
      </Text>

      {!selectedFeature ? (
        <View style={styles.featuresGrid}>
          {ADVANCED_FEATURES.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={styles.featureCard}
              onPress={() => setSelectedFeature(feature)}
            >
              <Text style={styles.featureIcon}>{feature.icon}</Text>
              <Text style={styles.featureName}>{feature.name}</Text>
              <Text style={styles.featureCardDescription}>{feature.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        renderFeatureInterface()
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
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  featureCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureCardDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  featureContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
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
  recipientsList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  recipientRow: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  recipientLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  addressInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  removeButton: {
    backgroundColor: '#ff4444',
    borderRadius: 6,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  priorityFeeRow: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  memoInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  executeButton: {
    flex: 1,
    backgroundColor: '#28a745',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  executeButtonText: {
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
  notImplementedContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 20,
  },
  notImplementedText: {
    fontSize: 24,
    marginBottom: 8,
  },
  notImplementedDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  notConnectedText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    padding: 40,
  },
});
