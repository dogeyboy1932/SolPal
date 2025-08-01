import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';

export class SolanaService {
  private connection: Connection;

  constructor(rpcUrl?: string) {
    this.connection = new Connection(
      rpcUrl || process.env.EXPO_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
      'confirmed'
    );
  }

  async getBalance(publicKey: PublicKey): Promise<number> {
    const balance = await this.connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  }

  async createTransferTransaction(
    fromPubkey: PublicKey,
    toPubkey: PublicKey,
    amount: number
  ): Promise<Transaction> {
    const lamports = Math.round(amount * LAMPORTS_PER_SOL);
    
    const transaction = new Transaction();
    transaction.add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports,
      })
    );

    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    return transaction;
  }

  async estimateTransactionFee(transaction: Transaction): Promise<number> {
    try {
      const feeCalculator = await this.connection.getFeeForMessage(
        transaction.compileMessage(),
        'confirmed'
      );
      return feeCalculator?.value ? feeCalculator.value / LAMPORTS_PER_SOL : 0.000005;
    } catch (error) {
      console.error('Failed to estimate fee:', error);
      return 0.000005; // Default fee estimate
    }
  }

  async confirmTransaction(signature: string): Promise<boolean> {
    try {
      const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');
      return !confirmation.value.err;
    } catch (error) {
      console.error('Failed to confirm transaction:', error);
      return false;
    }
  }

  async getTransactionHistory(publicKey: PublicKey, limit: number = 50) {
    try {
      const signatures = await this.connection.getSignaturesForAddress(
        publicKey,
        { limit }
      );

      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          try {
            const tx = await this.connection.getTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0,
            });
            return {
              signature: sig.signature,
              slot: sig.slot,
              timestamp: sig.blockTime || 0,
              confirmationStatus: sig.confirmationStatus,
              err: sig.err,
              transaction: tx,
            };
          } catch (error) {
            console.error(`Failed to fetch transaction ${sig.signature}:`, error);
            return null;
          }
        })
      );

      return transactions.filter(tx => tx !== null);
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      return [];
    }
  }
}

export const solanaService = new SolanaService();
