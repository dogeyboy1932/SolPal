import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { MCP_SERVERS } from '@/config/mcp_config';
import { useAIConnection } from '@/contexts/AIConnectionContext';

interface AIConnectionManagerProps {
  onConnectionChange?: (connected: boolean) => void;
  onMCPServerChange?: (serverType: string, enabled: boolean) => void;
}

export const AIConnectionManager: React.FC<AIConnectionManagerProps> = ({
  onConnectionChange,
  onMCPServerChange
}) => {
  const {
    isConnected,
    activeMCPServers,
    connect,
    disconnect,
    toggleMCPServer
  } = useAIConnection();

  const handleAIToggle = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
    onConnectionChange?.(isConnected);
  };

  const handleMCPServerToggle = async (serverType: string, enabled?: boolean) => {
    await toggleMCPServer(serverType, enabled);
    onMCPServerChange?.(serverType, enabled !== undefined ? enabled : !activeMCPServers[serverType]);
  };

  return (
    <View className="bg-white rounded-xl p-4 m-4 shadow-lg">
      <Text className="text-xl font-bold text-gray-800 mb-4">AI Connection Manager</Text>
      
      {/* AI Connection Toggle */}
      <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
        <View className="flex-1">
          <Text className="text-base font-semibold text-gray-700">AI Assistant</Text>
          <Text className={`text-sm mt-0.5 ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </Text>
        </View>
        <Switch
          value={isConnected}
          onValueChange={handleAIToggle}
          trackColor={{ false: '#f3f4f6', true: '#22c55e' }}
          thumbColor={isConnected ? '#ffffff' : '#f9fafb'}
        />
      </View>

      {/* Disconnect Button */}
      {isConnected && (
        <TouchableOpacity
          className="bg-red-500 py-2 px-4 rounded-md mt-3 self-start"
          onPress={() => handleAIToggle()}
        >
          <Text className="text-white text-sm font-semibold">Disconnect AI</Text>
        </TouchableOpacity>
      )}

      {/* MCP Servers Section */}
      {isConnected && (
        <View className="mt-5 pt-4 border-t border-gray-200">
          <Text className="text-lg font-bold text-gray-800 mb-2">MCP Servers</Text>
          <Text className="text-sm text-gray-600 mb-4">
            Enable MCP servers to give AI access to specific capabilities
          </Text>
          
          {Object.entries(MCP_SERVERS).map(([serverType, config]) => (
            <View key={serverType} className="flex-row justify-between items-center py-3 border-b border-gray-100">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-700">{config.label}</Text>
                <Text className="text-xs text-gray-600 mt-0.5">
                  {activeMCPServers[serverType] ? '✅ Active' : '⚪ Inactive'}
                </Text>
              </View>
              <Switch
                value={activeMCPServers[serverType] || false}
                onValueChange={(enabled) => handleMCPServerToggle(serverType, enabled)}
                trackColor={{ false: '#f3f4f6', true: '#3b82f6' }}
                thumbColor={activeMCPServers[serverType] ? '#ffffff' : '#f9fafb'}
                disabled={!isConnected}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
};
