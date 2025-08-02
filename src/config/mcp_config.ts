// Configuration

export type MCP_SERVERS_CONFIG = {
  label: string;
  position: { x: number; y: number };
  url: string;
  serverPath: string;
};

export const MCP_SERVERS: Record<string, MCP_SERVERS_CONFIG> = {
    'combined': {
      label: 'Solana + Node Management MCP',
      position: { x: 400, y: 350 },
      url: 'mcp://combined-mcp',
      serverPath: './combinedServer.ts',
    }
  } as const;
