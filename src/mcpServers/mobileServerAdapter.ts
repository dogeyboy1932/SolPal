/**
 * Mobile-compatible MCP Server Adapter
 * This replaces the web-based TabClientTransport with direct function calls
 * for React Native compatibility using class-based servers
 */

import type { MCPTool, ToolCall, LiveFunctionResponse } from '../types/live-types';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { SolanaMCPServer } from './SolanaMCPServer';
import { NodeMCPServer, initializeNodeManagementFunctions } from './NodeMCPServer';

export interface MobileServerContext {
  connection: Connection | null;
  publicKey: PublicKey | null;
  signTransaction?: (transaction: Transaction) => Promise<string>;
}

/**
 * Mobile MCP Client - Direct function call implementation using class-based servers
 */
export class MobileMCPClient {
  private solanaServer: SolanaMCPServer;
  private nodeServer: NodeMCPServer;
  private context: MobileServerContext = { connection: null, publicKey: null };
  private initialized: boolean = false;

  constructor() {
    // Initialize servers
    this.solanaServer = new SolanaMCPServer();
    this.nodeServer = new NodeMCPServer();
    
    console.log(`📱 Mobile MCP Client initialized with class-based servers`);
  }

  // /**
  //  * Initialize the client with node management functions
  //  */
  // async initialize(nodeContext: {
  //   createPersonNode: (node: any) => Promise<any>,
  //   getNodes: () => any[],
  //   getNodeById: (id: string) => any,
  //   searchNodes: (filters: any) => any[],
  //   getLLMAccessibleNodes: () => any[]
  // }) {
  //   if (!this.initialized) {
  //     initializeNodeManagementFunctions(
  //       nodeContext.createPersonNode,
  //       nodeContext.getNodes,
  //       nodeContext.getNodeById,
  //       nodeContext.searchNodes,
  //       nodeContext.getLLMAccessibleNodes
  //     );
  //     this.initialized = true;
  //     console.log('🔗 Node management functions initialized');
  //   }
  // }

  /**
   * Update the wallet context (called when wallet connects/disconnects)
   */
  updateWalletContext(connection: Connection | null, publicKey: PublicKey | null, signTransaction: (transaction: Transaction) => Promise<string>) {
    this.context = { connection, publicKey, signTransaction };
    
    // Update both servers with new context
    if (connection && publicKey) {
      this.solanaServer.initialize(connection, publicKey, signTransaction);
    }
    
    console.log(`🔄 Updated wallet context: ${publicKey ? 'Connected' : 'Disconnected'}`);
  }

  /**
   * Get all available tools from all servers
   */
  async getTools(): Promise<MCPTool[]> {
    const solanaTools = this.solanaServer.getAvailableTools();
    const nodeTools = this.nodeServer.getAvailableTools();
    
    const allTools = [...solanaTools, ...nodeTools];
    console.log(`📋 Available tools: ${allTools.length} (Solana: ${solanaTools.length}, Node: ${nodeTools.length})`);
    
    return allTools;
  }

  /**
   * Execute a tool by name with arguments
   */
  async callTool(name: string, args: any): Promise<any> {
    try {
      console.log(`🔧 Calling MCP tool: ${name}`, args);
      
      // Try Solana server first
      if (this.solanaServer.hasTool(name)) {
        const result = await this.solanaServer.executeTool(name, args);
        console.log(`✅ Solana tool result for ${name}:`, result);
        return result;
      }
      
      // Try Node server
      if (this.nodeServer.hasTool(name)) {
        const result = await this.nodeServer.executeTool(name, args);
        console.log(`✅ Node tool result for ${name}:`, result);
        return result;
      }
      
      // Tool not found
      const error = `Tool '${name}' not found in any server`;
      console.error(`❌ ${error}`);
      return {
        success: false,
        error,
        message: `Available tools: ${(await this.getTools()).map(t => t.name).join(', ')}`
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

  // Compatibility methods for existing code
  async listTools() {
    return { tools: await this.getTools() };
  }

  async connect() {
    // Already connected via direct implementation
    return true;
  }

  async disconnect() {
    // Clear context
    this.context = { connection: null, publicKey: null };
    return true;
  }

  /**
   * Test method to verify tool calling works
   */
  async testToolCalling(): Promise<boolean> {
    console.log('🧪 Testing Mobile MCP Client tool calling...');
    
    try {
      // Test basic tool from each server
      const result1 = await this.callTool('list_available_tools', {});
      console.log('✅ Test 1 - list_available_tools:', result1);
      
      const result2 = await this.callTool('list_available_nodes', {});
      console.log('✅ Test 2 - list_available_nodes:', result2);
      
      // Test wallet tools (may fail if not connected, but should return proper error)
      const result3 = await this.callTool('get_wallet_balance', {});
      console.log('✅ Test 3 - get_wallet_balance:', result3);
      
      console.log('🎉 Mobile MCP Client tests completed!');
      return true;
    } catch (error) {
      console.error('❌ Mobile MCP Client test failed:', error);
      return false;
    }
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
