import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@/contexts/WalletContext';
import { solanaService } from '@/services/solanaService';
import Toast from 'react-native-toast-message';

export const TransferSOL: React.FC = () => {
  const { connected, publicKey, signAndSendTransaction, refreshBalance } = useWallet();
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState<number | null>(null);

  const validateAddress = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  };

  const estimateFee = async () => {
    if (!publicKey || !toAddress || !amount) return;
    
    try {
      const fromPubkey = new PublicKey(publicKey);
      const toPubkey = new PublicKey(toAddress);
      const transferAmount = parseFloat(amount);
      
      const transaction = await solanaService.createTransferTransaction(
        fromPubkey,
        toPubkey,
        transferAmount
      );
      
      const fee = await solanaService.estimateTransactionFee(transaction);
      setEstimatedFee(fee);
    } catch (error) {
      console.error('Failed to estimate fee:', error);
    }
  };

  const handleTransfer = async () => {
    if (!connected || !publicKey) {
      Alert.alert('Error', 'Please connect your wallet first');
      return;
    }

    if (!toAddress || !amount) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateAddress(toAddress)) {
      Alert.alert('Error', 'Invalid recipient address');
      return;
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);

      const fromPubkey = new PublicKey(publicKey);
      const toPubkey = new PublicKey(toAddress);
      
      const transaction = await solanaService.createTransferTransaction(
        fromPubkey,
        toPubkey,
        transferAmount
      );

      const signature = await signAndSendTransaction(transaction);
      
      Toast.show({
        type: 'success',
        text1: 'Transfer Successful',
        text2: `Sent ${transferAmount} SOL to ${toAddress.slice(0, 8)}...${toAddress.slice(-8)}`,
      });

      // Clear form
      setToAddress('');
      setAmount('');
      setEstimatedFee(null);
      
      // Refresh balance
      setTimeout(() => {
        refreshBalance();
      }, 2000);

    } catch (error) {
      console.log('Transfer failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Transfer failed';
      
      Toast.show({
        type: 'error',
        text1: 'Transfer Failed',
        text2: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (toAddress && amount && validateAddress(toAddress)) {
      estimateFee();
    } else {
      setEstimatedFee(null);
    }
  }, [toAddress, amount]);

  if (!connected) {
    return (
      <View style={styles.container}>
        <Text style={styles.notConnectedText}>
          Please connect your wallet to send SOL
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Send SOL</Text>
      
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Recipient Address</Text>
          <TextInput
            style={styles.input}
            value={toAddress}
            onChangeText={setToAddress}
            placeholder="Enter Solana address"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Amount (SOL)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="#9ca3af"
            keyboardType="decimal-pad"
          />
        </View>

        {estimatedFee !== null && (
          <View style={styles.feeContainer}>
            <Text style={styles.feeText}>
              Estimated Fee: {estimatedFee.toFixed(6)} SOL
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!toAddress || !amount || loading) && styles.sendButtonDisabled,
          ]}
          onPress={handleTransfer}
          disabled={!toAddress || !amount || loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>Send SOL</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
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
    marginBottom: 16,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  feeContainer: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
  },
  feeText: {
    fontSize: 14,
    color: '#6b7280',
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  notConnectedText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    padding: 20,
  },
});
