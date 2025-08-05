import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MCP_SERVERS } from '@/config/mcp_config';
import { useAIConnection } from './GeminiContext';

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
    <View className="m-4">
      <LinearGradient
        colors={['#FFF8DC', '#F5F5DC']}
        className="rounded-2xl p-5 shadow-lg"
      >
        <Text className="text-xl font-bold text-amber-900 mb-5">AI Connection Manager</Text>
        
        {/* AI Connection Toggle */}
        <View className="flex-row justify-between items-center py-3 border-b border-amber-200">
          <View className="flex-1">
            <Text className="text-base font-semibold text-amber-900 mb-1">AI Assistant</Text>
            <View className="flex-row items-center">
              <View 
                className="w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: isConnected ? '#34C759' : '#FF3B30' }}
              />
              <Text className="text-sm font-medium" style={{ color: isConnected ? '#34C759' : '#FF3B30' }}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          </View>
          <Switch
            value={isConnected}
            onValueChange={handleAIToggle}
            trackColor={{ false: '#E5E5EA', true: '#E49B3F' }}
            thumbColor={isConnected ? '#FFFFFF' : '#FFFFFF'}
            ios_backgroundColor="#E5E5EA"
          />
        </View>

        {/* Disconnect Button */}
        {isConnected && (
          <TouchableOpacity className="mt-3 self-start rounded-lg" onPress={() => handleAIToggle()}>
            <LinearGradient
              colors={['#FF3B30', '#FF6B6B']}
              className="flex-row items-center py-2 px-4 rounded-lg gap-1.5"
            >
              <Ionicons name="power" size={16} color="white" />
              <Text className="text-white text-sm font-semibold">Disconnect AI</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* MCP Servers Section */}
        {isConnected && (
          <View className="mt-5 pt-4 border-t border-amber-200">
            <Text className="text-lg font-bold text-amber-900 mb-2">MCP Servers</Text>
            <Text className="text-sm text-amber-700 mb-4 leading-5">
              Enable MCP servers to give AI access to specific capabilities
            </Text>
            
            {Object.entries(MCP_SERVERS).map(([serverType, config]) => (
              <View key={serverType} className="flex-row justify-between items-center py-3 border-b border-amber-100">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-amber-900 mb-1">{config.name}</Text>
                  <View className="flex-row items-center">
                    <View 
                      className="w-1.5 h-1.5 rounded-full mr-1.5"
                      style={{ backgroundColor: activeMCPServers[serverType] ? '#34C759' : '#C7C7CC' }}
                    />
                    <Text className="text-xs text-amber-600">
                      {activeMCPServers[serverType] ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={activeMCPServers[serverType] || false}
                  onValueChange={(enabled) => handleMCPServerToggle(serverType, enabled)}
                  trackColor={{ false: '#E5E5EA', true: '#8B5A3C' }}
                  thumbColor={activeMCPServers[serverType] ? '#FFFFFF' : '#FFFFFF'}
                  ios_backgroundColor="#E5E5EA"
                  disabled={!isConnected}
                />
              </View>
            ))}
          </View>
        )}
      </LinearGradient>
    </View>
  );
};
