export interface WalletState {
  connected: boolean;
  connecting: boolean;
  publicKey: string | null;
  balance: number | null;
  error: string | null;
}

export interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  signAndSendTransaction: (transaction: any) => Promise<string>;
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
