/**
 * MCP Service - Persistent Preferences Management
 * Handles saving and loading user's MCP server preferences
 */
import { type FunctionDeclaration } from '@google/generative-ai';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { MCP_SERVER_REGISTRY, MCPServerConfig } from '../config/mcp_config';
import { LLM_CONFIG } from '../config/ai_config';

import type { LiveConfig, MCPTool } from '../types/live-types';

const MCP_PREFERENCES_KEY = '@mcp_server_preferences';

export interface MCPPreferences {
  enabledServers: string[];
  lastUpdated: string;
  version: string;
}

/**
 * Default MCP preferences
 */
const DEFAULT_PREFERENCES: MCPPreferences = {
  enabledServers: getDefaultEnabledServers(), // Empty array - user must enable manually
  lastUpdated: new Date().toISOString(),
  version: '1.0.0'
};

/**
 * Load MCP preferences from AsyncStorage
 */
export const loadMCPPreferences = async (): Promise<MCPPreferences> => {
  try {
    const stored = await AsyncStorage.getItem(MCP_PREFERENCES_KEY);
    
    if (!stored) {
      console.log('📱 No MCP preferences found, using defaults');
      return DEFAULT_PREFERENCES;
    }
    
    const preferences: MCPPreferences = JSON.parse(stored);
    
    // Validate that all enabled servers still exist in registry
    const validEnabledServers = preferences.enabledServers.filter(serverId => hasServer(serverId));
    
    if (validEnabledServers.length !== preferences.enabledServers.length) {
      console.log('⚠️ Some enabled servers no longer exist, cleaning up preferences');
      const cleanedPreferences = {
        ...preferences,
        enabledServers: validEnabledServers,
        lastUpdated: new Date().toISOString()
      };
      await saveMCPPreferences(cleanedPreferences);
      return cleanedPreferences;
    }
    
    console.log(`📱 Loaded MCP preferences: ${preferences.enabledServers.length} enabled servers`);
    return preferences;
    
  } catch (error) {
    console.error('❌ Failed to load MCP preferences:', error);
    return DEFAULT_PREFERENCES;
  }
};

/**
 * Save MCP preferences to AsyncStorage
 */
export const saveMCPPreferences = async (preferences: MCPPreferences): Promise<void> => {
  try {
    const toSave = {
      ...preferences,
      lastUpdated: new Date().toISOString()
    };
    
    await AsyncStorage.setItem(MCP_PREFERENCES_KEY, JSON.stringify(toSave));
    console.log(`📱 Saved MCP preferences: ${preferences.enabledServers.length} enabled servers`);
    
  } catch (error) {
    console.error('❌ Failed to save MCP preferences:', error);
    throw error;
  }
};

/**
 * Update enabled servers in preferences
 */
export const updateEnabledServers = async (enabledServers: string[]): Promise<void> => {
  try {
    const currentPreferences = await loadMCPPreferences();
    const updatedPreferences: MCPPreferences = {
      ...currentPreferences,
      enabledServers: enabledServers.filter(serverId => hasServer(serverId)), // Validate servers
      lastUpdated: new Date().toISOString()
    };
    
    await saveMCPPreferences(updatedPreferences);
    
  } catch (error) {
    console.error('❌ Failed to update enabled servers:', error);
    throw error;
  }
};

/**
 * Add a server to enabled list
 */
export const enableServer = async (serverId: string): Promise<void> => {
  if (!hasServer(serverId)) {
    throw new Error(`Server '${serverId}' not found in registry`);
  }
  
  const preferences = await loadMCPPreferences();
  if (!preferences.enabledServers.includes(serverId)) {
    await updateEnabledServers([...preferences.enabledServers, serverId]);
  }
};

/**
 * Remove a server from enabled list
 */
export const disableServer = async (serverId: string): Promise<void> => {
  const preferences = await loadMCPPreferences();
  const updatedServers = preferences.enabledServers.filter(id => id !== serverId);
  await updateEnabledServers(updatedServers);
};

/**
 * Check if a server is enabled in preferences
 */
export const isServerEnabled = async (serverId: string): Promise<boolean> => {
  const preferences = await loadMCPPreferences();
  return preferences.enabledServers.includes(serverId);
};

/**
 * Clear all MCP preferences (reset to defaults)
 */
export const clearMCPPreferences = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(MCP_PREFERENCES_KEY);
    console.log('📱 Cleared MCP preferences');
  } catch (error) {
    console.error('❌ Failed to clear MCP preferences:', error);
    throw error;
  }
};

/**
 * Get preferences statistics
 */
export const getMCPPreferencesStats = async (): Promise<{
  totalEnabled: number;
  lastUpdated: Date;
  version: string;
}> => {
  const preferences = await loadMCPPreferences();
  return {
    totalEnabled: preferences.enabledServers.length,
    lastUpdated: new Date(preferences.lastUpdated),
    version: preferences.version
  };
};




/**
 * Get all available server configurations
 */
export function getAllServerConfigs(): MCPServerConfig[] {
  return Object.values(MCP_SERVER_REGISTRY);
}

/**
 * Get server configuration by ID
 */
export function getServerConfig(serverId: string): MCPServerConfig | null {
  return MCP_SERVER_REGISTRY[serverId] || null;
}

/**
 * Get server configurations by category
 */
export function getServersByCategory(category: string): MCPServerConfig[] {
  return Object.values(MCP_SERVER_REGISTRY).filter(config => config.category === category);
}

/**
 * Get all available server IDs
 */
export function getAvailableServerIds(): string[] {
  return Object.keys(MCP_SERVER_REGISTRY);
}

/**
 * Check if a server ID exists in the registry
 */
export function hasServer(serverId: string): boolean {
  return serverId in MCP_SERVER_REGISTRY;
}

/**
 * Get default enabled servers (can be overridden by user preferences)
 */
export function getDefaultEnabledServers(): string[] {
  // By default, no servers are enabled - user must explicitly enable them
  return [];
}

/**
 * Validate server dependencies (for future use)
 */
export function validateServerDependencies(enabledServers: string[]): { valid: boolean; missingDependencies: string[] } {
  const missingDependencies: string[] = [];
  
  for (const serverId of enabledServers) {
    const config = getServerConfig(serverId);
    if (config?.dependencies) {
      for (const dependency of config.dependencies) {
        if (!enabledServers.includes(dependency)) {
          missingDependencies.push(`${serverId} requires ${dependency}`);
        }
      }
    }
  }
  
  return {
    valid: missingDependencies.length === 0,
    missingDependencies
  };
}



// CONVERT MCP PARAMETERS TO GEMINI LIVE API FORMAT
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

// CREATE LIVE CONFIG WITH MCP TOOLS  
export const createLiveConfigWithTools = (mcpTools: MCPTool[]): LiveConfig => {
  if (mcpTools.length === 0) {
    return LLM_CONFIG;
  }

  // Convert MCP tools to proper Live API FunctionDeclaration format
  const mcpFunctionDeclarations = mcpTools.map(tool => {
    const functionDeclaration = {
      name: tool.name,
      description: tool.description || `Execute ${tool.name}`,
      parameters: {
        type: "object",
        properties: convertMCPParams(tool.parameters),
        required: tool.parameters?.required || []
      }
    };
    
    // console.log(`📋 Function declaration for ${tool.name}:`, functionDeclaration);
    return functionDeclaration;
  });

  // Create the tools array in the correct LiveConfig format
  const tools: LiveConfig['tools'] = [{
    functionDeclarations: mcpFunctionDeclarations as FunctionDeclaration[]
  }];

  // console.log('🎯 Final Live API config tools:', tools);

  return {
    ...LLM_CONFIG,
    tools: tools
  };
};
