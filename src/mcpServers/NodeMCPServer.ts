/**
 * Node Management MCP Server
 * Contains all application node management tools (person, event, community)
 */

import { BaseMCPServer, MCPTool, MCPToolResult, MCPParams } from './BaseMCPServer';
import { nodeService } from '../services/nodeService';

// Export the initialization function from nodeService
export const initializeNodeManagementFunctions = nodeService.initializeNodeManagementFunctions.bind(nodeService);

export class NodeMCPServer extends BaseMCPServer {
  readonly serverName = "Application Node Management Server";
  readonly serverDescription = "Provides person, event, and community node management";

  /**
   * Define all tools available in this server
   */
  protected defineTools(): Record<string, MCPTool> {
    return {
      list_accessible_nodes: {
        name: "list_accessible_nodes",
        description: "List all accessible nodes in the network",
        parameters: {
          type: "object",
          properties: {
            type: {
              type: "string",
              description: "Filter by node type (person, event, community) - optional"
            }
          },
          required: []
        }
      },

      create_person_node: {
        name: "create_person_node",
        description: "Create a new person node",
        parameters: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Person's name"
            },
            walletAddress: {
              type: "string",
              description: "Person's wallet address"
            },
            notes: {
              type: "string",
              description: "Additional notes about the person"
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Tags to categorize the person"
            }
          },
          required: ["name"]
        }
      },

      get_all_nodes: {
        name: "get_all_nodes",
        description: "Get all nodes in the network",
        parameters: {
          type: "object",
          properties: {},
          required: []
        }
      },

      search_nodes: {
        name: "search_nodes",
        description: "Search nodes by criteria",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query"
            },
            type: {
              type: "string",
              description: "Node type filter"
            }
          },
          required: []
        }
      },

      get_nodes_with_wallets: {
        name: "get_nodes_with_wallets",
        description: "Get all nodes that have wallet addresses",
        parameters: {
          type: "object",
          properties: {},
          required: []
        }
      },

      get_node_by_wallet: {
        name: "get_node_by_wallet",
        description: "Find a node by wallet address",
        parameters: {
          type: "object",
          properties: {
            address: {
              type: "string",
              description: "Wallet address to search for"
            }
          },
          required: ["address"]
        }
      },

      get_node_details: {
        name: "get_node_details",
        description: "Get detailed information about a specific node",
        parameters: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "Node ID to get details for"
            }
          },
          required: ["id"]
        }
      }
    };
  }

  // Tool implementations

  async list_accessible_nodes(args: { type?: string }): Promise<any> {
    return await nodeService.listAccessibleNodes(args.type);
  }

  async create_person_node(args: { name: string; walletAddress?: string; notes?: string; tags?: string[] }): Promise<any> {
    return await nodeService.createPersonNodeService(args);
  }

  async get_all_nodes(): Promise<any> {
    return await nodeService.getAllNodesService();
  }

  async search_nodes(args: { query?: string; type?: string }): Promise<any> {
    return await nodeService.searchNodesService(args);
  }

  async get_nodes_with_wallets(): Promise<any> {
    return await nodeService.getNodesWithWalletsService();
  }

  async get_node_by_wallet(args: { address: string }): Promise<any> {
    return await nodeService.getNodeByWalletService(args);
  }

  async get_node_details(args: { id: string }): Promise<any> {
    return await nodeService.getNodeDetailsService(args);
  }
}
