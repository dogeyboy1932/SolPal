import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Platform } from 'react-native';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { webWalletAdapter } from '@/services/WebWalletAdapter';
import { WalletContextType, WalletState } from '@/types/wallet';
import Toast from 'react-native-toast-message';

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
}

// Check if we're running on web
const isWeb = Platform.OS === 'web';

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [state, setState] = useState<WalletState>({
    connected: false,
    connecting: false,
    publicKey: null,
    balance: null,
    error: null,
    accounts: [],
    activeAccountIndex: 0,
  });

  // Solana connection
  const connection = new Connection(
    process.env.EXPO_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    'confirmed'
  );

  const connect = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, connecting: true, error: null }));

      if (isWeb) {
        // Web connection using Phantom browser extension
        const response = await webWalletAdapter.connect();
        const publicKey = webWalletAdapter.publicKey.toBase58();
        
        // Get initial balance
        const balance = await connection.getBalance(webWalletAdapter.publicKey);
        
        setState({
          connected: true,
          connecting: false,
          publicKey,
          balance: balance / 1000000000, // Convert lamports to SOL
          error: null,
          accounts: [publicKey], // Web usually has one account active
          activeAccountIndex: 0,
        });

        Toast.show({
          type: 'success',
          text1: 'Wallet Connected',
          text2: `Connected to ${publicKey.slice(0, 8)}...${publicKey.slice(-8)}`,
        });

      } else {
        // Mobile connection using Mobile Wallet Adapter
        const result = await transact(async (wallet) => {
          const authorizationResult = await wallet.authorize({
            cluster: 'devnet',
            identity: {
              name: 'AI Solana Mobile',
              uri: 'https://ai-solana-mobile.app',
              icon: 'favicon.ico',
            },
          });

          return {
            publicKey: new PublicKey(authorizationResult.accounts[0].address),
            authToken: authorizationResult.auth_token,
            allAccounts: authorizationResult.accounts.map(acc => acc.address),
          };
        });

        const publicKey = result.publicKey.toBase58();
        
        // Get initial balance
        const balance = await connection.getBalance(result.publicKey);
        
        setState({
          connected: true,
          connecting: false,
          publicKey,
          balance: balance / 1000000000, // Convert lamports to SOL
          error: null,
          accounts: result.allAccounts,
          activeAccountIndex: 0,
        });

        Toast.show({
          type: 'success',
          text1: 'Wallet Connected',
          text2: `Connected to ${publicKey.slice(0, 8)}...${publicKey.slice(-8)}`,
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      setState(prev => ({
        ...prev,
        connecting: false,
        error: errorMessage,
      }));

      Toast.show({
        type: 'error',
        text1: 'Connection Failed',
        text2: errorMessage,
      });
    }
  }, [connection]);

  const disconnect = useCallback(async () => {
    try {
      if (isWeb) {
        await webWalletAdapter.disconnect();
      } else {
        await transact(async (wallet) => {
          await wallet.deauthorize({ auth_token: '' });
        });
      }

      setState({
        connected: false,
        connecting: false,
        publicKey: null,
        balance: null,
        error: null,
        accounts: [],
        activeAccountIndex: 0,
      });

      Toast.show({
        type: 'info',
        text1: 'Wallet Disconnected',
        text2: 'Successfully disconnected from wallet',
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect wallet';
      setState(prev => ({ ...prev, error: errorMessage }));

      Toast.show({
        type: 'error',
        text1: 'Disconnect Failed',
        text2: errorMessage,
      });
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!state.publicKey) return;

    try {
      const publicKey = new PublicKey(state.publicKey);
      const balance = await connection.getBalance(publicKey);
      
      setState(prev => ({
        ...prev,
        balance: balance / 1000000000, // Convert lamports to SOL
      }));
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [state.publicKey, connection]);

  const signAndSendTransaction = useCallback(async (transaction: Transaction): Promise<string> => {
    if (!state.connected) {
      throw new Error('Wallet not connected');
    }

    try {
      if (isWeb) {
        // Web transaction using Phantom browser extension
        const signature = await webWalletAdapter.signAndSendTransaction(transaction);
        return signature;
      } else {
        // Mobile transaction using Mobile Wallet Adapter
        const result = await transact(async (wallet) => {
          const signedTransactions = await wallet.signTransactions({
            transactions: [transaction],
          });

          return signedTransactions[0];
        });

        // Use the retry mechanism from SolanaService
        const signature = await connection.sendRawTransaction(result.serialize());
        await connection.confirmTransaction(signature, 'confirmed');

        return signature;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      throw new Error(errorMessage);
    }
  }, [state.connected, connection]);

  const switchAccount = useCallback(async (accountIndex: number) => {
    if (!state.connected || !state.accounts[accountIndex]) {
      throw new Error('Invalid account or wallet not connected');
    }

    try {
      const newPublicKey = state.accounts[accountIndex];
      const balance = await connection.getBalance(new PublicKey(newPublicKey));
      
      setState(prev => ({
        ...prev,
        publicKey: newPublicKey,
        balance: balance / 1000000000,
        activeAccountIndex: accountIndex,
      }));

      Toast.show({
        type: 'success',
        text1: 'Account Switched',
        text2: `Switched to ${newPublicKey.slice(0, 8)}...${newPublicKey.slice(-8)}`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch account';
      setState(prev => ({ ...prev, error: errorMessage }));

      Toast.show({
        type: 'error',
        text1: 'Switch Failed',
        text2: errorMessage,
      });
    }
  }, [state.connected, state.accounts, connection]);

  const value: WalletContextType = {
    ...state,
    connect,
    disconnect,
    refreshBalance,
    signAndSendTransaction,
    switchAccount,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
