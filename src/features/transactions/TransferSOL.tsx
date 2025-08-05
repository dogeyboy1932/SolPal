import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
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

  // if (!connected) {
  //   return (
  //     <View className="p-4 bg-white rounded-xl border border-gray-300">
  //       <Text className="text-gray-500 text-center">
  //         Please connect your wallet to send SOL
  //       </Text>
  //     </View>
  //   );
  // }

  return (
    <View className="p-4 bg-neutral-light border border-gray-300 rounded-md">
      <Text className="text-xl font-bold text-gray-900 mb-4">Send SOL</Text>
      
      <View className="space-y-4">
        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">Recipient Address</Text>
          <TextInput
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
            value={toAddress}
            onChangeText={setToAddress}
            placeholder="Enter Solana address"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View>
          <Text className="text-sm font-medium text-gray-700 mb-2">Amount (SOL)</Text>
          <TextInput
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-900"
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor="#9ca3af"
            keyboardType="decimal-pad"
          />
        </View>

        {estimatedFee !== null && (
          <View className="bg-blue-50 p-3 rounded-lg">
            <Text className="text-sm text-blue-700">
              Estimated Fee: {estimatedFee.toFixed(6)} SOL
            </Text>
          </View>
        )}

        <TouchableOpacity
          className={`py-3 px-4 rounded-lg items-center ${
            (!toAddress || !amount || loading) 
              ? 'bg-gray-400' 
              : 'bg-blue-500'
          }`}
          onPress={handleTransfer}
          disabled={!toAddress || !amount || loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="text-white text-base font-semibold">Send SOL</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};
