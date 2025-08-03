export interface WalletState {
  connected: boolean;
  connecting: boolean;
  publicKey: string | null;
  balance: number | null;
  error: string | null;
  accounts: string[];
  activeAccountIndex: number;
  connectionType: 'mwa' | 'web' | 'privatekey' | null;
}

export interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  connectWithPrivateKey: (privateKeyBase58: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  signAndSendTransaction: (transaction: any) => Promise<string>;
  switchAccount: (accountIndex: number) => Promise<void>;
}

export interface Transaction {
  signature: string;
  slot: number;
  timestamp: number;
  from: string;
  to: string;
  amount: number;
  fee: number;
  status: 'confirmed' | 'finalized' | 'failed';
  type: 'send' | 'receive';
}
