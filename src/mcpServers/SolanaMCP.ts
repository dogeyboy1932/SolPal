/**
 * Solana MCP Server
 * Contains all wallet and blockchain-related tools
 */

import { BaseMCPServer, MCPTool, MCPToolResult, MCPParams } from './BaseMCP';
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import { solanaService } from '../services/solanaService';

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
   * Set up all tools using server.tool() pattern
   */
  protected setupTools(): void {
    this.tool(
      "get_wallet_balance",
      {},
      "Get the SOL balance of the connected wallet",
      async (args) => await solanaService.getWalletBalance(this.connection, this.publicKey)
    );

    this.tool(
      "get_wallet_address",
      {},
      "Get the public address of the connected wallet",
      async (args) => await solanaService.getWalletAddress(this.connection, this.publicKey)
    );

    this.tool(
      "get_transaction_history",
      {
        limit: {
          type: "number",
          description: "Number of transactions to retrieve (default: 10)"
        }
      },
      "Get recent transaction history for the connected wallet",
      async (args) => await solanaService.getTransactionHistoryMCP(this.connection, this.publicKey, args.limit)
    );

    this.tool(
      "validate_wallet_address",
      {
        address: {
          type: "string",
          description: "Wallet address to validate",
          required: true
        }
      },
      "Validate if a given string is a valid Solana wallet address",
      async (args) => await solanaService.validateWalletAddress(args.address)
    );

    this.tool(
      "request_sol_airdrop",
      {
        amount: {
          type: "number",
          description: "Amount of SOL to request (default: 1.0)"
        }
      },
      "Request SOL airdrop for testing (devnet/testnet only)",
      async (args) => await solanaService.requestSolAirdropMCP(this.connection, this.publicKey, args.amount)
    );

    this.tool(
      "create_sol_transfer",
      {
        to: {
          type: "string",
          description: "Recipient wallet address",
          required: true
        },
        amount: {
          type: "number",
          description: "Amount of SOL to transfer",
          required: true
        },
        execute: {
          type: "boolean",
          description: "Whether to execute the transaction immediately (default: false)"
        }
      },
      "Create and optionally execute a SOL transfer transaction",
      async (args) => await solanaService.createSolTransferMCP(this.connection, this.publicKey, this.signTransaction, args.to, args.amount, args.execute)
    );
  }
}
