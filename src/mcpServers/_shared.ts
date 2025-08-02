import { MCP_SERVERS } from "../config/mcp_config";
import { TabServerTransport } from "@mcp-b/transports";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Static imports for React Native compatibility
import * as githubServer from "./github";
import * as mathServer from "./math";
import * as weatherServer from "./weather";
import * as zoneManagementServer from "./zoneManagement";
import * as solanaServer from "./solana";

let currentServer: McpServer | null = null;

// Server module map for static loading
const SERVER_MODULES = {
  github: githubServer,
  math: mathServer,
  weather: weatherServer,
  zoneManagement: zoneManagementServer,
  solana: solanaServer,
} as const;

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

  const { label: serverName } = serverConfig;
  
  try {
    // Get the module from the static import map
    const module = SERVER_MODULES[serverType as keyof typeof SERVER_MODULES];
    if (!module) {
      throw new Error(`Server module not found: ${serverType}`);
    }

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
