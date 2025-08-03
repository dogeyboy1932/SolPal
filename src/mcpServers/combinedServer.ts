import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import type { 
  Node, 
  PersonNode, 
  EventNode, 
  CommunityNode, 
  NodeType,
  NodeFilters,
  CreatePersonNodeData,
  CreateEventNodeData,
  CreateCommunityNodeData,
  UpdatePersonNodeData,
  UpdateEventNodeData,
  UpdateCommunityNodeData
} from '../types/nodes';

// Solana connection (should be injected from wallet context)
let solanaConnection: Connection | null = null;
let walletPublicKey: PublicKey | null = null;
let signAndSendTransaction: ((transaction: Transaction) => Promise<string>) | null = null;

export function setSolanaContext(connection: Connection, publicKey: PublicKey | null, signTxFunction?: (transaction: Transaction) => Promise<string>) {
  solanaConnection = connection;
  walletPublicKey = publicKey;
  if (signTxFunction) {
    signAndSendTransaction = signTxFunction;
  }
}

// Global variables to store Node context state setters and getters
let globalCreatePersonNode: ((node: CreatePersonNodeData) => Promise<PersonNode>) | null = null;
let globalCreateEventNode: ((node: CreateEventNodeData) => Promise<EventNode>) | null = null;
let globalCreateCommunityNode: ((node: CreateCommunityNodeData) => Promise<CommunityNode>) | null = null;
let globalUpdatePersonNode: ((id: string, updates: UpdatePersonNodeData) => Promise<void>) | null = null;
let globalUpdateEventNode: ((id: string, updates: UpdateEventNodeData) => Promise<void>) | null = null;
let globalUpdateCommunityNode: ((id: string, updates: UpdateCommunityNodeData) => Promise<void>) | null = null;
let globalGetNodes: (() => Node[]) | null = null;
let globalGetNodeById: ((id: string) => Node | undefined) | null = null;
let globalSearchNodes: ((filters: NodeFilters) => Node[]) | null = null;
let globalGetLLMAccessibleNodes: (() => Node[]) | null = null;

// Initialize the global node management functions (call this from NodeContext)
export function initializeNodeManagementFunctions(
  createPersonNode: (node: CreatePersonNodeData) => Promise<PersonNode>,
  createEventNode: (node: CreateEventNodeData) => Promise<EventNode>,
  createCommunityNode: (node: CreateCommunityNodeData) => Promise<CommunityNode>,
  updatePersonNode: (id: string, updates: UpdatePersonNodeData) => Promise<void>,
  updateEventNode: (id: string, updates: UpdateEventNodeData) => Promise<void>,
  updateCommunityNode: (id: string, updates: UpdateCommunityNodeData) => Promise<void>,
  getNodes: () => Node[],
  getNodeById: (id: string) => Node | undefined,
  searchNodes: (filters: NodeFilters) => Node[],
  getLLMAccessibleNodes: () => Node[]
) {
  globalCreatePersonNode = createPersonNode;
  globalCreateEventNode = createEventNode;
  globalCreateCommunityNode = createCommunityNode;
  globalUpdatePersonNode = updatePersonNode;
  globalUpdateEventNode = updateEventNode;
  globalUpdateCommunityNode = updateCommunityNode;
  globalGetNodes = getNodes;
  globalGetNodeById = getNodeById;
  globalSearchNodes = searchNodes;
  globalGetLLMAccessibleNodes = getLLMAccessibleNodes;
}

// Helper functions to access nodes
export function getAllNodes(): Node[] {
  if (!globalGetNodes) {
    console.error('Node management functions not initialized');
    return [];
  }
  return globalGetNodes();
}

export function getLLMAccessibleNodes(): Node[] {
  if (!globalGetLLMAccessibleNodes) {
    console.error('Node management functions not initialized');
    return [];
  }
  return globalGetLLMAccessibleNodes();
}

export function getNodeById(id: string): Node | undefined {
  if (!globalGetNodeById) {
    console.error('Node management functions not initialized');
    return undefined;
  }
  return globalGetNodeById(id);
}

export function searchNodes(query: string): Node[] {
  if (!globalSearchNodes) {
    console.error('Node management functions not initialized');
    return [];
  }
  return globalSearchNodes({ searchTerm: query });
}

// Find accessible nodes by name/identifier (for LLM use)
export function findAccessibleNodeByName(name: string): Node | undefined {
  const accessibleNodes = getLLMAccessibleNodes();
  return accessibleNodes.find(node => 
    node.name.toLowerCase().includes(name.toLowerCase())
  );
}

// Find nodes by wallet address
export function getNodeByWalletAddress(address: string): Node | undefined {
  const nodes = getAllNodes();
  return nodes.find(node => {
    if (node.type === 'person') {
      return (node as PersonNode).walletAddress === address;
    }
    return false;
  });
}

// Find nodes by name (fuzzy match)
export function getNodeByName(name: string): Node | undefined {
  const nodes = getAllNodes();
  const nameLower = name.toLowerCase();
  return nodes.find(node => node.name.toLowerCase().includes(nameLower));
}

// Get nodes with wallet addresses (for transaction targets)
export function getNodesWithWallets(): Node[] {
  const nodes = getAllNodes();
  return nodes.filter(node => {
    if (node.type === 'person') {
      return !!(node as PersonNode).walletAddress;
    }
    return false;
  });
}

// Helper function to execute SOL transfer via MCP tool
export async function executeSOLTransfer(recipient: string, amount: number): Promise<string> {
  if (!solanaConnection || !walletPublicKey || !signAndSendTransaction) {
    throw new Error('Wallet not connected or transaction signing not available');
  }

  try {
    const recipientPubKey = new PublicKey(recipient);
    const lamports = amount * LAMPORTS_PER_SOL;
    
    // Check sender balance
    const balance = await solanaConnection.getBalance(walletPublicKey);
    if (balance < lamports) {
      throw new Error(`Insufficient balance. Current: ${(balance / LAMPORTS_PER_SOL).toFixed(6)} SOL, Required: ${amount} SOL`);
    }

    // Get recent blockhash
    const { blockhash } = await solanaConnection.getLatestBlockhash();
    
    // Create transaction
    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: walletPublicKey
    }).add(
      SystemProgram.transfer({
        fromPubkey: walletPublicKey,
        toPubkey: recipientPubKey,
        lamports
      })
    );

    // Execute the transaction
    const signature = await signAndSendTransaction(transaction);
    return signature;
  } catch (error) {
    console.error('Error executing SOL transfer:', error);
    throw error;
  }
}

// COMBINED SOLANA + NODE MANAGEMENT MCP SERVER
export function createMcpServer(): McpServer {
  const server = new McpServer(
    {
      name: 'solana-node-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // =================
  // SYSTEM TOOLS
  // =================

//   // List available tools
//   server.tool(
//     'list_available_tools',
//     {},
//     async () => {
//       console.log('🔧 System: Listing available tools');
      
//       const toolDescriptions = [
//         '🏦 **SOLANA WALLET TOOLS:**',
//         '• get_wallet_balance - Check your SOL balance and wallet info',
//         '• get_wallet_address - Get your current wallet address',
//         '• get_transaction_history - View recent transactions (limit 1-50)',
//         '• validate_wallet_address - Check if address is valid Solana format',
//         '• create_sol_transfer - Preview/execute SOL transfers (execute=true to send)',
//         '',
//         '👥 **CONTACT MANAGEMENT TOOLS:**',
//         '• list_accessible_nodes - List all nodes you have access to (with IDs and details)',
//         '• create_person_node - Add new contacts with wallet addresses',
//         '• create_event_node - Create events and meetups',
//         '• create_community_node - Create communities and groups',
//         '• edit_person_node - Update contact details',
//         '• edit_event_node - Update event details',
//         '• edit_community_node - Update community details',
//         '• get_all_nodes - List all your contacts/communities/events',
//         '• search_nodes - Find contacts by name/wallet/notes',
//         '• get_nodes_with_wallets - Show contacts with wallet addresses',
//         '• get_node_by_wallet - Find contact by wallet address',
//         '• get_node_details - Get complete detailed information about a node',
//         '',
//         '🔧 **SYSTEM TOOLS:**',
//         '• list_available_tools - Show this tool list and usage examples',
//         '',
//         '💡 **USAGE EXAMPLES:**',
//         '• "Show my balance" → get_wallet_balance()',
//         '• "Send 0.5 SOL to Alice" → search_nodes("Alice") + create_sol_transfer()',
//         '• "Who can I send money to?" → get_nodes_with_wallets()',
//         '• "Add contact John with wallet ABC..." → create_person_node()',
//         '• "Create event for hackathon" → create_event_node()',
//         '• "Update John\'s wallet address" → edit_person_node()',
//         '• "Show my recent transactions" → get_transaction_history()',
//       ];

//       return {
//         content: [{
//           type: 'text',
//           text: `🔧 Available Tools & Capabilities:\n\n${toolDescriptions.join('\n')}`
//         }]
//       };
//     }
//   );

  // =================
  // SOLANA TOOLS
  // =================

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
            text: `💰 Wallet Balance:\\nAddress: ${walletPublicKey.toString()}\\nBalance: ${solBalance.toFixed(6)} SOL\\nNetwork: ${solanaConnection.rpcEndpoint}`
          }]
        };
      } catch (error) {
        console.error('Error getting wallet balance:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Error getting wallet balance: ${error instanceof Error ? error.message : 'Unknown error'}`
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
      console.log('🏠 Solana: Getting wallet address');
      
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
          text: `🏠 Wallet Address: ${walletPublicKey.toString()}`
        }]
      };
    }
  );

  // Get transaction history
  server.tool(
    'get_transaction_history',
    {
      limit: z.number().min(1).max(50).default(10).describe('Number of transactions to fetch (1-50)')
    },
    async ({ limit = 10 }) => {
      console.log(`📜 Solana: Getting transaction history (limit: ${limit})`);
      
      if (!solanaConnection || !walletPublicKey) {
        return {
          content: [{
            type: 'text',
            text: '❌ Wallet not connected. Please connect your wallet first.'
          }]
        };
      }

      try {
        const signatures = await solanaConnection.getSignaturesForAddress(walletPublicKey, { limit });
        
        if (signatures.length === 0) {
          return {
            content: [{
              type: 'text',
              text: '📜 No transaction history found for this wallet.'
            }]
          };
        }

        const transactionDetails = await Promise.all(
          signatures.map(async (sig) => {
            try {
              const tx = await solanaConnection!.getTransaction(sig.signature, {
                commitment: 'confirmed',
                maxSupportedTransactionVersion: 0
              });
              
              return {
                signature: sig.signature,
                blockTime: sig.blockTime,
                status: sig.err ? 'Failed' : 'Success',
                confirmationStatus: sig.confirmationStatus,
                slot: sig.slot,
                fee: tx?.meta?.fee ? tx.meta.fee / LAMPORTS_PER_SOL : 'Unknown'
              };
            } catch (error) {
              return {
                signature: sig.signature,
                blockTime: sig.blockTime,
                status: 'Error fetching details',
                confirmationStatus: sig.confirmationStatus,
                slot: sig.slot,
                fee: 'Unknown'
              };
            }
          })
        );

        const formattedTransactions = transactionDetails.map(tx => {
          const date = tx.blockTime ? new Date(tx.blockTime * 1000).toLocaleString() : 'Unknown';
          return `• ${tx.signature.substring(0, 12)}... | ${tx.status} | ${date} | Fee: ${tx.fee} SOL`;
        }).join('\\n');

        return {
          content: [{
            type: 'text',
            text: `📜 Recent Transactions (${transactionDetails.length}):\\n${formattedTransactions}`
          }]
        };
      } catch (error) {
        console.error('Error getting transaction history:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Error getting transaction history: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  // Validate wallet address
  server.tool(
    'validate_wallet_address',
    {
      address: z.string().describe('Solana wallet address to validate')
    },
    async ({ address }) => {
      console.log(`🔍 Solana: Validating wallet address ${address}`);
      
      try {
        const publicKey = new PublicKey(address);
        const isValid = PublicKey.isOnCurve(publicKey);
        
        return {
          content: [{
            type: 'text',
            text: `🔍 Address Validation: ${address}\\n${isValid ? '✅ Valid Solana address' : '❌ Invalid address format'}`
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `🔍 Address Validation: ${address}\\n❌ Invalid address format`
          }]
        };
      }
    }
  );

  // Create SOL transfer (executes actual transaction)
  server.tool(
    'create_sol_transfer',
    {
      recipient: z.string().describe('Recipient wallet address'),
      amount: z.number().positive().describe('Amount of SOL to transfer'),
      execute: z.boolean().default(false).describe('Set to true to execute the transaction, false for preview only')
    },
    async ({ recipient, amount, execute = false }) => {
      console.log(`💸 Solana: ${execute ? 'Executing' : 'Previewing'} SOL transfer - ${amount} SOL to ${recipient}`);
      
      if (!solanaConnection || !walletPublicKey) {
        return {
          content: [{
            type: 'text',
            text: '❌ Wallet not connected. Please connect your wallet first.'
          }]
        };
      }

      try {
        const recipientPubKey = new PublicKey(recipient);
        const lamports = amount * LAMPORTS_PER_SOL;
        
        // Check sender balance
        const balance = await solanaConnection.getBalance(walletPublicKey);
        if (balance < lamports) {
          return {
            content: [{
              type: 'text',
              text: `❌ Insufficient balance. Current: ${(balance / LAMPORTS_PER_SOL).toFixed(6)} SOL, Required: ${amount} SOL`
            }]
          };
        }

        // Get recent blockhash for fee estimation
        const { blockhash } = await solanaConnection.getLatestBlockhash();
        
        // Create transaction
        const transaction = new Transaction({
          recentBlockhash: blockhash,
          feePayer: walletPublicKey
        }).add(
          SystemProgram.transfer({
            fromPubkey: walletPublicKey,
            toPubkey: recipientPubKey,
            lamports
          })
        );

        // Estimate fee
        const feeCalculator = await solanaConnection.getFeeForMessage(transaction.compileMessage());
        const estimatedFee = feeCalculator.value ? feeCalculator.value / LAMPORTS_PER_SOL : 0.000005;

        // If execute is false, return preview
        if (!execute) {
          return {
            content: [{
              type: 'text',
              text: `💸 SOL Transfer Preview:\\n` +
                    `From: ${walletPublicKey.toString()}\\n` +
                    `To: ${recipient}\\n` +
                    `Amount: ${amount} SOL\\n` +
                    `Estimated Fee: ${estimatedFee.toFixed(9)} SOL\\n` +
                    `Total Cost: ${(amount + estimatedFee).toFixed(9)} SOL\\n\\n` +
                    `ℹ️ To execute this transfer, call this tool again with execute=true`
            }]
          };
        }

        // Execute the transaction
        if (!signAndSendTransaction) {
          return {
            content: [{
              type: 'text',
              text: '❌ Transaction signing not available. Please ensure wallet is properly connected.'
            }]
          };
        }

        console.log('🚀 Executing SOL transfer transaction...');
        const signature = await signAndSendTransaction(transaction);
        
        return {
          content: [{
            type: 'text',
            text: `✅ SOL Transfer Successful!\\n` +
                  `From: ${walletPublicKey.toString()}\\n` +
                  `To: ${recipient}\\n` +
                  `Amount: ${amount} SOL\\n` +
                  `Transaction Signature: ${signature}\\n` +
                  `🔗 View on Solscan: https://solscan.io/tx/${signature}?cluster=devnet`
          }]
        };

      } catch (error) {
        console.error('Error with SOL transfer:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Error ${execute ? 'executing' : 'previewing'} transfer: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  // =================
  // NODE MANAGEMENT TOOLS
  // =================

  // List accessible nodes
  server.tool(
    'list_accessible_nodes',
    {
      type: z.enum(['person', 'event', 'community']).optional().describe('Filter by node type (optional)'),
    },
    async ({ type }) => {
      console.log('📋 Node Management: Listing accessible nodes');
      
      try {
        const accessibleNodes = getLLMAccessibleNodes();
        let filteredNodes = accessibleNodes;
        
        if (type) {
          filteredNodes = accessibleNodes.filter(node => node.type === type);
        }

        if (filteredNodes.length === 0) {
          return {
            content: [{
              type: 'text',
              text: type 
                ? `📂 No ${type} nodes accessible to you. Ask the user to grant access to nodes in the Manual Operations tab.`
                : '📂 No nodes accessible to you. Ask the user to grant access to nodes in the Manual Operations tab.'
            }]
          };
        }

        const nodeList = filteredNodes.map(node => {
          let details = `**${node.name}** (ID: ${node.id})\n`;
          details += `  • Type: ${node.type}\n`;
          details += `  • Created: ${node.createdAt.toLocaleDateString()}\n`;
          
          if (node.description) {
            details += `  • Description: ${node.description}\n`;
          }

          if (node.type === 'person') {
            const person = node as PersonNode;
            if (person.walletAddress) details += `  • Wallet: ${person.walletAddress}\n`;
            if (person.relationship) details += `  • Relationship: ${person.relationship}\n`;
            if (person.email) details += `  • Email: ${person.email}\n`;
            if (person.phone) details += `  • Phone: ${person.phone}\n`;
            if (person.notes) details += `  • Notes: ${person.notes}\n`;
          } else if (node.type === 'event') {
            const event = node as EventNode;
            details += `  • Date: ${event.date.toLocaleDateString()}\n`;
            if (event.location) details += `  • Location: ${event.location}\n`;
            if (event.eventType) details += `  • Type: ${event.eventType}\n`;
            if (event.attendees?.length) details += `  • Attendees: ${event.attendees.length}\n`;
          } else if (node.type === 'community') {
            const community = node as CommunityNode;
            details += `  • Type: ${community.communityType}\n`;
            details += `  • Public: ${community.isPublic ? 'Yes' : 'No'}\n`;
            if (community.memberCount) details += `  • Members: ${community.memberCount}\n`;
          }

          return details;
        }).join('\n');

        return {
          content: [{
            type: 'text',
            text: `📋 **Accessible Nodes (${filteredNodes.length} total)**:\n\n${nodeList}\n\n💡 You can use these IDs and names with other tools like get_node_details, edit_person_node, etc.`
          }]
        };

      } catch (error) {
        console.error('❌ Error listing accessible nodes:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Error listing accessible nodes: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

//   // Create person node
//   server.tool(
//     'create_person_node',
//     {
//       name: z.string().describe('Full name of the person'),
//       walletAddress: z.string().optional().describe('Solana wallet address (base58 encoded)'),
//       notes: z.string().optional().describe('Additional notes about the person'),
//       tags: z.array(z.string()).optional().describe('Tags to categorize the person'),
//     },
//     async ({ name, walletAddress, notes, tags }) => {
//       console.log(`👤 Node Management: Creating person node ${name}`);
      
//       try {
//         if (!globalCreatePersonNode) {
//           return {
//             content: [{
//               type: 'text',
//               text: '❌ Node management not initialized. Please ensure the app is properly loaded.'
//             }]
//           };
//         }

//         const personData = {
//           name,
//           walletAddress: walletAddress || '',
//           notes: notes || '',
//           tags: tags || []
//         };

//         const newPerson = await globalCreatePersonNode(personData);

//         return {
//           content: [{
//             type: 'text',
//             text: `✅ Created person node: ${newPerson.name}\\n` +
//                   `ID: ${newPerson.id}\\n` +
//                   `Wallet: ${newPerson.walletAddress || 'None'}\\n` +
//                   `Tags: ${newPerson.tags?.join(', ') || 'None'}`
//           }]
//         };
//       } catch (error) {
//         console.error('Error creating person node:', error);
//         return {
//           content: [{
//             type: 'text',
//             text: `❌ Error creating person node: ${error instanceof Error ? error.message : 'Unknown error'}`
//           }]
//         };
//       }
//     }
//   );

  // Get all nodes
  server.tool(
    'get_all_nodes',
    {},
    async () => {
      console.log('📋 Node Management: Getting all nodes');
      
      try {
        const nodes = getAllNodes();
        
        if (nodes.length === 0) {
          return {
            content: [{
              type: 'text',
              text: '📋 No nodes found. Create some contacts to get started!'
            }]
          };
        }

        const nodesList = nodes.map(node => {
          const walletInfo = node.type === 'person' && (node as PersonNode).walletAddress 
            ? ` | 💳 ${(node as PersonNode).walletAddress}`
            : '';
          
          return `• ${node.type === 'person' ? '👤' : node.type === 'event' ? '📅' : '🏢'} ${node.name}${walletInfo}`;
        }).join('\\n');

        return {
          content: [{
            type: 'text',
            text: `📋 All Nodes (${nodes.length}):\\n${nodesList}`
          }]
        };
      } catch (error) {
        console.error('Error getting nodes:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Error getting nodes: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  // Search nodes
  server.tool(
    'search_nodes',
    {
      query: z.string().describe('Search term to find nodes by name or other attributes')
    },
    async ({ query }) => {
      console.log(`🔍 Node Management: Searching nodes for "${query}"`);
      
      try {
        const results = searchNodes(query);
        
        if (results.length === 0) {
          return {
            content: [{
              type: 'text',
              text: `🔍 No nodes found matching "${query}"`
            }]
          };
        }

        const resultsList = results.map(node => JSON.stringify(node, null, 2)).join('\n');

        return {
          content: [{
            type: 'text',
            text: `🔍 Search Results for "${query}" (${results.length}):\\n${resultsList}`
          }]
        };
      } catch (error) {
        console.error('Error searching nodes:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Error searching nodes: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

//   // Get nodes with wallets (for transactions)
//   server.tool(
//     'get_nodes_with_wallets',
//     {},
//     async () => {
//       console.log('💳 Node Management: Getting nodes with wallet addresses');
      
      
//       try {
//         const walletNodes = getNodesWithWallets();
        
//         if (walletNodes.length === 0) {
//           return {
//             content: [{
//               type: 'text',
//               text: '💳 No contacts with wallet addresses found.'
//             }]
//           };
//         }

//         const walletList = walletNodes.map(node => {
//           const person = node as PersonNode;
//           return `• 👤 ${person.name} | 💳 ${person.walletAddress}`;
//         }).join('\\n');

//         return {
//           content: [{
//             type: 'text',
//             text: `💳 Contacts with Wallets (${walletNodes.length}):\\n${walletList}`
//           }]
//         };
//       } catch (error) {
//         console.error('Error getting wallet nodes:', error);
//         return {
//           content: [{
//             type: 'text',
//             text: `❌ Error getting wallet nodes: ${error instanceof Error ? error.message : 'Unknown error'}`
//           }]
//         };
//       }
//     }
//   );

//   // Get node by wallet address
//   server.tool(
//     'get_node_by_wallet',
//     {
//       address: z.string().describe('Wallet address to find the associated contact')
//     },
//     async ({ address }) => {
//       console.log(`🔍 Node Management: Finding node by wallet address ${address}`);
      
//       try {
//         const node = getNodeByWalletAddress(address);
        
//         if (!node) {
//           return {
//             content: [{
//               type: 'text',
//               text: `🔍 No contact found with wallet address: ${address}`
//             }]
//           };
//         }

//         const person = node as PersonNode;
//         return {
//           content: [{
//             type: 'text',
//             text: `🔍 Found Contact:\\n` +
//                   `👤 Name: ${person.name}\\n` +
//                   `💳 Wallet: ${person.walletAddress}\\n` +
//                   `📝 Notes: ${person.notes || 'None'}\\n` +
//                   `🏷️ Tags: ${person.tags?.join(', ') || 'None'}`
//           }]
//         };
//       } catch (error) {
//         console.error('Error finding node by wallet:', error);
//         return {
//           content: [{
//             type: 'text',
//             text: `❌ Error finding contact: ${error instanceof Error ? error.message : 'Unknown error'}`
//           }]
//         };
//       }
//     }
//   );

  // Get detailed node information by ID
  server.tool(
    'get_node_details',
    {
      id: z.string().describe('ID of the node to get detailed information for')
    },
    async ({ id }) => {
      console.log(`📋 Getting detailed node information for ID: ${id}`);

      
      try {
        const node = getNodeById(id);
        
        if (!node) {
          return {
            content: [{
              type: 'text',
              text: `❌ Node with ID "${id}" not found.`
            }]
          };
        }

        let details = `📋 **${node.name}** (${node.type})\n`;
        details += `🆔 ID: ${node.id}\n`;
        details += `📅 Created: ${node.createdAt.toLocaleDateString()}\n`;
        details += `📝 Description: ${node.description || 'None'}\n`;

        if (node.type === 'person') {
          const person = node as PersonNode;
          details += `💳 Wallet Address: ${person.walletAddress || 'None'}\n`;
          details += `📧 Email: ${person.email || 'None'}\n`;
          details += `📱 Phone: ${person.phone || 'None'}\n`;
          details += `🤝 Relationship: ${person.relationship || 'None'}\n`;
          details += `📝 Notes: ${person.notes || 'None'}\n`;
          details += `🏷️ Tags: ${person.tags?.join(', ') || 'None'}`;
        } else if (node.type === 'event') {
          const event = node as EventNode;
          details += `📅 Date: ${event.date.toLocaleDateString()}\n`;
          details += `⏰ End Date: ${event.endDate?.toLocaleDateString() || 'Not set'}\n`;
          details += `📍 Location: ${event.location || 'TBD'}\n`;
          details += `🎯 Event Type: ${event.eventType}\n`;
          details += `👤 Organizer: ${event.organizer || 'None'}\n`;
          details += `📋 Requirements: ${event.requirements || 'None'}\n`;
          details += `👥 Attendees: ${event.attendees?.length || 0}\n`;
          details += `🏷️ Tags: ${event.tags?.join(', ') || 'None'}`;
        } else if (node.type === 'community') {
          const community = node as CommunityNode;
          details += `🏘️ Community Type: ${community.communityType}\n`;
          details += `🔓 Visibility: ${community.isPublic ? 'Public' : 'Private'}\n`;
          details += `👥 Members: ${community.members?.length || 0}\n`;
          details += `🌐 Website: ${community.website || 'None'}\n`;
          details += `📱 Discord: ${community.discord || 'None'}\n`;
          details += `🐦 Twitter: ${community.twitter || 'None'}\n`;
          details += `🪙 Governance Token: ${community.governanceToken || 'None'}\n`;
          details += `🏷️ Tags: ${community.tags?.join(', ') || 'None'}`;
        }

        return {
          content: [{
            type: 'text',
            text: details
          }]
        };
      } catch (error) {
        console.error('Error getting node details:', error);
        return {
          content: [{
            type: 'text',
            text: `❌ Error getting node details: ${error instanceof Error ? error.message : 'Unknown error'}`
          }]
        };
      }
    }
  );

  console.log('🚀 Combined Solana + Node Management MCP Server created with tools:', [
    'list_available_tools',
    'get_wallet_balance',
    'get_wallet_address', 
    'get_transaction_history',
    'validate_wallet_address',
    'create_sol_transfer',
    'list_accessible_nodes',
    'create_person_node',
    'get_all_nodes',
    'search_nodes',
    'get_nodes_with_wallets',
    'get_node_by_wallet',
    'get_node_details'
  ]);

  return server;
}

// Helper functions for direct tool access in React Native
export function getServerTools() {
  return [
    {
      name: 'list_available_tools',
      description: 'Get a list of all available tools and their usage examples',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    {
      name: 'get_wallet_balance',
      description: 'Get the SOL balance of the connected wallet',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    {
      name: 'get_wallet_address',
      description: 'Get the public address of the connected wallet',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    {
      name: 'get_transaction_history',
      description: 'Get recent transaction history for the connected wallet',
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of transactions to return',
            default: 10
          }
        },
        required: []
      }
    },
    {
      name: 'validate_wallet_address',
      description: 'Validate if a given string is a valid Solana wallet address',
      inputSchema: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            description: 'The wallet address to validate'
          }
        },
        required: ['address']
      }
    },
    {
      name: 'create_sol_transfer',
      description: 'Create and optionally execute a SOL transfer transaction',
      inputSchema: {
        type: 'object',
        properties: {
          recipient: {
            type: 'string',
            description: 'The recipient wallet address'
          },
          amount: {
            type: 'number',
            description: 'The amount of SOL to transfer'
          },
          execute: {
            type: 'boolean',
            description: 'Set to true to execute the transaction, false for preview only',
            default: false
          }
        },
        required: ['recipient', 'amount']
      }
    },
    {
      name: 'list_accessible_nodes',
      description: 'List all nodes (contacts, events, communities) that you have access to, including their IDs and complete details',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['person', 'event', 'community'],
            description: 'Filter by node type (optional - shows all types if not specified)'
          }
        }
      }
    },
    {
      name: 'create_person_node',
      description: 'Create a new person contact node',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'The person\'s name'
          },
          walletAddress: {
            type: 'string',
            description: 'The person\'s Solana wallet address'
          },
          notes: {
            type: 'string',
            description: 'Optional notes about the person'
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional tags for categorization'
          }
        },
        required: ['name']
      }
    },
    {
      name: 'get_all_nodes',
      description: 'Get all nodes in the system',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    {
      name: 'search_nodes',
      description: 'Search for nodes based on filters',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['person', 'event', 'community'],
            description: 'Filter by node type'
          },
          name: {
            type: 'string',
            description: 'Search by name (partial match)'
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter by tags'
          }
        },
        required: []
      }
    },
    {
      name: 'get_nodes_with_wallets',
      description: 'Get all nodes that have wallet addresses',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    {
      name: 'get_node_by_wallet',
      description: 'Find a node by its wallet address',
      inputSchema: {
        type: 'object',
        properties: {
          walletAddress: {
            type: 'string',
            description: 'The wallet address to search for'
          }
        },
        required: ['walletAddress']
      }
    },
    {
      name: 'get_node_details',
      description: 'Get complete detailed information about a specific node by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The ID of the node to get detailed information for'
          }
        },
        required: ['id']
      }
    },
    {
      name: 'create_event_node',
      description: 'Create a new event node',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name/title of the event'
          },
          description: {
            type: 'string',
            description: 'Description of the event'
          },
          date: {
            type: 'string',
            description: 'Date of the event (ISO string)'
          },
          endDate: {
            type: 'string',
            description: 'End date of the event (ISO string)'
          },
          location: {
            type: 'string',
            description: 'Location of the event'
          },
          eventType: {
            type: 'string',
            enum: ['conference', 'meetup', 'party', 'business', 'social', 'other'],
            description: 'Type of event'
          },
          organizer: {
            type: 'string',
            description: 'Organizer name or person ID'
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Tags to categorize the event'
          }
        },
        required: ['name', 'date', 'eventType']
      }
    },
    {
      name: 'create_community_node',
      description: 'Create a new community node',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the community'
          },
          description: {
            type: 'string',
            description: 'Description of the community'
          },
          communityType: {
            type: 'string',
            enum: ['dao', 'nft', 'social', 'gaming', 'defi', 'business', 'other'],
            description: 'Type of community'
          },
          isPublic: {
            type: 'boolean',
            description: 'Whether the community is public',
            default: true
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Tags to categorize the community'
          }
        },
        required: ['name', 'communityType']
      }
    },
    {
      name: 'edit_person_node',
      description: 'Edit an existing person node',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'ID of the person to update'
          },
          name: {
            type: 'string',
            description: 'New name for the person'
          },
          walletAddress: {
            type: 'string',
            description: 'New Solana wallet address'
          },
          notes: {
            type: 'string',
            description: 'Updated notes about the person'
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Updated tags for the person'
          }
        },
        required: ['id']
      }
    },
    {
      name: 'edit_event_node',
      description: 'Edit an existing event node',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'ID of the event to update'
          },
          name: {
            type: 'string',
            description: 'New name for the event'
          },
          description: {
            type: 'string',
            description: 'New description for the event'
          },
          date: {
            type: 'string',
            description: 'New date for the event (ISO string)'
          },
          endDate: {
            type: 'string',
            description: 'New end date for the event (ISO string)'
          },
          location: {
            type: 'string',
            description: 'New location for the event'
          },
          eventType: {
            type: 'string',
            enum: ['conference', 'meetup', 'party', 'business', 'social', 'other'],
            description: 'New type of event'
          },
          organizer: {
            type: 'string',
            description: 'New organizer name or person ID'
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'New tags for the event'
          }
        },
        required: ['id']
      }
    },
    {
      name: 'edit_community_node',
      description: 'Edit an existing community node',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'ID of the community to update'
          },
          name: {
            type: 'string',
            description: 'New name for the community'
          },
          description: {
            type: 'string',
            description: 'New description for the community'
          },
          communityType: {
            type: 'string',
            enum: ['dao', 'nft', 'social', 'gaming', 'defi', 'business', 'other'],
            description: 'New type of community'
          },
          isPublic: {
            type: 'boolean',
            description: 'New public/private setting'
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'New tags for the community'
          }
        },
        required: ['id']
      }
    }
  ];
}

// export async function executeServerTool(name: string, args: any) {
//   switch (name) {
//     case 'list_available_tools':
//       const toolDescriptions = [
//         '🏦 **SOLANA WALLET TOOLS:**',
//         '• get_wallet_balance - Check your SOL balance and wallet info',
//         '• get_wallet_address - Get your current wallet address',
//         '• get_transaction_history - View recent transactions (limit 1-50)',
//         '• validate_wallet_address - Check if address is valid Solana format',
//         '• create_sol_transfer - Preview/execute SOL transfers (execute=true to send)',
//         '',
//         '👥 **CONTACT MANAGEMENT TOOLS:**',
//         '• create_person_node - Add new contacts with wallet addresses',
//         '• create_event_node - Create events and meetups',
//         '• create_community_node - Create communities and groups',
//         '• edit_person_node - Update contact details',
//         '• edit_event_node - Update event details',
//         '• edit_community_node - Update community details',
//         '• get_all_nodes - List all your contacts/communities/events',
//         '• search_nodes - Find contacts by name/wallet/notes',
//         '• get_nodes_with_wallets - Show contacts with wallet addresses',
//         '• get_node_by_wallet - Find contact by wallet address',
//         '• get_node_details - Get complete detailed information about a node',
//         '',
//         '🔧 **SYSTEM TOOLS:**',
//         '• list_available_tools - Show this tool list and usage examples',
//         '',
//         '💡 **USAGE EXAMPLES:**',
//         '• "Show my balance" → get_wallet_balance()',
//         '• "Send 0.5 SOL to Alice" → search_nodes("Alice") + create_sol_transfer()',
//         '• "Who can I send money to?" → get_nodes_with_wallets()',
//         '• "Add contact John with wallet ABC..." → create_person_node()',
//         '• "Create event for hackathon" → create_event_node()',
//         '• "Update John\'s wallet address" → edit_person_node()',
//         '• "Show my recent transactions" → get_transaction_history()',
//       ];

//       return {
//         content: [{
//           type: 'text',
//           text: `🔧 Available Tools & Capabilities:\n\n${toolDescriptions.join('\n')}`
//         }]
//       };

//     case 'get_wallet_balance':
//       if (!solanaConnection || !walletPublicKey) {
//         throw new Error('Wallet not connected');
//       }
//       const balance = await solanaConnection.getBalance(walletPublicKey);
//       return {
//         content: [{
//           type: 'text',
//           text: `💰 Wallet Balance: ${(balance / LAMPORTS_PER_SOL).toFixed(4)} SOL`
//         }]
//       };

//     case 'get_wallet_address':
//       if (!walletPublicKey) {
//         throw new Error('Wallet not connected');
//       }
//       return {
//         content: [{
//           type: 'text',
//           text: `📍 Wallet Address: ${walletPublicKey.toBase58()}`
//         }]
//       };

//     case 'validate_wallet_address':
//       try {
//         const pubkey = new PublicKey(args.address);
//         return {
//           content: [{
//             type: 'text',
//             text: `✅ Valid Solana address: ${pubkey.toBase58()}`
//           }]
//         };
//       } catch {
//         return {
//           content: [{
//             type: 'text',
//             text: `❌ Invalid Solana address: ${args.address}`
//           }]
//         };
//       }

//     case 'list_accessible_nodes':
//       try {
//         const allNodes = getAllNodes();
//         const typeFilter = args.type as NodeType | undefined;
        
//         let filteredNodes = accessibleNodes;
//         if (typeFilter) {
//           filteredNodes = accessibleNodes.filter(node => node.type === typeFilter);
//         }

//         if (filteredNodes.length === 0) {
//           return {
//             content: [{
//               type: 'text',
//               text: typeFilter 
//                 ? `📂 No ${typeFilter} nodes accessible to you. Ask the user to grant access to nodes in the Manual Operations tab.`
//                 : '📂 No nodes accessible to you. Ask the user to grant access to nodes in the Manual Operations tab.'
//             }]
//           };
//         }

//         const nodeList = filteredNodes.map(node => {
//           let details = `**${node.name}** (ID: ${node.id})\n`;
//           details += `  • Type: ${node.type}\n`;
//           details += `  • Created: ${node.createdAt.toLocaleDateString()}\n`;
          
//           if (node.description) {
//             details += `  • Description: ${node.description}\n`;
//           }

//           if (node.type === 'person') {
//             const person = node as PersonNode;
//             if (person.walletAddress) details += `  • Wallet: ${person.walletAddress}\n`;
//             if (person.relationship) details += `  • Relationship: ${person.relationship}\n`;
//             if (person.email) details += `  • Email: ${person.email}\n`;
//             if (person.phone) details += `  • Phone: ${person.phone}\n`;
//             if (person.notes) details += `  • Notes: ${person.notes}\n`;
//           } else if (node.type === 'event') {
//             const event = node as EventNode;
//             details += `  • Date: ${event.date.toLocaleDateString()}\n`;
//             if (event.location) details += `  • Location: ${event.location}\n`;
//             if (event.eventType) details += `  • Type: ${event.eventType}\n`;
//             if (event.attendees?.length) details += `  • Attendees: ${event.attendees.length}\n`;
//           } else if (node.type === 'community') {
//             const community = node as CommunityNode;
//             details += `  • Type: ${community.communityType}\n`;
//             details += `  • Public: ${community.isPublic ? 'Yes' : 'No'}\n`;
//             if (community.memberCount) details += `  • Members: ${community.memberCount}\n`;
//           }

//           return details;
//         }).join('\n');

//         return {
//           content: [{
//             type: 'text',
//             text: `📋 **Accessible Nodes (${filteredNodes.length} total)**:\n\n${nodeList}\n\n💡 You can use these IDs and names with other tools like get_node_details, edit_person_node, etc.`
//           }]
//         };

//       } catch (error) {
//         console.error('❌ Error listing accessible nodes:', error);
//         return {
//           content: [{
//             type: 'text',
//             text: `❌ Error listing accessible nodes: ${error instanceof Error ? error.message : 'Unknown error'}`
//           }]
//         };
//       }

//     case 'create_person_node':
//       if (!globalCreatePersonNode) {
//         throw new Error('Node management not initialized');
//       }
//       const newNode = await globalCreatePersonNode(args);
//       return {
//         content: [{
//           type: 'text',
//           text: `✅ Created person node: ${newNode.name} (ID: ${newNode.id})`
//         }]
//       };

//     case 'get_all_nodes':
//       if (!globalGetNodes) {
//         throw new Error('Node management not initialized');
//       }
//       const allNodes = globalGetNodes();
//       return {
//         content: [{
//           type: 'text',
//           text: `📋 Found ${allNodes.length} nodes:\n${allNodes.map(n => `• ${n.name} (${n.type})`).join('\n')}`
//         }]
//       };

//     case 'search_nodes':
//       if (!globalSearchNodes) {
//         throw new Error('Node management not initialized');
//       }
//       const filteredNodes = globalSearchNodes(args);
//       return {
//         content: [{
//           type: 'text',
//           text: `🔍 Found ${filteredNodes.length} matching nodes:\n${filteredNodes.map(n => `• ${n.name} (${n.type})`).join('\n')}`
//         }]
//       };

//     case 'get_nodes_with_wallets':
//       if (!globalGetNodes) {
//         throw new Error('Node management not initialized');
//       }
//       const nodesWithWallets = globalGetNodes().filter(node => 
//         node.type === 'person' && (node as PersonNode).walletAddress
//       );
//       return {
//         content: [{
//           type: 'text',
//           text: `💳 Found ${nodesWithWallets.length} contacts with wallets:\n${nodesWithWallets.map(n => `• ${n.name}: ${(n as PersonNode).walletAddress}`).join('\n')}`
//         }]
//       };

//     case 'get_node_by_wallet':
//       if (!globalGetNodes) {
//         throw new Error('Node management not initialized');
//       }
//       const nodeByWallet = globalGetNodes().find(node => 
//         node.type === 'person' && (node as PersonNode).walletAddress === args.walletAddress
//       );
//       if (!nodeByWallet) {
//         return {
//           content: [{
//             type: 'text',
//             text: `❌ No contact found with wallet address: ${args.walletAddress}`
//           }]
//         };
//       }
//       const person = nodeByWallet as PersonNode;
//       return {
//         content: [{
//           type: 'text',
//           text: `🔍 Found Contact:\n👤 Name: ${person.name}\n💳 Wallet: ${person.walletAddress}\n📝 Notes: ${person.notes || 'None'}\n🏷️ Tags: ${person.tags?.join(', ') || 'None'}`
//         }]
//       };

//     case 'get_node_details':
//       if (!globalGetNodeById) {
//         throw new Error('Node management not initialized');
//       }
//       const detailedNode = globalGetNodeById(args.id);
//       if (!detailedNode) {
//         return {
//           content: [{
//             type: 'text',
//             text: `❌ Node with ID "${args.id}" not found.`
//           }]
//         };
//       }

//       let details = `📋 **${detailedNode.name}** (${detailedNode.type})\n`;
//       details += `🆔 ID: ${detailedNode.id}\n`;
//       details += `📅 Created: ${detailedNode.createdAt.toLocaleDateString()}\n`;
//       details += `📝 Description: ${detailedNode.description || 'None'}\n`;

//       if (detailedNode.type === 'person') {
//         const person = detailedNode as PersonNode;
//         details += `💳 Wallet: ${person.walletAddress || 'None'}\n`;
//         details += `📧 Email: ${person.email || 'None'}\n`;
//         details += `📱 Phone: ${person.phone || 'None'}\n`;
//         details += `🤝 Relationship: ${person.relationship || 'None'}\n`;
//         details += `📝 Notes: ${person.notes || 'None'}\n`;
//         details += `🏷️ Tags: ${person.tags?.join(', ') || 'None'}`;
//       } else if (detailedNode.type === 'event') {
//         const event = detailedNode as EventNode;
//         details += `📅 Date: ${event.date.toLocaleDateString()}\n`;
//         details += `⏰ End Date: ${event.endDate?.toLocaleDateString() || 'Not set'}\n`;
//         details += `📍 Location: ${event.location || 'TBD'}\n`;
//         details += `🎯 Type: ${event.eventType}\n`;
//         details += `👤 Organizer: ${event.organizer || 'None'}\n`;
//         details += `📋 Requirements: ${event.requirements || 'None'}\n`;
//         details += `👥 Attendees: ${event.attendees?.length || 0}\n`;
//         details += `🏷️ Tags: ${event.tags?.join(', ') || 'None'}`;
//       } else if (detailedNode.type === 'community') {
//         const community = detailedNode as CommunityNode;
//         details += `🏘️ Type: ${community.communityType}\n`;
//         details += `🔓 Visibility: ${community.isPublic ? 'Public' : 'Private'}\n`;
//         details += `👥 Members: ${community.members?.length || 0}\n`;
//         details += `🌐 Website: ${community.website || 'None'}\n`;
//         details += `📱 Discord: ${community.discord || 'None'}\n`;
//         details += `🐦 Twitter: ${community.twitter || 'None'}\n`;
//         details += `🪙 Token: ${community.governanceToken || 'None'}\n`;
//         details += `🏷️ Tags: ${community.tags?.join(', ') || 'None'}`;
//       }

//       return {
//         content: [{
//           type: 'text',
//           text: details
//         }]
//       };

//     case 'create_event_node':
//       if (!globalCreateEventNode) {
//         throw new Error('Node management not initialized');
//       }
//       const newEvent = await globalCreateEventNode(args);
//       return {
//         content: [{
//           type: 'text',
//           text: `✅ Created event node: ${newEvent.name} (ID: ${newEvent.id})\n📅 Date: ${newEvent.date.toLocaleDateString()}\n📍 Location: ${newEvent.location || 'TBD'}`
//         }]
//       };

//     case 'create_community_node':
//       if (!globalCreateCommunityNode) {
//         throw new Error('Node management not initialized');
//       }
//       const newCommunity = await globalCreateCommunityNode(args);
//       return {
//         content: [{
//           type: 'text',
//           text: `✅ Created community node: ${newCommunity.name} (ID: ${newCommunity.id})\n🏘️ Type: ${newCommunity.communityType}\n🔓 Public: ${newCommunity.isPublic ? 'Yes' : 'No'}`
//         }]
//       };

//     case 'edit_person_node':
//       if (!globalUpdatePersonNode) {
//         throw new Error('Node management not initialized');
//       }
//       await globalUpdatePersonNode(args.id, args);
//       return {
//         content: [{
//           type: 'text',
//           text: `✅ Updated person node with ID: ${args.id}`
//         }]
//       };

//     case 'edit_event_node':
//       if (!globalUpdateEventNode) {
//         throw new Error('Node management not initialized');
//       }
//       const eventUpdates = { ...args };
//       delete eventUpdates.id;
//       if (eventUpdates.date) eventUpdates.date = new Date(eventUpdates.date);
//       if (eventUpdates.endDate) eventUpdates.endDate = new Date(eventUpdates.endDate);
//       await globalUpdateEventNode(args.id, eventUpdates);
//       return {
//         content: [{
//           type: 'text',
//           text: `✅ Updated event node with ID: ${args.id}`
//         }]
//       };

//     case 'edit_community_node':
//       if (!globalUpdateCommunityNode) {
//         throw new Error('Node management not initialized');
//       }
//       const communityUpdates = { ...args };
//       delete communityUpdates.id;
//       await globalUpdateCommunityNode(args.id, communityUpdates);
//       return {
//         content: [{
//           type: 'text',
//           text: `✅ Updated community node with ID: ${args.id}`
//         }]
//       };

//     default:
//       throw new Error(`Unknown tool: ${name}`);
//   }
// }