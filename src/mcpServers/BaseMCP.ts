/**
 * Base MCP Server Class
 * Provides a clean interface for defining tools without hardcoding schemas
 */

export interface MCPTool {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, any>;
    required: string[];
  };
}

export interface MCPToolResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

/**
 * Base class for MCP Server implementations
 * Each server contains tools as methods and can automatically discover its schema
 */
export abstract class BaseMCPServer {
  abstract readonly serverName: string;
  abstract readonly serverDescription: string;

  /**
   * Abstract method - each server must define its tools
   * This replaces decorator-based discovery for simplicity
   */
  protected abstract defineTools(): Record<string, MCPTool>;

  /**
   * Get all available tools in this server
   */
  getAvailableTools(): MCPTool[] {
    const toolDefinitions = this.defineTools();
    return Object.values(toolDefinitions);
  }

  /**
   * Get tool names only
   */
  getToolNames(): string[] {
    const toolDefinitions = this.defineTools();
    return Object.keys(toolDefinitions);
  }

  /**
   * Check if a tool exists in this server
   */
  hasTool(toolName: string): boolean {
    const toolDefinitions = this.defineTools();
    return toolName in toolDefinitions;
  }

  /**
   * Execute a tool by name with given arguments
   */
  async executeTool(toolName: string, args: any = {}): Promise<MCPToolResult> {
    try {
      const method = (this as any)[toolName];
      if (!method || typeof method !== 'function') {
        return {
          success: false,
          error: `Tool '${toolName}' not found in server '${this.serverName}'`
        };
      }

      // Check if it's a defined tool
      const toolDefinitions = this.defineTools();
      if (!toolDefinitions[toolName]) {
        return {
          success: false,
          error: `Method '${toolName}' is not a defined MCP tool`
        };
      }

      const result = await method.call(this, args);
      
      return {
        success: true,
        data: result,
        message: `Tool '${toolName}' executed successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Tool '${toolName}' execution failed`
      };
    }
  }

  /**
   * Get information about this server
   */
  getServerInfo() {
    return {
      name: this.serverName,
      description: this.serverDescription,
      toolCount: this.getAvailableTools().length,
      tools: this.getAvailableTools()
    };
  }
}

/**
 * Parameter schema helper functions
 */
export const MCPParams = {
  string: (description: string, required = false) => ({
    type: "string",
    description,
    required
  }),
  
  number: (description: string, required = false) => ({
    type: "number", 
    description,
    required
  }),
  
  boolean: (description: string, required = false) => ({
    type: "boolean",
    description, 
    required
  }),

  object: (properties: Record<string, any>, required: string[] = []) => ({
    type: "object",
    properties,
    required
  })
};
