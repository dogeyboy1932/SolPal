import { createContext, useContext, useState, useEffect, type ReactNode, useRef, useMemo, useCallback } from 'react';

// Use mobile-compatible MCP adapter instead of web-based client
import { MobileMCPClient, createMobileMCPClient } from './mcpServerAdapter';
import { getServerConfig, hasServer, createLiveConfigWithTools } from '@/services/mcpService';
import { loadMCPPreferences, saveMCPPreferences, enableServer, disableServer } from '../../services/mcpService';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// import { setupMCPServer } from '../../mcpServers/_shared';
import type { ToolCall, LiveFunctionResponse, MCPTool } from '../../types/live-types';
import type { Node } from '../../types/nodes';
import { MultimodalLiveClient } from './liveClient';

import { CONST_CONFIG } from '../../config/ai_config';

// Voice functionality for React Native
import { AudioRecorder } from '../voice/AudioRecorder';
import { VoicePermissions } from '../voice/VoicePermissions';
import { useWallet } from '@/contexts/WalletContext';
import { PublicKey } from '@solana/web3.js';


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
  getActiveMCPServers: () => Record<string, boolean>;
  refreshLLMTools: () => Promise<void>;
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

  const { connection, signAndSendTransaction, ...state } = useWallet();

  // Initialize MCP client and restore user preferences
  useEffect(() => {
    const initializeMCPClient = async () => {
      if (!mcpClient) {
        console.log('🚀 Initializing MCP Client and loading preferences...');
        try {
          const newClient = await createMobileMCPClient();
          setMcpClient(newClient);
          
          // Load user preferences and restore previously enabled servers
          const preferences = await loadMCPPreferences();
          console.log(`📱 Loaded preferences: ${preferences.enabledServers.length} servers to restore`);
          
          // Restore enabled servers from preferences
          const restoredServers: Record<string, boolean> = {};
          for (const serverId of preferences.enabledServers) {
            try {
              const success = await newClient.enableServer(serverId);
              restoredServers[serverId] = success;
              if (success) {
                console.log(`✅ Restored server: ${serverId}`);
              } else {
                console.warn(`⚠️ Failed to restore server: ${serverId}`);
              }
            } catch (error) {
              console.error(`❌ Error restoring server ${serverId}:`, error);
              restoredServers[serverId] = false;
            }
          }
          
          setActiveMCPServers(restoredServers);
          
          // Update tools after restoring servers
          const activeTools = await newClient.getActiveTools();
          const formattedTools = activeTools.map((tool: MCPTool) => ({
            name: tool.name,
            description: tool.description || tool.name,
            parameters: tool.parameters // ✅ No fallback needed - BaseMCP now generates proper schemas
          }));
          setTools(formattedTools);
          
          console.log(`✅ MCP Client initialized with ${Object.keys(restoredServers).length} servers and ${formattedTools.length} tools`);
        } catch (error) {
          console.warn('⚠️ Failed to initialize MCP client:', error);
        }
      }
    };

    initializeMCPClient();
  }, []); // Run once on mount




  // Update wallet context for AI
  useEffect(() => {
    if (state.connected && state.publicKey && mcpClient) {
      console.log(`🔗 Wallet connected: ${state.publicKey}`);
      mcpClient.updateWalletContext(connection, new PublicKey(state.publicKey), signAndSendTransaction);
    } else if (mcpClient) {
      console.log('🔗 Wallet disconnected');
      mcpClient.updateWalletContext(null, null);
    }

  }, [state.connected, state.publicKey]);




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
      .on("close", (reason) => {
        console.log('🔌 Gemini Live disconnected:', reason);
        setLiveConnected(false);
      });

    return () => {
      liveClient
        .off("toolcall", callTool)
        .off("turncomplete", onTurnComplete);
    };
  }, [liveClient, mcpClient]);

  // Voice audio streaming (following mcpb-latent pattern)
  // useEffect(() => {
  //   console.log("HERE")
  //   const onData = (base64: string) => {
  //     console.log(`🎤 Audio data received: ${base64.length} bytes`);

  //     if (liveConnected && voiceModeEnabled) {
  //       liveClient.sendRealtimeInput([
  //         {
  //           mimeType: "audio/pcm;rate=16000",
  //           data: base64,
  //         },
  //       ]);
  //     }
  //   };

  //   console.log(audioRecorder);

  //   if (liveConnected && voiceModeEnabled && isListening && audioRecorder) {
  //     console.log("CAPTURING AUDIO");
  //     audioRecorder.on("data", onData).start();
  //   } else {
  //     audioRecorder.stop();
  //   }

  //   return () => {
  //     audioRecorder.off("data", onData);
  //   };
  // }, [liveConnected, liveClient, voiceModeEnabled, isListening, audioRecorder]);

  useEffect(() => {
  // console.log("=== AUDIO EFFECT DEBUG ===");
  // console.log("liveConnected:", liveConnected);
  // console.log("voiceModeEnabled:", voiceModeEnabled);
  // console.log("isListening:", isListening);
  // console.log("audioRecorder:", audioRecorder);
  // console.log("audioRecorder type:", typeof audioRecorder);
  // console.log("audioRecorder methods:", audioRecorder ? Object.getOwnPropertyNames(Object.getPrototypeOf(audioRecorder)) : 'N/A');
  
  const onData = (base64: string) => {
    // console.log(`🎤 Audio data received: ${base64.length} bytes`);

    if (liveConnected && voiceModeEnabled) {
      liveClient.sendRealtimeInput([
        {
          mimeType: "audio/pcm;rate=16000",
          data: base64,
        },
      ]);
    }
  };

  const onStart = () => {
    console.log("🎤 AudioRecorder started successfully");
  };

  const onError = (error: Error) => {
    console.error("🎤 AudioRecorder error:", error);
  };

  if (liveConnected && voiceModeEnabled && isListening && audioRecorder) {
    console.log("Setting up audio recorder listeners...");
    
    audioRecorder.on("data", onData);
    audioRecorder.on("start", onStart);
    audioRecorder.on("error", onError);
    
    console.log("Starting audio recorder...");
    audioRecorder.start().catch((error) => {
      console.error("Failed to start audio recorder:", error);
    });
  } else {
    console.log("Conditions not met for audio recording or stopping recorder");
    if (audioRecorder) {
      audioRecorder.stop();
    }
  }

  return () => {
    console.log("Cleaning up audio recorder listeners...");
    if (audioRecorder) {
      audioRecorder.off("data", onData);
      audioRecorder.off("start", onStart);
      audioRecorder.off("error", onError);
    }
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
        parameters: tool.parameters // ✅ No fallback needed - BaseMCP now generates proper schemas
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
    if (!mcpClient) {
      console.error('❌ MCP Client not initialized');
      return;
    }

    const isEnabled = enabled !== undefined ? enabled : !activeMCPServers[serverType];
    
    try {
      if (isEnabled) {
        // Enable server
        console.log(`🚀 Enabling ${serverType} MCP server...`);
        const success = await mcpClient.enableServer(serverType);
        
        if (success) {
          setActiveMCPServers(prev => ({
            ...prev,
            [serverType]: true
          }));
          
          // Save to persistent preferences
          await enableServer(serverType);
          
          // Refresh tools after enabling server
          await refreshLLMTools();
          console.log(`✅ ${serverType} MCP server enabled and saved to preferences`);
        } else {
          console.error(`❌ Failed to enable ${serverType} MCP server`);
        }
      } else {
        // Disable server
        console.log(`⏹️ Disabling ${serverType} MCP server...`);
        await mcpClient.disableServer(serverType);
        
        setActiveMCPServers(prev => ({
          ...prev,
          [serverType]: false
        }));
        
        // Save to persistent preferences
        await disableServer(serverType);
        
        // Refresh tools after disabling server
        await refreshLLMTools();
        console.log(`🔌 ${serverType} MCP server disabled and removed from preferences`);
      }
    } catch (error) {
      console.error(`❌ Failed to toggle ${serverType} MCP server:`, error);
    }
  }, [mcpClient, activeMCPServers]);

  // Get currently active MCP servers
  const getActiveMCPServers = useCallback((): Record<string, boolean> => {
    return activeMCPServers;
  }, [activeMCPServers]);

  // Refresh tools from all active servers and update LLM
  const refreshLLMTools = useCallback(async (): Promise<void> => {
    if (!mcpClient) {
      console.warn('⚠️ Cannot refresh tools - MCP Client not initialized');
      return;
    }

    try {
      console.log('🔄 Refreshing LLM tools from active servers...');
      
      // Get tools from all active servers  
      const activeTools = await mcpClient.getActiveTools();
      const formattedTools = activeTools.map((tool: MCPTool) => ({
        name: tool.name,
        description: tool.description || tool.name,
        parameters: tool.parameters // ✅ No fallback needed - BaseMCP now generates proper schemas
      }));
      
      setTools(formattedTools);
      
      // If LLM is connected, reconnect with new tools
      if (liveConnected) {
        console.log('🔄 Reconnecting LLM with updated tools...');
        await liveDisconnect();
        await liveConnect(formattedTools);
      }
      
      console.log(`✅ Refreshed LLM tools: ${formattedTools.length} total from active servers`);
    } catch (error) {
      console.error('❌ Failed to refresh LLM tools:', error);
    }
  }, [mcpClient, liveConnected, liveConnect, liveDisconnect]);

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
      getActiveMCPServers,
      refreshLLMTools,
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
