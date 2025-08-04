/**
 * Mobile-compatible MCP Server Adapter with Dynamic Server Management
 * This replaces the web-based TabClientTransport with direct function calls
 * for React Native compatibility using configurable class-based servers
 */

import type { MCPTool, ToolCall, LiveFunctionResponse } from '../types/live-types';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { BaseMCPServer } from './BaseMCPServer';
import { 
  MCP_SERVER_REGISTRY, 
  MCPServerConfig, 
  ServerContext,
} from '../config/mcp_config';
import { getServerConfig, hasServer } from '@/services/mcpService';


export interface MobileServerContext {
  connection: Connection | null;
  publicKey: PublicKey | null;
  signTransaction?: (transaction: Transaction) => Promise<string>;
  nodeContext?: any; // Will be properly typed when integrated with NodeContext
}

/**
 * Mobile MCP Client - Dynamic server management with user-controlled enabling/disabling
 */
export class MobileMCPClient {
  private activeServers: Map<string, BaseMCPServer> = new Map();
  private availableServers: Map<string, () => BaseMCPServer> = new Map();
  private context: MobileServerContext = { connection: null, publicKey: null };
  private serverConfigs: Map<string, MCPServerConfig> = new Map();

  constructor() {
    // Initialize available server factories from registry
    this.initializeServerFactories();
    console.log(`📱 Mobile MCP Client initialized with dynamic server management`);
    console.log(`🔧 Available servers: ${Array.from(this.availableServers.keys()).join(', ')}`);
  }

  /**
   * Initialize server factory functions from the registry
   */
  private initializeServerFactories() {
    Object.values(MCP_SERVER_REGISTRY).forEach(config => {
      this.serverConfigs.set(config.id, config);
      this.availableServers.set(config.id, () => {
        const serverContext: ServerContext = {
          connection: this.context.connection,
          publicKey: this.context.publicKey,
          signTransaction: this.context.signTransaction,
          nodeContext: this.context.nodeContext
        };
        return config.createInstance(serverContext);
      });
    });
  }

  /**
   * Enable a specific MCP server type
   */
  async enableServer(serverType: string): Promise<boolean> {
    try {
      if (!hasServer(serverType)) {
        console.error(`❌ Server type '${serverType}' not found in registry`);
        return false;
      }

      if (this.activeServers.has(serverType)) {
        console.log(`⚠️ Server '${serverType}' is already enabled`);
        return true;
      }

      const factory = this.availableServers.get(serverType);
      if (!factory) {
        console.error(`❌ No factory found for server '${serverType}'`);
        return false;
      }

      const server = factory();
      this.activeServers.set(serverType, server);
      
      console.log(`✅ Enabled MCP server: ${serverType}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to enable server '${serverType}':`, error);
      return false;
    }
  }

  /**
   * Disable a specific MCP server type
   */
  async disableServer(serverType: string): Promise<void> {
    if (this.activeServers.has(serverType)) {
      this.activeServers.delete(serverType);
      console.log(`🔌 Disabled MCP server: ${serverType}`);
    } else {
      console.log(`⚠️ Server '${serverType}' was not enabled`);
    }
  }

  /**
   * Get list of currently active server types
   */
  getActiveServerTypes(): string[] {
    return Array.from(this.activeServers.keys());
  }

  /**
   * Get list of available server types
   */
  getAvailableServerTypes(): string[] {
    return Array.from(this.availableServers.keys());
  }

  /**
   * Check if a server type is currently active
   */
  isServerActive(serverType: string): boolean {
    return this.activeServers.has(serverType);
  }

  /**
   * Get server configuration by type
   */
  getServerConfig(serverType: string): MCPServerConfig | null {
    return this.serverConfigs.get(serverType) || null;
  }

  /**
   * Update the wallet context (called when wallet connects/disconnects)
   */
  updateWalletContext(connection: Connection | null, publicKey: PublicKey | null, signTransaction?: (transaction: Transaction) => Promise<string>) {
    this.context = { connection, publicKey, signTransaction };
    
    console.log(`🔄 Updated wallet context: ${publicKey ? publicKey.toBase58() : 'Disconnected'}`);

    // Update all active servers with new context
    for (const [serverType, server] of this.activeServers) {
      const config = this.serverConfigs.get(serverType);
      if (config?.requiresWallet && connection && publicKey) {
        // Re-initialize wallet-dependent servers with new context
        if ('initialize' in server && typeof server.initialize === 'function') {
          (server as any).initialize(connection, publicKey, signTransaction);
        }
      } else if (config?.requiresWallet && !connection) {
        (server as any).disconnect();
      }
    }
    
    console.log(`🔄 Updated wallet context for ${this.activeServers.size} active servers: ${publicKey ? 'Connected' : 'Disconnected'}`);
  }

  /**
   * Update node context (for node management servers)
   */
  updateNodeContext(nodeContext: any) {
    this.context.nodeContext = nodeContext;
    
    // Update node servers with new context
    for (const [serverType, server] of this.activeServers) {
      if (serverType === 'nodes') {
        // Initialize node server with node context if available
        // This will be implemented when we integrate with NodeContext
      }
    }
    
    console.log(`🔄 Updated node context for active servers`);
  }

  /**
   * Get all available tools from currently active servers
   */
  async getActiveTools(): Promise<MCPTool[]> {
    const allTools: MCPTool[] = [];
    
    for (const [serverType, server] of this.activeServers) {
      const serverTools = server.getAvailableTools();
      allTools.push(...serverTools);
    }
    
    console.log(`📋 Active tools from ${this.activeServers.size} servers: ${allTools.length} total`);
    return allTools;
  }

  /**
   * Legacy method for compatibility - returns all active tools
   */
  async getTools(): Promise<MCPTool[]> {
    return this.getActiveTools();
  }

  /**
   * Execute a tool by name with arguments across all active servers
   */
  async callTool(name: string, args: any): Promise<any> {
    try {
      console.log(`🔧 Calling MCP tool: ${name} across ${this.activeServers.size} active servers`);
      
      // Search through all active servers for the tool
      for (const [serverType, server] of this.activeServers) {
        if (server.hasTool(name)) {
          const result = await server.executeTool(name, args);
          console.log(`✅ Tool '${name}' executed by ${serverType} server:`, result);
          return result;
        }
      }
      
      // Tool not found in any active server
      const activeServerTypes = Array.from(this.activeServers.keys());
      const availableTools = (await this.getActiveTools()).map(t => t.name);
      
      const error = `Tool '${name}' not found in any active server`;
      console.error(`❌ ${error}. Active servers: ${activeServerTypes.join(', ')}`);
      
      return {
        success: false,
        error,
        message: `Tool '${name}' not available. Active servers: ${activeServerTypes.join(', ')}. Available tools: ${availableTools.join(', ')}`
      };
      
    } catch (error) {
      console.error(`❌ Tool execution error for ${name}:`, error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to execute tool: ${name}`
      };
    }
  }

  /**
   * Handle multiple tool calls (Live API format)
   */
  async handleToolCall(toolCall: ToolCall): Promise<LiveFunctionResponse[]> {
    const functionResponses: LiveFunctionResponse[] = [];
    
    for (const call of toolCall.functionCalls) {
      try {
        const result = await this.callTool(call.name, call.args || {});
        
        functionResponses.push({
          response: result,
          id: call.id
        });
      } catch (error) {
        console.error(`❌ Error calling tool ${call.name}:`, error);
        functionResponses.push({
          response: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          id: call.id
        });
      }
    }
    
    return functionResponses;
  }

  /**
   * Get current node connection
   */
  getCurrentConnection(): Connection | null {
    return this.context.connection;
  }

  /**
   * Get current network name
   */
  getCurrentNetwork(): string | null {
    // Since NodeMCPServer no longer handles network connections,
    // we'll need to track this in the context or elsewhere
    return 'devnet'; // Default for now
  }

  /**
   * Test method to verify tool calling works with active servers
   */
  async testToolCalling(): Promise<boolean> {
    console.log('🧪 Testing Mobile MCP Client dynamic server tool calling...');
    
    try {
      const activeServerTypes = this.getActiveServerTypes();
      console.log(`🔧 Active servers: ${activeServerTypes.join(', ')}`);
      
      if (activeServerTypes.length === 0) {
        console.log('⚠️ No servers currently active - test results will be limited');
      }
      
      // Test basic tool availability
      const availableTools = await this.getActiveTools();
      console.log(`✅ Test 1 - Available tools: ${availableTools.length} total`);
      
      // Test a system tool if any server is active
      if (availableTools.length > 0) {
        const testTool = availableTools.find(t => t.name === 'list_available_tools' || t.name === 'list_accessible_nodes');
        if (testTool) {
          const result = await this.callTool(testTool.name, {});
          console.log(`✅ Test 2 - ${testTool.name}:`, result);
        }
      }
      
      console.log('🎉 Mobile MCP Client dynamic server tests completed!');
      return true;
    } catch (error) {
      console.error('❌ Mobile MCP Client test failed:', error);
      return false;
    }
  }

  /**
   * Get statistics about current server state
   */
  getServerStats(): {
    activeServers: number;
    totalServers: number;
    activeServerTypes: string[];
    availableServerTypes: string[];
    totalTools: number;
  } {
    return {
      activeServers: this.activeServers.size,
      totalServers: this.availableServers.size,
      activeServerTypes: this.getActiveServerTypes(),
      availableServerTypes: this.getAvailableServerTypes(),
      totalTools: 0 // Will be calculated async in getActiveTools()
    };
  }

  // Compatibility methods for existing code
  async listTools() {
    return { tools: await this.getTools() };
  }

  async connect() {
    // Connection is handled by individual server enabling
    console.log('📱 MCP Client ready - enable servers individually');
    return true;
  }

  async disconnect() {
    // Disable all active servers
    const activeTypes = this.getActiveServerTypes();
    for (const serverType of activeTypes) {
      await this.disableServer(serverType);
    }
    
    // Clear context
    this.context = { connection: null, publicKey: null };
    console.log('🔌 Disconnected all MCP servers and cleared context');
    return true;
  }
}

/**
 * Factory function to create mobile-compatible MCP client
 */
export async function createMobileMCPClient(): Promise<MobileMCPClient> {
  const client = new MobileMCPClient();
  await client.connect(); // Ensure initialization is complete
  return client;
}
