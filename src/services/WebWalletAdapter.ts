import { PublicKey, Transaction } from '@solana/web3.js';

// Web wallet adapter using window.solana (Phantom browser extension)
export class WebWalletAdapter {
  private solana: any;

  constructor() {
    this.solana = (window as any).solana;
  }

  get isPhantom() {
    return this.solana?.isPhantom;
  }

  get connected() {
    return this.solana?.isConnected;
  }

  get publicKey() {
    return this.solana?.publicKey;
  }

  async connect() {
    if (!this.solana) {
      throw new Error('Phantom wallet not found. Please install Phantom browser extension.');
    }

    try {
      const response = await this.solana.connect();
      return response;
    } catch (error) {
      throw new Error('Failed to connect to Phantom wallet');
    }
  }

  async disconnect() {
    if (this.solana) {
      await this.solana.disconnect();
    }
  }

  async signAndSendTransaction(transaction: Transaction) {
    if (!this.solana || !this.connected) {
      throw new Error('Wallet not connected');
    }

    try {
      const { signature } = await this.solana.signAndSendTransaction(transaction);
      return signature;
    } catch (error) {
      throw new Error('Transaction failed');
    }
  }

  async signTransaction(transaction: Transaction) {
    if (!this.solana || !this.connected) {
      throw new Error('Wallet not connected');
    }

    try {
      const signedTransaction = await this.solana.signTransaction(transaction);
      return signedTransaction;
    } catch (error) {
      throw new Error('Transaction signing failed');
    }
  }
}

export const webWalletAdapter = new WebWalletAdapter();
