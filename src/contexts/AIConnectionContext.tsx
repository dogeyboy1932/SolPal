import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { setupMCPServer } from '@/mcpServers/_shared';
import { useGemini } from '@/features/ai/GeminiContext';

interface AIConnectionContextType {
  isConnected: boolean;
  activeMCPServers: Record<string, boolean>;
  mcpServerInstances: Record<string, McpServer>;
  connect: () => void;
  disconnect: () => void;
  toggleMCPServer: (serverType: string, enabled?: boolean) => Promise<void>;
}

const AIConnectionContext = createContext<AIConnectionContextType | undefined>(undefined);

interface AIConnectionProviderProps {
  children: ReactNode;
}

export const AIConnectionProvider: React.FC<AIConnectionProviderProps> = ({ children }) => {
  const [activeMCPServers, setActiveMCPServers] = useState<Record<string, boolean>>({});
  const [mcpServerInstances, setMcpServerInstances] = useState<Record<string, McpServer>>({});
  
  // Use Gemini connection state as the source of truth
  const { liveConnected, liveConnect, liveDisconnect } = useGemini();

  const connect = useCallback(async () => {
    // Use the actual Gemini Live connection
    const success = await liveConnect();
    if (success) {
      console.log('🤖 AI Assistant connected via Gemini Live');
    }
  }, [liveConnect]);

  const toggleMCPServer = useCallback(async (serverType: string, enabled?: boolean) => {
    const isEnabled = enabled !== undefined ? enabled : !activeMCPServers[serverType];
    
    try {
      if (isEnabled && !mcpServerInstances[serverType]) {
        // Start MCP server
        console.log(`🚀 Starting ${serverType} MCP server...`);
        const server = await setupMCPServer(serverType);
        setMcpServerInstances(prev => ({
          ...prev,
          [serverType]: server
        }));
      } else if (!isEnabled && mcpServerInstances[serverType]) {
        // Stop MCP server
        console.log(`⏹️ Stopping ${serverType} MCP server...`);
        await mcpServerInstances[serverType].close();
        setMcpServerInstances(prev => {
          const newInstances = { ...prev };
          delete newInstances[serverType];
          return newInstances;
        });
      }

      setActiveMCPServers(prev => ({
        ...prev,
        [serverType]: isEnabled
      }));

    } catch (error) {
      console.error(`❌ Failed to toggle ${serverType} MCP server:`, error);
    }
  }, [activeMCPServers, mcpServerInstances]);

  const disconnect = useCallback(async () => {
    // Disconnect all MCP servers first
    for (const [serverType, isActive] of Object.entries(activeMCPServers)) {
      if (isActive) {
        await toggleMCPServer(serverType, false);
      }
    }
    
    // Then disconnect Gemini Live
    await liveDisconnect();
    console.log('🤖 AI Assistant disconnected');
  }, [activeMCPServers, liveDisconnect, toggleMCPServer]);

  const value: AIConnectionContextType = {
    isConnected: liveConnected, // Use Gemini connection state
    activeMCPServers,
    mcpServerInstances,
    connect,
    disconnect,
    toggleMCPServer,
  };

  return (
    <AIConnectionContext.Provider value={value}>
      {children}
    </AIConnectionContext.Provider>
  );
};

export const useAIConnection = (): AIConnectionContextType => {
  const context = useContext(AIConnectionContext);
  if (!context) {
    throw new Error('useAIConnection must be used within an AIConnectionProvider');
  }
  return context;
};
