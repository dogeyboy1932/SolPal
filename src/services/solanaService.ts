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

  async getAccountInfo(publicKey: PublicKey) {
    try {
      const accountInfo = await this.connection.getAccountInfo(publicKey);
      const balance = await this.connection.getBalance(publicKey);
      
      return {
        balance,
        owner: accountInfo?.owner,
        executable: accountInfo?.executable || false,
        rentEpoch: accountInfo?.rentEpoch || 0,
        data: accountInfo?.data || Buffer.alloc(0)
      };
    } catch (error) {
      console.error('Failed to get account info:', error);
      throw new Error('Failed to fetch account information');
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

  async requestAirdrop(publicKey: PublicKey, lamports: number): Promise<string> {
    try {
      const signature = await this.connection.requestAirdrop(publicKey, lamports);
      await this.connection.confirmTransaction(signature);
      return signature;
    } catch (error) {
      console.error('Failed to request airdrop:', error);
      throw new Error('Airdrop request failed');
    }
  }

  async getLatestBlockhash() {
    return await this.connection.getLatestBlockhash();
  }

  getConnection(): Connection {
    return this.connection;
  }

  // MCP-Compatible Service Methods

  async getWalletBalance(connection: Connection | null, publicKey: PublicKey | null): Promise<any> {
    try {
      if (!connection || !publicKey) {
        return {
          success: false,
          connected: false,
          balance: 0,
          currency: 'SOL',
          message: 'Wallet not connected. Please connect your wallet first.'
        };
      }

      const balance = await this.getBalance(publicKey);
      
      return {
        success: true,
        connected: true,
        balance: balance,
        currency: 'SOL',
        address: publicKey.toBase58(),
        network: this.getConnection().rpcEndpoint,
        message: `Current balance: ${balance} SOL`
      };
    } catch (error) {
      return {
        success: false,
        connected: false,
        balance: 0,
        currency: 'SOL',
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch wallet balance'
      };
    }
  }

  async getWalletAddress(connection: Connection | null, publicKey: PublicKey | null): Promise<any> {
    try {
      if (!connection || !publicKey) {
        return {
          success: false,
          connected: false,
          address: null,
          message: 'Wallet not connected. Please connect your wallet first.'
        };
      }

      return {
        success: true,
        connected: true,
        address: publicKey.toBase58(),
        message: 'Wallet address retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        connected: false,
        address: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to get wallet address'
      };
    }
  }

  async getTransactionHistoryMCP(connection: Connection | null, publicKey: PublicKey | null, limit?: number): Promise<any> {
    try {
      if (!connection || !publicKey) {
        return {
          success: false,
          connected: false,
          transactions: [],
          message: 'Wallet not connected. Please connect your wallet first.'
        };
      }

      const transactionLimit = limit || 10;
      const transactions = await this.getTransactionHistory(publicKey, transactionLimit);
      
      if (transactions.length === 0) {
        return {
          success: true,
          connected: true,
          transactions: [],
          count: 0,
          walletAddress: publicKey.toString(),
          message: 'No transactions found for this wallet'
        };
      }

      const formattedTransactions = transactions.map(tx => ({
        signature: tx.signature,
        timestamp: tx.timestamp,
        slot: tx.slot,
        confirmationStatus: tx.confirmationStatus,
        error: tx.err,
        explorerUrl: `https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`
      }));

      return {
        success: true,
        connected: true,
        transactions: formattedTransactions,
        count: transactions.length,
        walletAddress: publicKey.toString(),
        message: `Retrieved ${transactions.length} transactions`
      };
    } catch (error) {
      return {
        success: false,
        connected: false,
        transactions: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch transaction history'
      };
    }
  }

  async validateWalletAddress(address: string): Promise<any> {
    try {
      let isValid = false;
      let publicKey: PublicKey | null = null;

      try {
        publicKey = new PublicKey(address);
        isValid = PublicKey.isOnCurve(publicKey);
      } catch {
        isValid = false;
      }

      return {
        success: true,
        valid: isValid,
        address: address,
        message: isValid ? 'Valid Solana wallet address' : 'Invalid Solana wallet address'
      };
    } catch (error) {
      return {
        success: false,
        valid: false,
        address: address,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Address validation failed'
      };
    }
  }

  async requestSolAirdropMCP(connection: Connection | null, publicKey: PublicKey | null, amount?: number): Promise<any> {
    try {
      if (!connection || !publicKey) {
        return {
          success: false,
          connected: false,
          error: 'Wallet not connected',
          message: 'Wallet not connected. Please connect your wallet first.'
        };
      }

      const airdropAmount = amount || 1.0;
      const lamports = airdropAmount * LAMPORTS_PER_SOL;

      const signature = await this.requestAirdrop(publicKey, lamports);

      return {
        success: true,
        connected: true,
        amount: airdropAmount,
        signature: signature,
        message: `Successfully airdropped ${airdropAmount} SOL`
      };
    } catch (error) {
      return {
        success: false,
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Airdrop request failed'
      };
    }
  }

  async createSolTransferMCP(
    connection: Connection | null, 
    publicKey: PublicKey | null, 
    signTransaction: ((transaction: Transaction) => Promise<string>) | null,
    to: string, 
    amount: number, 
    execute?: boolean
  ): Promise<any> {
    try {
      if (!publicKey || !connection) {
        return {
          success: false,
          connected: false,
          error: 'Wallet not connected',
          message: 'Wallet not connected. Please connect your wallet first.'
        };
      }

      // Validate recipient address
      let recipientKey: PublicKey;
      try {
        recipientKey = new PublicKey(to);
      } catch {
        return {
          success: false,
          error: 'Invalid recipient address',
          message: 'The provided recipient address is not a valid Solana wallet address'
        };
      }

      // Check sender balance
      const balance = await this.getBalance(publicKey);
      if (balance < amount) {
        return {
          success: false,
          error: 'Insufficient balance',
          message: `Insufficient balance. Current: ${balance} SOL, Required: ${amount} SOL`
        };
      }

      // Create transaction
      const transaction = await this.createTransferTransaction(
        publicKey,
        recipientKey,
        amount
      );

      // Estimate fee
      const estimatedFee = await this.estimateTransactionFee(transaction);

      // If not executing, just preview
      if (!execute) {
        return {
          success: true,
          executed: false,
          preview: {
            from: publicKey.toString(),
            to: to,
            amount: amount,
            estimatedFee: estimatedFee,
            totalCost: amount + estimatedFee
          },
          message: 'Transaction preview created. Set execute=true to send the transaction.'
        };
      }

      // Execute transaction
      if (!signTransaction) {
        return {
          success: false,
          error: 'No signing function available',
          message: 'Cannot execute transaction: wallet signing function not available'
        };
      }

      const signature = await signTransaction(transaction);

      return {
        success: true,
        executed: true,
        from: publicKey.toString(),
        to: to,
        amount: amount,
        signature,
        explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
        message: 'SOL transfer completed successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to ${execute ? 'execute' : 'preview'} transfer`
      };
    }
  }
}

export const solanaService = new SolanaService();
