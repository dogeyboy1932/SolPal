/**
 * Node Management MCP Server
 * Contains all application node management tools (person, event, community)
 */

import { BaseMCPServer, MCPTool, MCPToolResult, MCPParams } from './BaseMCP';
import { nodeService } from '../services/nodeService';

// Export the initialization function from nodeService
export const initializeNodeManagementFunctions = nodeService.initializeNodeManagementFunctions.bind(nodeService);

export class NodeMCPServer extends BaseMCPServer {
  readonly serverName = "Application Node Management Server";
  readonly serverDescription = "Provides person, event, and community node management";

  /**
   * Set up all tools using server.tool() pattern
   */
  protected setupTools(): void {
    this.tool(
      "list_accessible_nodes",
      {
        type: {
          type: "string",
          description: "Filter by node type (person, event, community) - optional"
        }
      },
      "List all accessible nodes in the network",
      async (args) => await nodeService.listAccessibleNodes(args.type)
    );

    this.tool(
      "create_person_node",
      {
        name: {
          type: "string",
          description: "Person's name",
          required: true
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
      "Create a new person node",
      async (args) => await nodeService.createPersonNodeService(args)
    );

    this.tool(
      "get_all_nodes",
      {},
      "Get all nodes in the network",
      async (args) => await nodeService.getAllNodesService()
    );

    this.tool(
      "search_nodes",
      {
        query: {
          type: "string",
          description: "Search query",
          required: true
        },
        type: {
          type: "string",
          description: "Node type filter"
        }
      },
      "Search nodes by criteria",
      async (args) => await nodeService.searchNodesService(args)
    );

    this.tool(
      "get_nodes_with_wallets",
      {},
      "Get all nodes that have wallet addresses",
      async (args) => await nodeService.getNodesWithWalletsService()
    );

    this.tool(
      "get_node_by_wallet",
      {
        address: {
          type: "string",
          description: "Wallet address to search for",
          required: true
        }
      },
      "Find a node by wallet address",
      async (args) => await nodeService.getNodeByWalletService(args)
    );

    this.tool(
      "get_node_details",
      {
        id: {
          type: "string",
          description: "Node ID to get details for",
          required: true
        }
      },
      "Get detailed information about a specific node",
      async (args) => await nodeService.getNodeDetailsService(args)
    );
  }
}
