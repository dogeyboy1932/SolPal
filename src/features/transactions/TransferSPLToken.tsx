import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@/contexts/WalletContext';
import { solanaService } from '@/services/solanaService';
import Toast from 'react-native-toast-message';

interface TokenAccount {
  address: string;
  mint: string;
  balance: number;
  decimals: number;
}

export const TransferSPLToken: React.FC = () => {
  const { connected, publicKey, signAndSendTransaction, refreshBalance } = useWallet();
  const [tokenAccounts, setTokenAccounts] = useState<TokenAccount[]>([]);
  const [selectedToken, setSelectedToken] = useState<TokenAccount | null>(null);
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTokens, setLoadingTokens] = useState(false);

  const loadTokenAccounts = async () => {
    if (!publicKey) return;
    
    try {
      setLoadingTokens(true);
      const pubKey = new PublicKey(publicKey);
      const accounts = await solanaService.getTokenAccounts(pubKey);
      
      // Filter out accounts with zero balance
      const accountsWithBalance = accounts.filter(acc => acc.balance > 0);
      setTokenAccounts(accountsWithBalance);
      
      if (accountsWithBalance.length > 0) {
        setSelectedToken(accountsWithBalance[0]);
      }
    } catch (error) {
      console.error('Failed to load token accounts:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to Load Tokens',
        text2: 'Could not fetch your token accounts',
      });
    } finally {
      setLoadingTokens(false);
    }
  };

  const validateAddress = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  };

  const handleTransfer = async () => {
    if (!connected || !publicKey || !selectedToken) {
      Alert.alert('Error', 'Please connect your wallet and select a token');
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

    if (transferAmount > selectedToken.balance) {
      Alert.alert('Error', 'Insufficient token balance');
      return;
    }

    try {
      setLoading(true);

      const fromPubkey = new PublicKey(publicKey);
      const toPubkey = new PublicKey(toAddress);
      const mintAddress = new PublicKey(selectedToken.mint);
      
      const transaction = await solanaService.createSPLTransferTransaction(
        fromPubkey,
        toPubkey,
        mintAddress,
        transferAmount,
        selectedToken.decimals
      );

      const signature = await signAndSendTransaction(transaction);
      
      Toast.show({
        type: 'success',
        text1: 'Token Transfer Successful',
        text2: `Sent ${transferAmount} tokens to ${toAddress.slice(0, 8)}...${toAddress.slice(-8)}`,
      });

      // Clear form and reload tokens
      setToAddress('');
      setAmount('');
      setTimeout(() => {
        loadTokenAccounts();
        refreshBalance();
      }, 2000);

    } catch (error) {
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

  useEffect(() => {
    if (connected && publicKey) {
      loadTokenAccounts();
    }
  }, [connected, publicKey]);

  if (!connected) {
    return (
      <View className="bg-amber-50 rounded-xl p-4 mx-4 shadow-sm border border-amber-200">
        <Text className="text-center text-amber-800 text-base p-5">
          Please connect your wallet to send tokens
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-neutral-light p-4 shadow-lg border border-amber-200 mt-2 h-50 rounded-md">
      <Text className="text-xl font-semibold text-amber-900 mb-4">Send SPL Tokens</Text>
      
      {loadingTokens ? (
        <View className="items-center py-10">
          <ActivityIndicator size="large" color="#E49B3F" />
          <Text className="mt-3 text-amber-700 text-base">Loading your tokens...</Text>
        </View>
      ) : tokenAccounts.length === 0 ? (
        <View className="items-center py-10">
          <Text className="text-amber-700 text-base mb-4">No tokens found in your wallet</Text>
          <TouchableOpacity onPress={loadTokenAccounts} className="bg-orange-500 px-5 py-2.5 rounded-lg">
            <Text className="text-white font-medium">Reload</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="space-y-4">
          
          
          <View className="mb-4">
            <Text className="text-sm font-medium text-amber-900 mb-2">Select Token</Text>
            <ScrollView 
              horizontal 
              className="flex-grow-0"
              showsHorizontalScrollIndicator={false}
            >
              {tokenAccounts.map((token) => (
                <TouchableOpacity
                  key={token.mint}
                  className={`p-3 rounded-lg mr-3 border min-w-30 ${
                    selectedToken?.mint === token.mint 
                      ? 'bg-orange-100 border-orange-500' 
                      : 'bg-white border-amber-200'
                  }`}
                  onPress={() => setSelectedToken(token)}
                >
                  <Text className="text-xs font-mono text-amber-900 mb-1">
                    {token.mint.slice(0, 8)}...{token.mint.slice(-8)}
                  </Text>
                  <Text className="text-xs text-amber-700">
                    Balance: {token.balance}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-amber-900 mb-2">Recipient Address</Text>
            <TextInput
              className="border border-amber-200 rounded-lg p-3 text-base text-amber-900 bg-white"
              value={toAddress}
              onChangeText={setToAddress}
              placeholder="Enter Solana address"
              placeholderTextColor="#92400e"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-amber-900 mb-2">
              Amount {selectedToken && `(Max: ${selectedToken.balance})`}
            </Text>
            <TextInput
              className="border border-amber-200 rounded-lg p-3 text-base text-amber-900 bg-white"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#92400e"
              keyboardType="decimal-pad"
            />
          </View>

          <TouchableOpacity
            className={`p-4 rounded-lg items-center mt-2 ${
              (!selectedToken || !toAddress || !amount || loading) 
                ? 'bg-gray-400' 
                : 'bg-orange-500'
            }`}
            onPress={handleTransfer}
            disabled={!selectedToken || !toAddress || !amount || loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-white text-base font-semibold">Send Tokens</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};
