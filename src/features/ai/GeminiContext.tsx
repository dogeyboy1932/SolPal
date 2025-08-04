import { createContext, useContext, useState, useEffect, type ReactNode, useRef, useMemo, useCallback } from 'react';

// Use mobile-compatible MCP adapter instead of web-based client
import { MobileMCPClient, createMobileMCPClient } from '../../mcpServers/mobileServerAdapter';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { setupMCPServer } from '../../mcpServers/_shared';
import type { ToolCall, LiveFunctionResponse, MCPTool } from '../../types/live-types';
import type { Node } from '../../types/nodes';
import { MultimodalLiveClient } from './liveClient';

import { CONST_CONFIG } from '../../config/ai_config';
import { createLiveConfigWithTools } from '../../lib/utils';

// Voice functionality for React Native
import { AudioRecorder } from '../voice/AudioRecorder';
import { VoicePermissions } from '../voice/VoicePermissions';

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
  updateNodeContext: (activeNodes: Node[]) => void;

  liveClient: MultimodalLiveClient;
  messages: Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date}>;

  // Voice properties (following mcpb-latent pattern)
  voiceModeEnabled: boolean;
  toggleVoiceMode: () => Promise<void>;
  isListening: boolean;
  startListening: () => Promise<void>;
  stopListening: () => void;

  // Additional properties for compatibility with AIConnectionContext
  isConnected: boolean;
  activeMCPServers: Record<string, boolean>;
  mcpServerInstances: Record<string, McpServer>;
  connect: () => void;
  disconnect: () => void;
  toggleMCPServer: (serverType: string, enabled?: boolean) => Promise<void>;
}

const GeminiContext = createContext<GeminiContextType | undefined>(undefined);

export const GeminiProvider = ({ children }: { children: ReactNode }) => {
  const [apiKey, setApiKey] = useState("");
  const [mcpClient, setMcpClient] = useState<MobileMCPClient | null>(null);
  const [currentServer, setCurrentServer] = useState<McpServer | null>(null);
  const [liveConnected, setLiveConnected] = useState(false);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [messages, setMessages] = useState<Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: Date}>>([]);
  
  // Voice state (following mcpb-latent pattern)
  const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [audioRecorder] = useState(() => new AudioRecorder());
  
  // Additional state for AIConnectionContext compatibility
  const [activeMCPServers, setActiveMCPServers] = useState<Record<string, boolean>>({});
  const [mcpServerInstances, setMcpServerInstances] = useState<Record<string, McpServer>>({});

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
          console.log(`🔌 Connecting to combined MCP Server...`);
          
          // Create mobile-compatible MCP client
          const newClient = await createMobileMCPClient();
          setMcpClient(newClient);



          // Get tools
          const toolList = await newClient.listTools();
          const newTools = toolList.tools.map((tool: MCPTool) => ({
            name: tool.name,
            description: tool.description || tool.name,
            parameters: tool.parameters || { type: "object", properties: {}, required: [] }
          }));
          
          setTools(newTools);
          // console.log(`✅ Auto-connected to combined server with ${newTools.length} tools:`, newTools.map((t: MCPTool) => t.name));
          
          // Test tool calling after successful connection
          setTimeout(async () => {
            console.log('🚀 Starting Mobile MCP Client test sequence...');
            // await newClient.testToolCalling();
          }, 2000);
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
      console.log('🔧 Tool call received:', toolCall);
      
      if (mcpClient) {
        console.log('📱 Using Mobile MCP Client for tool execution');
        const functionResponses: LiveFunctionResponse[] = [];
        
        for (const call of toolCall.functionCalls) {
          try {
            console.log(`🔄 Executing tool: ${call.name} with args:`, call.args);
            const toolResult = await mcpClient.callTool(call.name, call.args || {});
            console.log(`✅ Tool ${call.name} result:`, toolResult);
            
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
        
        console.log('📤 Sending tool responses:', functionResponses);
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

  // Voice audio streaming (following mcpb-latent pattern)
  useEffect(() => {
    const onData = (base64: string) => {
      if (liveConnected && voiceModeEnabled) {
        liveClient.sendRealtimeInput([
          {
            mimeType: "audio/pcm;rate=16000",
            data: base64,
          },
        ]);
      }
    };

    if (liveConnected && voiceModeEnabled && isListening && audioRecorder) {
      audioRecorder.on("data", onData).start();
    } else {
      audioRecorder.stop();
    }

    return () => {
      audioRecorder.off("data", onData);
    };
  }, [liveConnected, liveClient, voiceModeEnabled, isListening, audioRecorder]);

  // MCP Connection
  const mcpConnect = useCallback(async (serverType: string): Promise<boolean> => {
    try {
      console.log(`🔌 Connecting to ${serverType} MCP Server...`);
      
      // Disconnect previous
      await mcpDisconnect();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create mobile-compatible MCP client
      const newClient = await createMobileMCPClient();
      setMcpClient(newClient);

      // Get tools
      const toolList = await newClient.listTools();
      const newTools = toolList.tools.map((tool: MCPTool) => ({
        name: tool.name,
        description: tool.description || tool.name,
        parameters: tool.parameters || { type: "object", properties: {}, required: [] }
      }));
      
      setTools(newTools);
      console.log(`✅ Connected to ${serverType} with ${newTools.length} tools:`, newTools.map((t: MCPTool) => t.name));

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
        await mcpClient.disconnect();
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

  // Voice functions (following mcpb-latent pattern)
  const toggleVoiceMode = useCallback(async (): Promise<void> => {
    if (!voiceModeEnabled) {
      // Request permission before enabling voice mode
      const hasPermission = await VoicePermissions.ensureMicrophonePermission();
      if (hasPermission) {
        setVoiceModeEnabled(true);
        console.log('🎤 Voice mode enabled');
      } else {
        console.log('❌ Voice mode requires microphone permission');
      }
    } else {
      setVoiceModeEnabled(false);
      setIsListening(false);
      audioRecorder.stop();
      console.log('🔇 Voice mode disabled');
    }
  }, [voiceModeEnabled, audioRecorder]);

  const startListening = useCallback(async (): Promise<void> => {
    if (!voiceModeEnabled) {
      await toggleVoiceMode();
      return;
    }

    if (!liveConnected) {
      console.warn('⚠️ Cannot start listening: Live client not connected');
      return;
    }

    if (isListening) {
      console.warn('⚠️ Already listening');
      return;
    }

    try {
      setIsListening(true);
      console.log('🎤 Started listening...');
    } catch (error) {
      console.error('❌ Failed to start listening:', error);
      setIsListening(false);
    }
  }, [voiceModeEnabled, liveConnected, isListening, toggleVoiceMode]);

  const stopListening = useCallback((): void => {
    if (!isListening) return;
    
    setIsListening(false);
    audioRecorder.stop();
    console.log('🛑 Stopped listening');
  }, [isListening, audioRecorder]);

  // Update node context for AI
  const updateNodeContext = useCallback((activeNodes: Node[]) => {
    if (!liveConnected || activeNodes.length === 0) return;
    
    // Create a context message about active nodes
    const contextInfo = activeNodes.map(node => {
      let nodeInfo = `${node.type}: ${node.name}`;
      if (node.description) nodeInfo += ` - ${node.description}`;
      
      // Add type-specific information
      if (node.type === 'person' && 'walletAddress' in node && node.walletAddress) {
        nodeInfo += ` (Wallet: ${node.walletAddress})`;
      }
      if (node.type === 'event' && 'date' in node && node.date) {
        nodeInfo += ` (Date: ${new Date(node.date).toLocaleDateString()})`;
      }
      if (node.type === 'community' && 'communityType' in node && node.communityType) {
        nodeInfo += ` (Type: ${node.communityType})`;
      }
      
      return nodeInfo;
    }).join(', ');

    // Send context update as a system-level instruction
    const contextMessage = `[SYSTEM CONTEXT UPDATE] Current active nodes for context: ${contextInfo}. Use this information to provide relevant assistance.`;
    
    // Send context message (won't be displayed in chat)
    try {
      liveClient.send([{ text: contextMessage }]);
      console.log('🔄 Updated AI context with active nodes:', activeNodes.map(n => n.name));
    } catch (error) {
      console.warn('⚠️ Failed to update node context:', error);
    }
  }, [liveConnected, liveClient]);

  // Compatibility functions for AIConnectionContext
  const connect = useCallback(async () => {
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
      updateNodeContext,
      liveClient,
      messages,

      // Voice properties
      voiceModeEnabled,
      toggleVoiceMode,
      isListening,
      startListening,
      stopListening,

      // Additional properties for compatibility
      isConnected: liveConnected,
      activeMCPServers,
      mcpServerInstances,
      connect,
      disconnect,
      toggleMCPServer,
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

// Compatibility hook for components using useAIConnection
export const useAIConnection = () => {
  const context = useContext(GeminiContext);
  if (context === undefined) {
    throw new Error('useAIConnection must be used within a GeminiProvider');
  }
  return {
    isConnected: context.isConnected,
    activeMCPServers: context.activeMCPServers,
    mcpServerInstances: context.mcpServerInstances,
    connect: context.connect,
    disconnect: context.disconnect,
    toggleMCPServer: context.toggleMCPServer,
  };
};
