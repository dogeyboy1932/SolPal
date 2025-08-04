/**
 * MCP Configuration - Available Server Registry
 * Central registry for all available MCP ser    ],
    requiresWallet: false,
    dependencies: []
  }

  // Future servers can be added here:
  // ai: { ... }, // AI assistant tools
  // utility: { ... }, // General utility tools
  // system: { ... }, // System monitoring tools
};igurations
 */

import { BaseMCPServer } from '../mcpServers/BaseMCP';
import { SolanaMCPServer } from '../mcpServers/SolanaMCP';
import { NodeMCPServer } from '../mcpServers/NodeMCP';
import { WeatherMCPServer } from '../mcpServers/WeatherMCP';
import type { Connection, PublicKey, Transaction } from '@solana/web3.js';

export interface MCPServerConfig {
  id: string;
  name: string;
  description: string;
  category: 'solana' | 'nodes' | 'weather' | 'system' | 'ai' | 'utility';
  createInstance: (context?: any) => BaseMCPServer;
  capabilities: string[];
  dependencies?: string[];
  requiresWallet?: boolean;
}

export interface ServerContext {
  connection?: Connection | null;
  publicKey?: PublicKey | null;
  signTransaction?: (transaction: Transaction) => Promise<string>;
  nodeContext?: any; // Will be typed properly when we integrate with NodeContext
}

/**
 * Registry of all available MCP servers
 */
export const MCP_SERVER_REGISTRY: Record<string, MCPServerConfig> = {
  solana: {
    id: 'solana',
    name: 'Solana Blockchain Tools',
    description: 'Complete Solana wallet operations including balance checks, transfers, and transaction management',
    category: 'solana',
    createInstance: (context?: ServerContext) => {
      const server = new SolanaMCPServer();
      if (context?.connection && context?.publicKey && context?.signTransaction) {
        server.initialize(context.connection, context.publicKey, context.signTransaction);
      }
      return server;
    },
    capabilities: [
      'Wallet balance checking',
      'SOL transfers',
      'SPL token transfers', 
      'Transaction history',
      'Address validation',
      'Network operations',
      'Airdrop requests'
    ],
    requiresWallet: true,
    dependencies: []
  },

  nodes: {
    id: 'nodes',
    name: 'Node Management System',
    description: 'Manage contacts, events, and communities with full CRUD operations and search capabilities',
    category: 'nodes',
    createInstance: (context?: ServerContext) => {
      const server = new NodeMCPServer();
      // Node server will be initialized with nodeContext when available
      return server;
    },
    capabilities: [
      'Contact management (Person nodes)',
      'Event creation and management',
      'Community management',
      'Node search and filtering',
      'Access control for AI',
      'Node relationship tracking'
    ],
    requiresWallet: false,
    dependencies: []
  },

  weather: {
    id: 'weather',
    name: 'Weather Information',
    description: 'Current weather conditions, forecasts, and weather alerts for US locations',
    category: 'weather',
    createInstance: () => {
      return new WeatherMCPServer();
    },
    capabilities: [
      'Current weather conditions',
      'Multi-day weather forecasts',
      'Weather alerts by state',
      'US location support',
      'National Weather Service data'
    ],
    requiresWallet: false,
    dependencies: []
  }
  //   },
  //   capabilities: [
  //     'Wallet balance checking',
  //     'SOL transfers',
  //     'SPL token transfers', 
  //     'Transaction history',
  //     'Address validation',
  //     'Network operations',
  //     'Airdrop requests'
  //   ],
  //   requiresWallet: true,
  //   dependencies: []
  // },

  // Future servers can be added here:
  // ai: { ... }, // AI assistant tools
  // utility: { ... }, // General utility tools
  // system: { ... }, // System monitoring tools
};

// Legacy exports for compatibility
export const MCP_SERVERS = MCP_SERVER_REGISTRY;
export type MCP_SERVERS_CONFIG = Record<string, MCPServerConfig>;
