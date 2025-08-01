import { Connection, PublicKey, SystemProgram, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';

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

  async createSPLTransferTransaction(
    fromPubkey: PublicKey,
    toPubkey: PublicKey,
    mintAddress: PublicKey,
    amount: number,
    decimals: number = 6
  ): Promise<Transaction> {
    const fromTokenAccount = await getAssociatedTokenAddress(
      mintAddress,
      fromPubkey
    );
    
    const toTokenAccount = await getAssociatedTokenAddress(
      mintAddress,
      toPubkey
    );

    const transaction = new Transaction();
    
    // Convert amount to smallest unit
    const transferAmount = Math.round(amount * Math.pow(10, decimals));
    
    transaction.add(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromPubkey,
        transferAmount,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    return transaction;
  }

  async getTokenBalance(publicKey: PublicKey, mintAddress: PublicKey): Promise<number> {
    try {
      const tokenAccount = await getAssociatedTokenAddress(
        mintAddress,
        publicKey
      );
      
      const balance = await this.connection.getTokenAccountBalance(tokenAccount);
      return parseFloat(balance.value.amount) / Math.pow(10, balance.value.decimals);
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return 0;
    }
  }

  async getTokenAccounts(publicKey: PublicKey) {
    try {
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );

      return tokenAccounts.value.map(account => ({
        address: account.pubkey.toBase58(),
        mint: account.account.data.parsed.info.mint,
        balance: account.account.data.parsed.info.tokenAmount.uiAmount || 0,
        decimals: account.account.data.parsed.info.tokenAmount.decimals,
      }));
    } catch (error) {
      console.error('Failed to get token accounts:', error);
      return [];
    }
  }

  async sendTransactionWithRetry(
    transaction: Transaction,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<string> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Get fresh blockhash for each attempt
        const { blockhash } = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        
        const signature = await this.connection.sendRawTransaction(
          transaction.serialize(),
          {
            skipPreflight: false,
            preflightCommitment: 'confirmed',
          }
        );
        
        // Confirm the transaction
        const confirmation = await this.connection.confirmTransaction(
          signature,
          'confirmed'
        );
        
        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }
        
        return signature;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        console.log(`Transaction attempt ${attempt} failed:`, lastError.message);
        
        // Don't retry on certain errors
        if (
          lastError.message.includes('insufficient funds') ||
          lastError.message.includes('invalid account') ||
          lastError.message.includes('signature verification failed')
        ) {
          throw lastError;
        }
        
        // Wait before retrying (except on last attempt)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }
    
    throw lastError || new Error('Transaction failed after all retries');
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
