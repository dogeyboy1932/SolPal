import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

// Solana connection (should be injected from wallet context)
let solanaConnection: Connection | null = null;
let walletPublicKey: PublicKey | null = null;

export function setSolanaContext(connection: Connection, publicKey: PublicKey | null) {
  solanaConnection = connection;
  walletPublicKey = publicKey;
}

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "solana-wallet-mcp",
    version: "1.0.0",
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  });

  // Get wallet balance
  server.tool(
    'get_wallet_balance',
    {},
    async () => {
      console.log('💰 Solana: Getting wallet balance');
      
      if (!solanaConnection || !walletPublicKey) {
        return {
          content: [{
            type: 'text',
            text: '❌ Wallet not connected. Please connect your wallet first.'
          }]
        };
      }

      try {
        const balance = await solanaConnection.getBalance(walletPublicKey);
        const solBalance = balance / LAMPORTS_PER_SOL;

        return {
          content: [{
            type: 'text',
            text: `💰 Wallet Balance:\nAddress: ${walletPublicKey.toString()}\nBalance: ${solBalance.toFixed(6)} SOL\nNetwork: ${solanaConnection.rpcEndpoint}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Failed to get balance: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  // Get wallet address
  server.tool(
    'get_wallet_address',
    {},
    async () => {
      console.log('📍 Solana: Getting wallet address');
      
      if (!walletPublicKey) {
        return {
          content: [{
            type: 'text',
            text: '❌ Wallet not connected. Please connect your wallet first.'
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: `📍 Wallet Address: ${walletPublicKey.toString()}`
        }]
      };
    }
  );

  // Get transaction history
  server.tool(
    'get_transaction_history',
    {
      limit: z.number().optional().describe('Number of transactions to fetch (default: 10, max: 50)')
    },
    async ({ limit = 10 }) => {
      console.log(`📋 Solana: Getting transaction history (limit: ${limit})`);
      
      if (!solanaConnection || !walletPublicKey) {
        return {
          content: [{
            type: 'text',
            text: '❌ Wallet not connected. Please connect your wallet first.'
          }]
        };
      }

      try {
        const signatures = await solanaConnection.getSignaturesForAddress(
          walletPublicKey,
          { limit: Math.min(limit, 50) }
        );

        const transactions = await Promise.all(
          signatures.slice(0, 5).map(async (sig) => {
            try {
              const transaction = await solanaConnection!.getTransaction(sig.signature, {
                maxSupportedTransactionVersion: 0,
              });
              return {
                signature: sig.signature,
                slot: sig.slot,
                blockTime: sig.blockTime ? new Date(sig.blockTime * 1000).toLocaleString() : 'Unknown',
                status: sig.err ? 'Failed' : 'Success',
                fee: transaction?.meta?.fee ? `${(transaction.meta.fee / LAMPORTS_PER_SOL).toFixed(6)} SOL` : 'Unknown',
              };
            } catch (error) {
              return {
                signature: sig.signature,
                status: 'Unknown',
                error: 'Failed to fetch details',
              };
            }
          })
        );

        const txList = transactions.map((tx, i) => 
          `${i + 1}. ${tx.status} | ${tx.blockTime} | Fee: ${tx.fee}\n   Signature: ${tx.signature.slice(0, 20)}...`
        ).join('\n');

        return {
          content: [{
            type: 'text',
            text: `📋 Recent Transactions (${transactions.length} of ${signatures.length}):\n\n${txList}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Failed to get transaction history: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  // Create SOL transfer (preview only)
  server.tool(
    'create_sol_transfer',
    {
      recipientAddress: z.string().describe('The recipient\'s Solana wallet address'),
      amount: z.number().describe('Amount of SOL to transfer')
    },
    async ({ recipientAddress, amount }) => {
      console.log(`💸 Solana: Creating SOL transfer to ${recipientAddress}, amount: ${amount}`);
      
      if (!solanaConnection || !walletPublicKey) {
        return {
          content: [{
            type: 'text',
            text: '❌ Wallet not connected. Please connect your wallet first.'
          }]
        };
      }

      try {
        const recipientPubkey = new PublicKey(recipientAddress);
        const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: walletPublicKey,
            toPubkey: recipientPubkey,
            lamports,
          })
        );

        // Get recent blockhash
        const { blockhash } = await solanaConnection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = walletPublicKey;

        // Estimate fee
        const fee = await solanaConnection.getFeeForMessage(
          transaction.compileMessage(),
          'confirmed'
        );

        const estimatedFee = (fee?.value || 5000) / LAMPORTS_PER_SOL;

        return {
          content: [{
            type: 'text',
            text: `💸 SOL Transfer Preview:\n\nFrom: ${walletPublicKey.toString()}\nTo: ${recipientAddress}\nAmount: ${amount} SOL\nEstimated Fee: ${estimatedFee.toFixed(6)} SOL\nTotal Cost: ${(amount + estimatedFee).toFixed(6)} SOL\n\n⚠️ This is a preview only. To execute, use the wallet interface to sign and send the transaction.`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Failed to create transfer: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  // Validate wallet address
  server.tool(
    'validate_wallet_address',
    {
      address: z.string().describe('The wallet address to validate')
    },
    async ({ address }) => {
      console.log(`🔍 Solana: Validating address ${address}`);
      
      try {
        const pubkey = new PublicKey(address);
        const isValid = PublicKey.isOnCurve(pubkey);

        return {
          content: [{
            type: 'text',
            text: `🔍 Address Validation:\nAddress: ${address}\nValid: ${isValid ? '✅ Yes' : '❌ No'}\nOn Curve: ${isValid ? '✅ Yes' : '❌ No'}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `🔍 Address Validation:\nAddress: ${address}\nValid: ❌ No\nError: Invalid address format`
          }]
        };
      }
    }
  );

  // Get token accounts
  server.tool(
    'get_token_accounts',
    {},
    async () => {
      console.log('🪙 Solana: Getting token accounts');
      
      if (!solanaConnection || !walletPublicKey) {
        return {
          content: [{
            type: 'text',
            text: '❌ Wallet not connected. Please connect your wallet first.'
          }]
        };
      }

      try {
        const tokenAccounts = await solanaConnection.getParsedTokenAccountsByOwner(
          walletPublicKey,
          { programId: TOKEN_PROGRAM_ID }
        );

        if (tokenAccounts.value.length === 0) {
          return {
            content: [{
              type: 'text',
              text: '🪙 No SPL token accounts found in this wallet.'
            }]
          };
        }

        const accounts = tokenAccounts.value.map((account, i) => {
          const accountData = account.account.data.parsed.info;
          return `${i + 1}. Token Account: ${account.pubkey.toString().slice(0, 20)}...\n   Mint: ${accountData.mint.slice(0, 20)}...\n   Balance: ${accountData.tokenAmount.uiAmount || 0}\n   Decimals: ${accountData.tokenAmount.decimals}`;
        }).join('\n\n');

        return {
          content: [{
            type: 'text',
            text: `🪙 SPL Token Accounts (${tokenAccounts.value.length}):\n\n${accounts}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Failed to get token accounts: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  return server;
}
