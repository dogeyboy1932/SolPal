import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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
      <View style={styles.container}>
        <Text style={styles.notConnectedText}>
          Please connect your wallet to send tokens
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Send SPL Tokens</Text>
      
      {loadingTokens ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading your tokens...</Text>
        </View>
      ) : tokenAccounts.length === 0 ? (
        <View style={styles.noTokensContainer}>
          <Text style={styles.noTokensText}>No tokens found in your wallet</Text>
          <TouchableOpacity onPress={loadTokenAccounts} style={styles.reloadButton}>
            <Text style={styles.reloadButtonText}>Reload</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Select Token</Text>
            <ScrollView 
              horizontal 
              style={styles.tokenSelector}
              showsHorizontalScrollIndicator={false}
            >
              {tokenAccounts.map((token) => (
                <TouchableOpacity
                  key={token.mint}
                  style={[
                    styles.tokenOption,
                    selectedToken?.mint === token.mint && styles.selectedTokenOption,
                  ]}
                  onPress={() => setSelectedToken(token)}
                >
                  <Text style={styles.tokenMint}>
                    {token.mint.slice(0, 8)}...{token.mint.slice(-8)}
                  </Text>
                  <Text style={styles.tokenBalance}>
                    Balance: {token.balance}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

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
            <Text style={styles.label}>
              Amount {selectedToken && `(Max: ${selectedToken.balance})`}
            </Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#9ca3af"
              keyboardType="decimal-pad"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!selectedToken || !toAddress || !amount || loading) && styles.sendButtonDisabled,
            ]}
            onPress={handleTransfer}
            disabled={!selectedToken || !toAddress || !amount || loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.sendButtonText}>Send Tokens</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
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
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 16,
  },
  noTokensContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noTokensText: {
    color: '#6b7280',
    fontSize: 16,
    marginBottom: 16,
  },
  reloadButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  reloadButtonText: {
    color: 'white',
    fontWeight: '500',
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
  tokenSelector: {
    flexGrow: 0,
  },
  tokenOption: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 120,
  },
  selectedTokenOption: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  tokenMint: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#374151',
    marginBottom: 4,
  },
  tokenBalance: {
    fontSize: 12,
    color: '#6b7280',
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
  sendButton: {
    backgroundColor: '#8b5cf6',
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
