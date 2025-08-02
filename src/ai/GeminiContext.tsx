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

  liveClient: MultimodalLiveClient | null;
  messages: Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date}>;
}

const GeminiContext = createContext<GeminiContextType | undefined>(undefined);

export const GeminiProvider = ({ children }: { children: ReactNode }) => {
  const [apiKey, setApiKey] = useState("");
  const [mcpClient, setMcpClient] = useState<Client | null>(null);
  const [mcpServer, setMcpServer] = useState<McpServer | null>(null);
  const [liveConnected, setLiveConnected] = useState(false);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [messages, setMessages] = useState<Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date}>>([]);

  const liveClientRef = useRef<MultimodalLiveClient | null>(null);

  // Initialize live client when API key is provided
  useEffect(() => {
    if (apiKey && !liveClientRef.current) {
      liveClientRef.current = new MultimodalLiveClient({ apiKey });
      
      // Set up event listeners
      liveClientRef.current.on('content', (data) => {
        if (data.modelTurn?.parts) {
          const textContent = data.modelTurn.parts
            .filter((part: any) => part.text)
            .map((part: any) => part.text)
            .join('');
          
          if (textContent) {
            const newMessage = {
              id: Date.now().toString(),
              role: 'assistant' as const,
              content: textContent,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, newMessage]);
          }
        }
      });

      liveClientRef.current.on('toolcall', async (toolCall: ToolCall) => {
        console.log('Tool call received:', toolCall);
        
        if (mcpClient) {
          try {
            const responses: LiveFunctionResponse[] = [];
            
            for (const functionCall of toolCall.functionCalls) {
              console.log(`Executing MCP tool: ${functionCall.name}`);
              
              const result = await mcpClient.callTool({
                name: functionCall.name,
                arguments: (functionCall.args as { [x: string]: unknown }) || {}
              });
              
              responses.push({
                id: functionCall.id,
                response: result.content || result
              });
            }
            
            // Send responses back to Gemini
            liveClientRef.current?.sendToolResponse({
              functionResponses: responses
            });
            
          } catch (error) {
            console.error('Error executing MCP tool:', error);
            
            // Send error response
            const errorResponses = toolCall.functionCalls.map(fc => ({
              id: fc.id,
              response: { error: `Failed to execute ${fc.name}: ${error}` }
            }));
            
            liveClientRef.current?.sendToolResponse({
              functionResponses: errorResponses
            });
          }
        }
      });

      liveClientRef.current.on('setupcomplete', () => {
        console.log('✅ Gemini Live setup complete');
        setLiveConnected(true);
      });

      liveClientRef.current.on('close', (reason) => {
        console.log('🔌 Gemini Live disconnected:', reason);
        setLiveConnected(false);
      });

      liveClientRef.current.on('open', () => {
        console.log('🔗 Gemini Live connected');
      });
    }
  }, [apiKey, mcpClient]);

  const mcpConnect = useCallback(async (serverType: string): Promise<boolean> => {
    try {
      console.log(`🔌 Connecting to ${serverType} MCP Server...`);
      
      if (mcpServer) {
        console.log('🔌 Closing existing MCP server...');
        await mcpServer.close();
      }

      const server = await setupMCPServer(serverType);
      setMcpServer(server);

      // Set up MCP client
      const transport = new TabClientTransport({
        targetOrigin: '*' // For React Native compatibility
      });

      const client = new Client({
        name: "mobile-app-client",
        version: "1.0.0"
      }, {
        capabilities: {
          tools: {}
        }
      });

      await client.connect(transport);
      
      // Get available tools
      const toolsResult = await client.listTools();
      const mcpTools: MCPTool[] = toolsResult.tools?.map(tool => ({
        name: tool.name,
        description: tool.description || `Execute ${tool.name}`,
        parameters: tool.inputSchema
      })) || [];

      setTools(mcpTools);
      setMcpClient(client);

      console.log(`✅ Connected to ${serverType} MCP Server with ${mcpTools.length} tools`);
      return true;

    } catch (error) {
      console.error(`❌ Error connecting to ${serverType} MCP Server:`, error);
      return false;
    }
  }, [mcpServer]);

  const mcpDisconnect = useCallback(async (): Promise<void> => {
    try {
      if (mcpClient) {
        await mcpClient.close();
        setMcpClient(null);
      }
      
      if (mcpServer) {
        await mcpServer.close();
        setMcpServer(null);
      }
      
      setTools([]);
      console.log('🔌 Disconnected from MCP Server');
    } catch (error) {
      console.error('❌ Error disconnecting from MCP Server:', error);
    }
  }, [mcpClient, mcpServer]);

  const liveConnect = useCallback(async (mcpTools?: MCPTool[]): Promise<boolean> => {
    if (!liveClientRef.current || !apiKey) {
      console.error('❌ No Live client or API key available');
      return false;
    }

    try {
      const toolsToUse = mcpTools || tools;
      const config = createLiveConfigWithTools(toolsToUse);
      
      console.log('🔌 Connecting to Gemini Live with config:', config);
      await liveClientRef.current.connect(config);
      
      return true;
    } catch (error) {
      console.error('❌ Error connecting to Gemini Live:', error);
      return false;
    }
  }, [apiKey, tools]);

  const liveDisconnect = useCallback(async (): Promise<void> => {
    if (liveClientRef.current) {
      liveClientRef.current.disconnect();
      setLiveConnected(false);
    }
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (liveClientRef.current && liveConnected) {
      // Add user message to chat
      const userMessage = {
        id: Date.now().toString(),
        role: 'user' as const,
        content: message,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);

      // Send to Gemini
      liveClientRef.current.send([{ text: message }]);
    } else {
      console.warn('⚠️ Live client not connected');
    }
  }, [liveConnected]);

  const contextValue = useMemo(() => ({
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
    liveClient: liveClientRef.current,
    messages
  }), [
    mcpConnect,
    mcpDisconnect,
    liveConnect,
    liveDisconnect,
    liveConnected,
    tools,
    sendMessage,
    messages
  ]);

  return (
    <GeminiContext.Provider value={contextValue}>
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
