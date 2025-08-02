import { MCP_SERVERS } from "../config/mcp_config";
import { TabServerTransport } from "@mcp-b/transports";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

let currentServer: McpServer | null = null;

export async function setupMCPServer(serverType: string): Promise<McpServer> {
  console.log(`👤 Setting up ${serverType} MCP Server...`);

  if (currentServer) {
    console.log('🔌 Closing existing MCP server...');
    await currentServer.close();
    currentServer = null;
  }

  const serverConfig = MCP_SERVERS[serverType as keyof typeof MCP_SERVERS];
  if (!serverConfig) {
    throw new Error(`Unknown server type: ${serverType}`);
  }

  const { label: serverName, serverPath } = serverConfig;
  
  try {
    // Use dynamic import with the serverPath directly
    const module = await import(serverPath);

    console.log(module);

    const createMcpServer = (module as { createMcpServer: () => McpServer }).createMcpServer;

    const transport: TabServerTransport = new TabServerTransport({
      allowedOrigins: ['*']
    });

    const server = createMcpServer();
    await server.connect(transport);

    console.log(`✅ ${serverName} MCP Server connected and ready`);
    currentServer = server;
    return server;
  } catch (error) {
    console.error(`❌ Error setting up ${serverName} MCP Server:`, error);
    throw error;
  }
}
