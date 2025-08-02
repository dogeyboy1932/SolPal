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

// Types for transaction parsing
interface ParsedTransaction {
  success: boolean;
  amount?: number;
  recipient?: {
    name?: string;
    address: string;
    fromNode: boolean;
  };
  recipientType?: 'person' | 'community' | 'event' | 'address';
  confidence?: number;
  error?: string;
}

interface TransactionSuggestion {
  type: 'context' | 'recent' | 'utility' | 'history';
  title: string;
  description: string;
  command: string;
  priority: 'high' | 'medium' | 'low';
}

// Parse natural language transaction request
function parseTransactionRequest(request: string, nodeContext?: any): ParsedTransaction {
  const requestLower = request.toLowerCase().trim();
  
  // Extract amount with various patterns
  const amountPatterns = [
    /(\d+\.?\d*)\s*sol/i,
    /(\d+\.?\d*)\s*◎/i,
    /(\d+\.?\d*)\s*lamports?/i,
  ];
  
  let amount: number | undefined;
  let amountMatch: RegExpMatchArray | null = null;
  
  for (const pattern of amountPatterns) {
    amountMatch = requestLower.match(pattern);
    if (amountMatch) {
      amount = parseFloat(amountMatch[1]);
      if (pattern.source.includes('lamports')) {
        amount = amount / LAMPORTS_PER_SOL; // Convert lamports to SOL
      }
      break;
    }
  }
  
  if (!amount || amount <= 0) {
    return {
      success: false,
      error: 'Could not parse valid amount from request'
    };
  }
  
  // Extract recipient - try node context first
  let recipient: { name?: string; address: string; fromNode: boolean } | undefined;
  let recipientType: 'person' | 'community' | 'event' | 'address' | undefined;
  
  // Check for node names in context
  if (nodeContext?.availableNodes) {
    for (const node of nodeContext.availableNodes) {
      if (requestLower.includes(node.name.toLowerCase()) && node.walletAddress) {
        recipient = {
          name: node.name,
          address: node.walletAddress,
          fromNode: true
        };
        recipientType = node.type;
        break;
      }
    }
  }
  
  // Check active node
  if (!recipient && nodeContext?.activeNode?.walletAddress) {
    const activeNode = nodeContext.activeNode;
    const patterns = ['to them', 'to active', 'to current', 'to ' + activeNode.name.toLowerCase()];
    
    if (patterns.some(pattern => requestLower.includes(pattern))) {
      recipient = {
        name: activeNode.name,
        address: activeNode.walletAddress,
        fromNode: true
      };
      recipientType = activeNode.type;
    }
  }
  
  // Look for wallet address in request
  if (!recipient) {
    const addressPattern = /[1-9A-HJ-NP-Za-km-z]{32,44}/;
    const addressMatch = request.match(addressPattern);
    
    if (addressMatch) {
      recipient = {
        address: addressMatch[0],
        fromNode: false
      };
      recipientType = 'address';
    }
  }
  
  if (!recipient) {
    return {
      success: false,
      error: 'Could not identify recipient from request'
    };
  }
  
  // Calculate confidence based on parsing quality
  let confidence = 0.5;
  if (amountMatch && recipient.fromNode) confidence += 0.3;
  if (amountMatch) confidence += 0.2;
  if (recipient.fromNode) confidence += 0.2;
  if (requestLower.includes('send') || requestLower.includes('transfer') || requestLower.includes('pay')) confidence += 0.1;
  
  return {
    success: true,
    amount,
    recipient,
    recipientType,
    confidence: Math.min(confidence, 1.0)
  };
}

// Get frequent recipients from transaction history
function getFrequentRecipients(transactions: Array<{ signature: string; recipient: string; amount: number; blockTime?: number }>) {
  const recipientCounts = new Map<string, { address: string; count: number; totalAmount: number }>();
  
  transactions.forEach(tx => {
    const existing = recipientCounts.get(tx.recipient);
    if (existing) {
      existing.count++;
      existing.totalAmount += tx.amount;
    } else {
      recipientCounts.set(tx.recipient, {
        address: tx.recipient,
        count: 1,
        totalAmount: tx.amount
      });
    }
  });
  
  return Array.from(recipientCounts.values())
    .sort((a, b) => b.count - a.count);
}

export function createMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: 'solana-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

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

  // Parse natural language transaction request
  server.tool(
    'parse_transaction_request',
    {
      request: z.string().describe('Natural language transaction request (e.g., "send 0.5 SOL to Alice")'),
      nodeContext: z.object({
        activeNode: z.object({
          id: z.string(),
          name: z.string(),
          type: z.enum(['person', 'event', 'community']),
          walletAddress: z.string().optional(),
        }).optional(),
        availableNodes: z.array(z.object({
          id: z.string(),
          name: z.string(),
          type: z.enum(['person', 'event', 'community']),
          walletAddress: z.string().optional(),
        })).optional(),
      }).optional().describe('Node context for resolving recipients'),
    },
    async ({ request, nodeContext }) => {
      console.log(`🧠 Solana: Parsing transaction request: "${request}"`);
      
      try {
        // Parse the natural language request
        const parsed = parseTransactionRequest(request, nodeContext);
        
        if (!parsed.success) {
          return {
            content: [{
              type: 'text',
              text: `❌ Could not parse transaction request: ${parsed.error}\n\nExample formats:\n- "send 0.5 SOL to Alice"\n- "transfer 1.2 SOL to [wallet address]"\n- "send SOL to the community fund"`
            }]
          };
        }

        const { amount, recipient, recipientType, confidence } = parsed;

        // Type guard - we know these exist if parsing succeeded
        if (!amount || !recipient || !recipientType || confidence === undefined) {
          return {
            content: [{
              type: 'text',
              text: '❌ Internal parsing error - missing required fields'
            }]
          };
        }

        return {
          content: [{
            type: 'text',
            text: `🧠 Transaction Analysis:\n\nParsed Request: "${request}"\nAmount: ${amount} SOL\nRecipient: ${recipient.name || recipient.address}\nRecipient Type: ${recipientType}\nConfidence: ${(confidence * 100).toFixed(1)}%\n\n${confidence < 0.8 ? '⚠️ Low confidence - please verify details' : '✅ High confidence parsing'}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Error parsing request: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  // Create AI-assisted transaction with smart suggestions
  server.tool(
    'create_ai_transaction',
    {
      request: z.string().describe('Natural language transaction request'),
      nodeContext: z.object({
        activeNode: z.object({
          id: z.string(),
          name: z.string(),
          type: z.enum(['person', 'event', 'community']),
          walletAddress: z.string().optional(),
        }).optional(),
        availableNodes: z.array(z.object({
          id: z.string(),
          name: z.string(),
          type: z.enum(['person', 'event', 'community']),
          walletAddress: z.string().optional(),
        })).optional(),
      }).optional(),
      includeValidation: z.boolean().optional().describe('Include AI-powered validation warnings'),
    },
    async ({ request, nodeContext, includeValidation = true }) => {
      console.log(`🤖 Solana: Creating AI transaction for: "${request}"`);
      
      if (!solanaConnection || !walletPublicKey) {
        return {
          content: [{
            type: 'text',
            text: '❌ Wallet not connected. Please connect your wallet first.'
          }]
        };
      }

      try {
        // Parse the request
        const parsed = parseTransactionRequest(request, nodeContext);
        
        if (!parsed.success) {
          return {
            content: [{
              type: 'text',
              text: `❌ Could not understand request: ${parsed.error}\n\nTry rephrasing like:\n- "send 0.5 SOL to Alice"\n- "transfer 1.2 SOL to [address]"`
            }]
          };
        }

        const { amount, recipient } = parsed;

        // Type guard - we know these exist if parsing succeeded
        if (!amount || !recipient) {
          return {
            content: [{
              type: 'text',
              text: '❌ Internal parsing error - missing required fields'
            }]
          };
        }

        // Validate recipient address
        let recipientPubkey: PublicKey;
        try {
          recipientPubkey = new PublicKey(recipient.address);
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `❌ Invalid recipient address: ${recipient.address}`
            }]
          };
        }

        // Check wallet balance
        const balance = await solanaConnection.getBalance(walletPublicKey);
        const solBalance = balance / LAMPORTS_PER_SOL;

        // Create transaction preview
        const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: walletPublicKey,
            toPubkey: recipientPubkey,
            lamports,
          })
        );

        const { blockhash } = await solanaConnection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = walletPublicKey;

        // Estimate fee
        const fee = await solanaConnection.getFeeForMessage(
          transaction.compileMessage(),
          'confirmed'
        );
        const estimatedFee = (fee?.value || 5000) / LAMPORTS_PER_SOL;
        const totalCost = amount + estimatedFee;

        // AI-powered validation and warnings
        let warnings = [];
        let suggestions = [];
        
        if (includeValidation) {
          // Balance check
          if (totalCost > solBalance) {
            warnings.push(`Insufficient balance. Need ${totalCost.toFixed(6)} SOL, have ${solBalance.toFixed(6)} SOL`);
          }
          
          // Large transaction warning
          if (amount > solBalance * 0.5) {
            warnings.push('Large transaction detected (>50% of balance)');
          }
          
          // Suspicious recipient check (basic)
          if (!recipient.fromNode && recipient.address.length === 44) {
            warnings.push('Sending to unknown wallet address - verify recipient');
          }
          
          // Smart suggestions
          if (nodeContext?.activeNode) {
            suggestions.push(`💡 Consider adding a memo: "Payment to ${nodeContext.activeNode.name}"`);
          }
          
          if (amount < 0.001) {
            suggestions.push('💡 Very small amount - consider network fees');
          }
        }

        let result = `🤖 AI Transaction Created:\n\n`;
        result += `📝 Request: "${request}"\n`;
        result += `💰 Amount: ${amount} SOL\n`;
        result += `📍 To: ${recipient.name || recipient.address}\n`;
        result += `💳 From: ${walletPublicKey.toString().slice(0, 20)}...\n`;
        result += `⛽ Estimated Fee: ${estimatedFee.toFixed(6)} SOL\n`;
        result += `💵 Total Cost: ${totalCost.toFixed(6)} SOL\n`;
        result += `💰 Current Balance: ${solBalance.toFixed(6)} SOL\n\n`;

        if (warnings.length > 0) {
          result += `⚠️ Warnings:\n${warnings.map(w => `• ${w}`).join('\n')}\n\n`;
        }

        if (suggestions.length > 0) {
          result += `💡 AI Suggestions:\n${suggestions.map(s => `• ${s}`).join('\n')}\n\n`;
        }

        result += `✅ Transaction ready for signing in wallet interface`;

        return {
          content: [{
            type: 'text',
            text: result
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Failed to create AI transaction: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  // Smart transaction suggestions based on context
  server.tool(
    'suggest_transactions',
    {
      nodeContext: z.object({
        activeNode: z.object({
          id: z.string(),
          name: z.string(),
          type: z.enum(['person', 'event', 'community']),
          walletAddress: z.string().optional(),
        }).optional(),
        recentNodes: z.array(z.object({
          id: z.string(),
          name: z.string(),
          type: z.enum(['person', 'event', 'community']),
          walletAddress: z.string().optional(),
        })).optional(),
      }).optional(),
      transactionHistory: z.array(z.object({
        signature: z.string(),
        recipient: z.string(),
        amount: z.number(),
        blockTime: z.number().optional(),
      })).optional(),
    },
    async ({ nodeContext, transactionHistory }) => {
      console.log('💡 Solana: Generating smart transaction suggestions');
      
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

        let suggestions = [];

        // Context-based suggestions
        if (nodeContext?.activeNode) {
          const node = nodeContext.activeNode;
          
          switch (node.type) {
            case 'person':
              if (node.walletAddress) {
                suggestions.push({
                  type: 'context',
                  title: `Send SOL to ${node.name}`,
                  description: 'Send payment to active person',
                  command: `send 0.1 SOL to ${node.name}`,
                  priority: 'high'
                });
              }
              break;
              
            case 'community':
              if (node.walletAddress) {
                suggestions.push({
                  type: 'context',
                  title: `Donate to ${node.name}`,
                  description: 'Support the community with a donation',
                  command: `donate 0.05 SOL to ${node.name}`,
                  priority: 'medium'
                });
              }
              break;
              
            case 'event':
              if (node.walletAddress) {
                suggestions.push({
                  type: 'context',
                  title: `Pay for ${node.name}`,
                  description: 'Event payment or registration fee',
                  command: `pay 0.2 SOL for ${node.name}`,
                  priority: 'high'
                });
              }
              break;
          }
        }

        // Recent nodes suggestions
        if (nodeContext?.recentNodes) {
          nodeContext.recentNodes.slice(0, 3).forEach(node => {
            if (node.walletAddress && node.id !== nodeContext.activeNode?.id) {
              suggestions.push({
                type: 'recent',
                title: `Quick send to ${node.name}`,
                description: `Send to recently used ${node.type}`,
                command: `send 0.05 SOL to ${node.name}`,
                priority: 'low'
              });
            }
          });
        }

        // Balance-based suggestions
        if (solBalance > 1) {
          suggestions.push({
            type: 'utility',
            title: 'Create token account',
            description: 'Set up for receiving SPL tokens',
            command: 'create token account for USDC',
            priority: 'low'
          });
        }

        if (solBalance < 0.01) {
          suggestions.push({
            type: 'utility',
            title: 'Request devnet SOL',
            description: 'Get SOL for testing',
            command: 'airdrop 1 SOL',
            priority: 'high'
          });
        }

        // History-based suggestions
        if (transactionHistory && transactionHistory.length > 0) {
          const frequentRecipients = getFrequentRecipients(transactionHistory);
          frequentRecipients.slice(0, 2).forEach(recipient => {
            suggestions.push({
              type: 'history',
              title: `Send to frequent recipient`,
              description: `${recipient.count} previous transactions`,
              command: `send 0.1 SOL to ${recipient.address.slice(0, 20)}...`,
              priority: 'medium'
            });
          });
        }

        // Sort by priority
        const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
        suggestions.sort((a, b) => 
          priorityOrder[b.priority] - priorityOrder[a.priority]
        );

        let result = `💡 Smart Transaction Suggestions:\n\n`;
        result += `💰 Current Balance: ${solBalance.toFixed(6)} SOL\n\n`;

        if (suggestions.length === 0) {
          result += `No specific suggestions available.\nTry:\n• "send [amount] SOL to [person/address]"\n• "airdrop 1 SOL" (for devnet testing)`;
        } else {
          suggestions.slice(0, 5).forEach((suggestion, i) => {
            const priority = suggestion.priority === 'high' ? '🔥' : suggestion.priority === 'medium' ? '⭐' : '💡';
            result += `${i + 1}. ${priority} ${suggestion.title}\n`;
            result += `   ${suggestion.description}\n`;
            result += `   Say: "${suggestion.command}"\n\n`;
          });
        }

        return {
          content: [{
            type: 'text',
            text: result
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `❌ Failed to generate suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  return server;
}
