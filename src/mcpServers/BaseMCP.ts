/**
 * Base MCP Server Class
 * Provides a clean interface for defining tools with dynamic registration
 * Eliminates hardcoded schemas by using server.tool() pattern
 */

export interface MCPTool {
  name: string;
  description: string;
  parameters: any;
}

export interface MCPToolResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface MCPToolHandler {
  (args: any): Promise<any>;
}

export interface MCPToolDefinition {
  description: string;
  parameters: Record<string, any>;
  handler: MCPToolHandler;
}

/**
 * Convert MCP parameters to Gemini Live API format
 */
export const convertMCPParams = (params: any): any => {
  if (!params || !params.properties) {
    return {};
  }

  const properties: any = {};
  for (const [key, value] of Object.entries(params.properties)) {
    const param = value as any;
    properties[key] = {
      type: param.type || "string",
      description: param.description || key,
      // Add format and other OpenAPI schema properties if they exist
      ...(param.format && { format: param.format }),
      ...(param.enum && { enum: param.enum }),
      ...(param.items && { items: param.items })
    };
  }
  
  return properties;
};

/**
 * Base class for MCP Server implementations
 * Each server uses tool() method to register tools dynamically
 */
export abstract class BaseMCPServer {
  abstract readonly serverName: string;
  abstract readonly serverDescription: string;

  private registeredTools: Map<string, MCPToolDefinition> = new Map();

  constructor() {
    // Call setupTools after construction to register all tools
    this.setupTools();
  }

  /**
   * Abstract method - each server must set up its tools using this.tool()
   * This replaces defineTools() with dynamic registration
   */
  protected abstract setupTools(): void;

  /**
   * Register a tool with the server (server.tool() pattern)
   * Parameters should be in Gemini Live format for direct usage
   */
  protected tool(
    name: string,
    parameters: Record<string, any>,
    description: string,
    handler: MCPToolHandler
  ): void {
    this.registeredTools.set(name, {
      description,
      parameters,
      handler
    });
  }

  /**
   * Get all available tools in this server
   * Convert parameter definitions to proper JSON Schema format
   */
  getAvailableTools(): MCPTool[] {
    const tools: MCPTool[] = [];
    for (const [name, definition] of this.registeredTools) {
      // Convert parameter definition to JSON Schema format
      const properties: Record<string, any> = {};
      const required: string[] = [];
      
      // Parse parameter definitions
      for (const [paramName, paramDef] of Object.entries(definition.parameters)) {
        if (typeof paramDef === 'object' && paramDef !== null) {
          const propertySchema: any = {
            type: paramDef.type || 'string',
            description: paramDef.description || `${paramName} parameter`
          };
          
          // Handle array types with items property
          if (paramDef.type === 'array' && paramDef.items) {
            propertySchema.items = paramDef.items;
          }
          
          properties[paramName] = propertySchema;
          
          // Check if parameter is required
          if (paramDef.required === true) {
            required.push(paramName);
          }
        }
      }
      
      tools.push({
        name,
        description: definition.description,
        parameters: {
          type: 'object',
          properties,
          required
        }
      });
    }
    return tools;
  }

  /**
   * Get tool names only
   */
  getToolNames(): string[] {
    return Array.from(this.registeredTools.keys());
  }

  /**
   * Check if a tool exists in this server
   */
  hasTool(toolName: string): boolean {
    return this.registeredTools.has(toolName);
  }

  /**
   * Execute a tool by name with given arguments
   */
  async executeTool(toolName: string, args: any = {}): Promise<MCPToolResult> {
    try {
      const toolDefinition = this.registeredTools.get(toolName);
      if (!toolDefinition) {
        return {
          success: false,
          error: `Tool '${toolName}' not found in server '${this.serverName}'`
        };
      }

      const result = await toolDefinition.handler(args);
      
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
 * Parameter schema helper functions for Gemini Live format
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
  }),

  array: (items: any, description: string, required = false) => ({
    type: "array",
    items,
    description,
    required
  }),

  enum: (values: string[], description: string, required = false) => ({
    type: "string",
    enum: values,
    description,
    required
  })
};
