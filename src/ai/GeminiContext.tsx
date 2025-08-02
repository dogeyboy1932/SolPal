import { createContext, useContext, useState, useEffect, type ReactNode, useRef, useMemo, useCallback } from 'react';

import { TabClientTransport } from '@mcp-b/transports';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { setupMCPServer } from '../mcpServers/_shared';
import type { ToolCall, LiveFunctionResponse, MCPTool } from '../lib/live-types';
import { MultimodalLiveClient } from './liveClient';
import { Node } from '../types/nodes';

import { CONST_CONFIG, LLM_CONFIG } from '../config/ai_config';
import { createNodeAwareLiveConfig } from '../config/node_aware_ai_config';
import { createLiveConfigWithTools } from '../lib/utils';
import { AICommandParser, AICommand } from '../lib/ai-command-parser';
// Audio functionality - commented out for React Native compatibility
// import { audioContext } from '../lib/utils';
// import VolMeterWorket from "../lib/audio/worklets/vol-meter";
// import { AudioRecorder } from '../lib/audio/audio-recorder';
// import { AudioStreamer } from '../lib/audio/audio-streamer';

interface GeminiContextType {
  mcpConnect: (serverType: string) => Promise<boolean>;
  mcpDisconnect: () => Promise<void>;
  liveConnect: (mcpTools?: MCPTool[], nodeContext?: Node[]) => Promise<boolean>;
  liveDisconnect: () => Promise<void>;
  
  liveConnected: boolean; 
  setLiveConnected: (connected: boolean) => void;
  
  tools: MCPTool[];
  setTools: (tools: MCPTool[]) => void;

  sendMessage: (message: string, nodeContext?: Node[]) => void;
  setApiKey: (apiKey: string) => void;
  updateNodeContext: (activeNodes: Node[]) => void;
  executeCommand: (command: AICommand) => Promise<boolean>;

  liveClient: MultimodalLiveClient | null;
  messages: Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date}>;
  currentNodeContext: Node[];
  lastParsedCommand?: AICommand;
}

const GeminiContext = createContext<GeminiContextType | undefined>(undefined);

export const GeminiProvider = ({ children }: { children: ReactNode }) => {
  const [apiKey, setApiKey] = useState("");
  const [mcpClient, setMcpClient] = useState<Client | null>(null);
  const [mcpServer, setMcpServer] = useState<McpServer | null>(null);
  const [liveConnected, setLiveConnected] = useState(false);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [messages, setMessages] = useState<Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date}>>([]);
  const [currentNodeContext, setCurrentNodeContext] = useState<Node[]>([]);
  const [lastParsedCommand, setLastParsedCommand] = useState<AICommand>();

  const liveClientRef = useRef<MultimodalLiveClient | null>(null);

  // Initialize live client when API key is provided
  useEffect(() => {
    if (apiKey && !liveClientRef.current) {
      liveClientRef.current = new MultimodalLiveClient({ apiKey });
      
      // Set up event listeners
      liveClientRef.current.on('turncomplete', (fullResponse: string) => {
        if (fullResponse && fullResponse.trim()) {
          const newMessage = {
            id: `assistant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            role: 'assistant' as const,
            content: fullResponse.trim(),
            timestamp: new Date()
          };
          setMessages(prev => [...prev, newMessage]);
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

  const liveConnect = useCallback(async (mcpTools?: MCPTool[], nodeContext?: Node[]): Promise<boolean> => {
    if (!liveClientRef.current || !apiKey) {
      console.error('❌ No Live client or API key available');
      return false;
    }

    // Prevent multiple connections if already connected
    if (liveConnected) {
      console.log('⚠️ Already connected to Gemini Live, skipping reconnection');
      return true;
    }

    try {
      const activeNodes = nodeContext || currentNodeContext;
      const toolsToUse = mcpTools || tools;
      
      // Use node-aware configuration if nodes are active
      const config = activeNodes.length > 0 
        ? createNodeAwareLiveConfig(activeNodes, toolsToUse)
        : createLiveConfigWithTools(toolsToUse);
      
      console.log('🔌 Connecting to Gemini Live with node context:', {
        nodes: activeNodes.length,
        tools: toolsToUse.length
      });
      
      await liveClientRef.current.connect(config);
      
      // Update current node context
      setCurrentNodeContext(activeNodes);
      
      return true;
    } catch (error) {
      console.error('❌ Error connecting to Gemini Live:', error);
      return false;
    }
  }, [liveConnected, currentNodeContext, tools, apiKey]);

  const liveDisconnect = useCallback(async (): Promise<void> => {
    if (liveClientRef.current) {
      liveClientRef.current.disconnect();
      setLiveConnected(false);
    }
  }, []);

  const sendMessage = useCallback((message: string, nodeContext?: Node[]) => {
    if (liveClientRef.current && liveConnected) {
      // Parse the message for AI commands
      const availableNodes = nodeContext || currentNodeContext;
      const parsedCommand = AICommandParser.parseCommand(message, availableNodes);
      
      if (AICommandParser.isActionableCommand(parsedCommand)) {
        console.log('🎯 Detected actionable command:', parsedCommand);
        setLastParsedCommand(parsedCommand);
        
        // Add command recognition response
        const commandResponse = AICommandParser.formatCommandResponse(parsedCommand);
        const commandMessage = {
          id: `command-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role: 'assistant' as const,
          content: `${commandResponse}\n\n*Note: AI commands are not yet executing real operations. This will be implemented in Phase 5.*`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, commandMessage]);
      }

      // Add user message to chat
      const userMessage = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
  }, [liveConnected, currentNodeContext]);

  const updateNodeContext = useCallback(async (activeNodes: Node[]) => {
    // Only update if the nodes have actually changed
    if (JSON.stringify(currentNodeContext) === JSON.stringify(activeNodes)) {
      return; // No change, skip update
    }
    
    setCurrentNodeContext(activeNodes);
    
    // Only log if there's an actual meaningful change (not just empty arrays)
    if (activeNodes.length > 0 || currentNodeContext.length > 0) {
      console.log('🔄 Updating AI with new node context:', activeNodes.length);
    }
  }, [currentNodeContext]);

  const executeCommand = useCallback(async (command: AICommand): Promise<boolean> => {
    setLastParsedCommand(command);
    
    try {
      switch (command.type) {
        case 'create_node':
          // This would trigger the node creation modal
          // For now, just log the intent
          console.log('🎯 Command: Create node', command);
          return true;
          
        case 'edit_node':
          console.log('🎯 Command: Edit node', command);
          return true;
          
        case 'view_node':
          console.log('🎯 Command: View node', command);
          return true;
          
        case 'send_transaction':
          console.log('🎯 Command: Send transaction', command);
          // This would eventually connect to actual Solana operations
          return true;
          
        case 'get_balance':
          console.log('🎯 Command: Get balance', command);
          return true;
          
        default:
          console.log('🎯 Command: Unknown', command);
          return false;
      }
    } catch (error) {
      console.error('❌ Command execution failed:', error);
      return false;
    }
  }, []);

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
    updateNodeContext,
    executeCommand,
    liveClient: liveClientRef.current,
    messages,
    currentNodeContext,
    lastParsedCommand
  }), [
    mcpConnect,
    mcpDisconnect,
    liveConnect,
    liveDisconnect,
    liveConnected,
    tools,
    sendMessage,
    updateNodeContext,
    executeCommand,
    messages,
    currentNodeContext,
    lastParsedCommand
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
