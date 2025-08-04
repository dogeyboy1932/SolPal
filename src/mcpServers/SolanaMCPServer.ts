/**
 * Solana MCP Server
 * Contains all wallet and blockchain-related tools
 */

import { BaseMCPServer, MCPTool, MCPToolResult, MCPParams } from './BaseMCPServer';
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import { solanaService } from '../services/SolanaService';

export class SolanaMCPServer extends BaseMCPServer {
  readonly serverName = "Solana Blockchain Server";
  readonly serverDescription = "Provides wallet operations, transactions, and blockchain interactions";

  private connection: Connection | null = null;
  private publicKey: PublicKey | null = null;
  private signTransaction: ((transaction: Transaction) => Promise<string>) | null = null;
  

  /**
   * Initialize server with Solana context
   */
  initialize(connection: Connection, publicKey: PublicKey | null, signTxFunction?: (transaction: Transaction) => Promise<string>) {
    console.log("REINITIALIZED");
    this.connection = connection;
    this.publicKey = publicKey;
    if (signTxFunction) {
      this.signTransaction = signTxFunction;
    }
  }

  
  disconnect() {
    console.log("DISCONNECTING");
    this.connection = null;
    this.publicKey = null;
  }


  /**
   * Define all tools available in this server
   */
  protected defineTools(): Record<string, MCPTool> {
    return {

      get_wallet_balance: {
        name: "get_wallet_balance",
        description: "Get the SOL balance of the connected wallet",
        parameters: {
          type: "object",
          properties: {},
          required: []
        }
      },

      get_wallet_address: {
        name: "get_wallet_address",
        description: "Get the public address of the connected wallet",
        parameters: {
          type: "object",
          properties: {},
          required: []
        }
      },

      get_transaction_history: {
        name: "get_transaction_history",
        description: "Get recent transaction history for the connected wallet",
        parameters: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Number of transactions to retrieve (default: 10)"
            }
          },
          required: []
        }
      },

      validate_wallet_address: {
        name: "validate_wallet_address",
        description: "Validate if a given string is a valid Solana wallet address",
        parameters: {
          type: "object",
          properties: {
            address: {
              type: "string",
              description: "Wallet address to validate"
            }
          },
          required: ["address"]
        }
      },

      request_sol_airdrop: {
        name: "request_sol_airdrop",
        description: "Request SOL airdrop for testing (devnet/testnet only)",
        parameters: {
          type: "object",
          properties: {
            amount: {
              type: "number",
              description: "Amount of SOL to request (default: 1.0)"
            }
          },
          required: []
        }
      },

      create_sol_transfer: {
        name: "create_sol_transfer",
        description: "Create and optionally execute a SOL transfer transaction",
        parameters: {
          type: "object",
          properties: {
            to: {
              type: "string",
              description: "Recipient wallet address"
            },
            amount: {
              type: "number",
              description: "Amount of SOL to transfer"
            },
            execute: {
              type: "boolean",
              description: "Whether to execute the transaction immediately (default: false)"
            }
          },
          required: ["to", "amount"]
        }
      }
    };
  }

  // Tool implementations

  async get_wallet_balance(): Promise<any> {
    try {
      if (!this.connection || !this.publicKey) {
        return {
          success: false,
          connected: false,
          balance: 0,
          currency: 'SOL',
          message: 'Wallet not connected. Please connect your wallet first.'
        };
      }

      const balance = await solanaService.getBalance(this.publicKey);
      
      return {
        success: true,
        connected: true,
        balance: balance,
        currency: 'SOL',
        address: this.publicKey.toBase58(),
        network: solanaService.getConnection().rpcEndpoint,
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

  async get_wallet_address(): Promise<any> {
    console.log("GET WALLET ADDRESS CALLED")
    console.log(this.connection)
    console.log(this.publicKey);

    try {
      if (!this.connection || !this.publicKey) {
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
        address: this.publicKey.toBase58(),
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

  async get_transaction_history(args: { limit?: number }): Promise<any> {
    try {
      if (!this.connection || !this.publicKey) {
        return {
          success: false,
          connected: false,
          transactions: [],
          message: 'Wallet not connected. Please connect your wallet first.'
        };
      }

      const limit = args.limit || 10;
      const transactions = await solanaService.getTransactionHistory(this.publicKey, limit);
      
      if (transactions.length === 0) {
        return {
          success: true,
          connected: true,
          transactions: [],
          count: 0,
          message: 'No transaction history found for this wallet'
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
        walletAddress: this.publicKey.toString(),
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

  async validate_wallet_address(args: { address: string }): Promise<any> {
    try {
      let isValid = false;
      let publicKey: PublicKey | null = null;

      try {
        publicKey = new PublicKey(args.address);
        isValid = PublicKey.isOnCurve(publicKey);
      } catch {
        isValid = false;
      }

      return {
        success: true,
        valid: isValid,
        address: args.address,
        message: isValid ? 'Valid Solana wallet address' : 'Invalid Solana wallet address'
      };
    } catch (error) {
      return {
        success: false,
        valid: false,
        address: args.address,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Address validation failed'
      };
    }
  }

  async request_sol_airdrop(args: { amount?: number }): Promise<any> {
    try {
      if (!this.connection || !this.publicKey) {
        return {
          success: false,
          connected: false,
          message: 'Wallet not connected. Please connect your wallet first.'
        };
      }

      const amount = args.amount || 1.0;
      const lamports = amount * LAMPORTS_PER_SOL;

      const signature = await solanaService.requestAirdrop(this.publicKey, lamports);

      return {
        success: true,
        connected: true,
        amount: amount,
        signature: signature,
        message: `Successfully airdropped ${amount} SOL`
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

  async create_sol_transfer(args: { to: string; amount: number; execute?: boolean }): Promise<any> {
    console.log("EXECUTE ARG IS: " + args.execute);

    console.log(this.connection)
    console.log(this.publicKey)

    try {
      if (!this.publicKey || !this.connection) {
        return {
          success: false,
          connected: false,
          message: 'Wallet not connected. Please connect your wallet first.'
        };
      }

      // Validate recipient address
      let recipientKey: PublicKey;
      try {
        recipientKey = new PublicKey(args.to);
      } catch {
        return {
          success: false,
          connected: true,
          error: 'Invalid recipient address',
          message: 'The provided recipient address is not a valid Solana address'
        };
      }

      // Check sender balance
      const balance = await solanaService.getBalance(this.publicKey);
      if (balance < args.amount) {
        return {
          success: false,
          connected: true,
          error: 'Insufficient balance',
          currentBalance: balance,
          requiredAmount: args.amount,
          message: `Insufficient balance. Current: ${balance.toFixed(6)} SOL, Required: ${args.amount} SOL`
        };
      }

      // Create transaction
      const transaction = await solanaService.createTransferTransaction(
        this.publicKey,
        recipientKey,
        args.amount
      );

      // Estimate fee
      const estimatedFee = await solanaService.estimateTransactionFee(transaction);

      // If not executing, just preview
      if (!args.execute) {
        return {
          success: true,
          preview: true,
          from: this.publicKey.toString(),
          to: args.to,
          amount: args.amount,
          estimatedFee,
          totalCost: args.amount + estimatedFee,
          message: 'Transfer preview generated. Set execute=true to send transaction'
        };
      }

      // Execute transaction
      if (!this.signTransaction) {
        return {
          success: false,
          error: 'Transaction signing not available',
          message: 'Please ensure wallet is properly connected'
        };
      }

      const signature = await this.signTransaction(transaction);

      return {
        success: true,
        executed: true,
        from: this.publicKey.toString(),
        to: args.to,
        amount: args.amount,
        signature,
        explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
        message: 'SOL transfer completed successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to ${args.execute ? 'execute' : 'preview'} transfer`
      };
    }
  }
}
