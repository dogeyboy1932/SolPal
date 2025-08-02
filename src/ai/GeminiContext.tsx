import { createContext, useContext, useState, useEffect, type ReactNode, useRef, useMemo, useCallback } from 'react';

import { TabClientTransport } from '@mcp-b/transports';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { setupMCPServer } from '../mcpServers/_shared';
import type { ToolCall, LiveFunctionResponse, MCPTool } from '../lib/live-types';
import { MultimodalLiveClient } from './liveClient';

import { CONST_CONFIG } from '../config/ai_config';
import { createLiveConfigWithTools } from '../lib/utils';
// Audio functionality - commented out for React Native compatibility
// import { audioContext } from '../lib/utils';
// import VolMeterWorket from "../lib/audio/worklets/vol-meter";
// import { AudioRecorder } from '../lib/audio/audio-recorder';
// import { AudioStreamer } from '../lib/audio/audio-streamer';

interface GeminiContextType {
  mcpConnect: (serverType: string) => Promise<boolean>;
  mcpDisconnect: () => Promise<void>;
  liveConnect: (mcpTools?: MCPTool[]) => Promise<boolean>;
  liveDisconnect: () => Promise<void>;
  
  liveConnected: boolean; 
  setLiveConnected: (connected: boolean) => void;
  
  tools: MCPTool[];
  setTools: (tools: MCPTool[]) => void;

  sendMessage: (message: string) => void;
  setApiKey: (apiKey: string) => void;

  liveClient: MultimodalLiveClient;
  messages: Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date}>;
}

const GeminiContext = createContext<GeminiContextType | undefined>(undefined);

export const GeminiProvider = ({ children }: { children: ReactNode }) => {
  const [apiKey, setApiKey] = useState("");
  const [mcpClient, setMcpClient] = useState<Client | null>(null);
  const [currentServer, setCurrentServer] = useState<McpServer | null>(null);
  const [liveConnected, setLiveConnected] = useState(false);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [messages, setMessages] = useState<Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date}>>([]);

  // Create live client with API key
  const liveClient = useMemo(
    () => new MultimodalLiveClient({ url: CONST_CONFIG.uri, apiKey: apiKey }),
    [apiKey],
  );

  // Auto-connect to combined MCP server when provider mounts
  useEffect(() => {
    const initializeCombinedServer = async () => {
      if (tools.length === 0) { // Only connect if we don't have tools yet
        console.log('🚀 Auto-connecting to combined MCP server...');
        try {
          // Call mcpConnect directly since it will be defined when this runs
          console.log(`🔌 Connecting to combined MCP Server...`);
          
          // Create and connect to the MCP server
          const server = await setupMCPServer('combined');
          setCurrentServer(server);      

          await new Promise(resolve => setTimeout(resolve, 500));
          
          const transport = new TabClientTransport({
            targetOrigin: window.location.origin
          });
          
          const newClient = new Client({
            name: 'WebAppClient',
            version: '1.0.0',
          });

          await newClient.connect(transport);
          setMcpClient(newClient);

          // Get tools
          const toolList = await newClient.listTools();
          const newTools = toolList.tools.map((tool: any) => ({
            name: tool.name,
            description: tool.description || tool.name,
            parameters: tool.inputSchema || { type: "object", properties: {}, required: [] }
          }));
          
          setTools(newTools);
          console.log(`✅ Auto-connected to combined server with ${newTools.length} tools:`, newTools.map(t => t.name));
        } catch (error) {
          console.warn('⚠️ Failed to auto-connect to combined server:', error);
        }
      }
    };

    initializeCombinedServer();
  }, []); // Run once on mount

  // Set up live client event handlers
  useEffect(() => {
    const callTool = async (toolCall: ToolCall) => {
      if (mcpClient) {
        const functionResponses: LiveFunctionResponse[] = [];
        for (const call of toolCall.functionCalls) {
          try {
            const toolResult = await mcpClient.callTool({
              name: call.name,
              arguments: call.args as any || {}
            });
            
            functionResponses.push({
              id: call.id,
              response: toolResult
            });
          } catch (error) {
            console.error(`❌ Tool call failed for ${call.name}:`, error);
            functionResponses.push({
              id: call.id,
              response: { 
                error: `Tool call failed: ${error instanceof Error ? error.message : String(error)}` 
              }
            });
          }
        }
        
        liveClient.sendToolResponse({ functionResponses });
      } else {
        console.warn('⚠️ No MCP client available for tool calls');
        
        const errorResponses: LiveFunctionResponse[] = toolCall.functionCalls.map(call => ({
          id: call.id,
          response: { error: "MCP client not available" }
        }));
        liveClient.sendToolResponse({ functionResponses: errorResponses });
      }
    };

    const onTurnComplete = (fullResponse: string) => {
      if (fullResponse && fullResponse.trim()) {
        const newMessage = {
          id: `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role: 'assistant' as const,
          content: fullResponse.trim(),
          timestamp: new Date()
        };
        setMessages(prev => [...prev, newMessage]);
      }
    };

    liveClient
      .on("toolcall", callTool)
      .on("turncomplete", onTurnComplete)
      .on("setupcomplete", () => {
        console.log('✅ Gemini Live setup complete');
        setLiveConnected(true);
      })
      .on("close", () => {
        console.log('🔌 Gemini Live disconnected');
        setLiveConnected(false);
      });

    return () => {
      liveClient
        .off("toolcall", callTool)
        .off("turncomplete", onTurnComplete);
    };
  }, [liveClient, mcpClient]);

  // MCP Connection
  const mcpConnect = useCallback(async (serverType: string): Promise<boolean> => {
    try {
      console.log(`🔌 Connecting to ${serverType} MCP Server...`);
      
      // Disconnect previous
      await mcpDisconnect();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create and connect to the MCP server
      const server = await setupMCPServer(serverType);
      setCurrentServer(server);      

      await new Promise(resolve => setTimeout(resolve, 500));
      
      const transport = new TabClientTransport({
        targetOrigin: window.location.origin
      });
      
      const newClient = new Client({
        name: 'WebAppClient',
        version: '1.0.0',
      });

      await newClient.connect(transport);
      setMcpClient(newClient);

      // Get tools
      const toolList = await newClient.listTools();
      const newTools = toolList.tools.map((tool: any) => ({
        name: tool.name,
        description: tool.description || tool.name,
        parameters: tool.inputSchema || { type: "object", properties: {}, required: [] }
      }));
      
      setTools(newTools);
      console.log(`✅ Connected to ${serverType} with ${newTools.length} tools:`, newTools.map(t => t.name));

      return true;
    } catch (error) {
      console.error('❌ MCP Connection failed:', error);
      return false;
    }
  }, []);

  const mcpDisconnect = useCallback(async () => {
    if (liveConnected) await liveDisconnect();
    
    if (mcpClient) {
      try {
        mcpClient.close();
      } catch (error) {
        console.warn('Error closing MCP client:', error);
      }
      setMcpClient(null);
    }
    
    if (currentServer) {
      try {
        if (typeof currentServer.close === 'function') {
          await currentServer.close();
        }
      } catch (error) {
        console.warn('Error closing MCP server:', error);
      }
      setCurrentServer(null);
    }
    
    setTools([]);
    await new Promise(resolve => setTimeout(resolve, 200));
  }, [liveConnected, mcpClient, currentServer]);

  // Live Connection
  const liveDisconnect = useCallback(async () => {
    liveClient.disconnect();
    setLiveConnected(false);
  }, [liveClient]);

  const liveConnect = useCallback(async (mcpTools?: MCPTool[]): Promise<boolean> => {
    const toolsToUse = mcpTools || tools;
    
    if (!apiKey) {
      console.error('❌ No API key provided');
      return false;
    }

    try {
      const liveConfig = createLiveConfigWithTools(toolsToUse);
      console.log('� Live config with tools:', liveConfig);
      
      await liveDisconnect();
      await liveClient.connect(liveConfig);      
      
      return true;      
    } catch (error) {
      console.error('❌ WebSocket connection failed:', error);
      return false;
    }
  }, [apiKey, liveClient, tools, liveDisconnect]);

  // Send message
  const sendMessage = useCallback(async (message: string) => {
    if (liveConnected) {
      // Add user message to chat
      const userMessage = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'user' as const,
        content: message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      liveClient.send([{ text: message }]);
    } else {
      console.warn('⚠️ WebSocket not connected');
    }
  }, [liveConnected, liveClient]);

  return (
    <GeminiContext.Provider value={{
      mcpConnect,
      mcpDisconnect,
      liveConnect,
      liveDisconnect,
      
      liveConnected,
      setLiveConnected,
      
      tools,
      setTools,

      sendMessage,
      setApiKey,    
      liveClient,
      messages,
    }}>
      {children}
    </GeminiContext.Provider>
  );
};

export const useGemini = () => {
  const context = useContext(GeminiContext);
  if (context === undefined) {
    throw new Error('useGemini must be used within a GeminiProvider');
  }
  return context;
};
