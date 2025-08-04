import React, { useState, useEffect } from 'react';
import { View, Text, Switch, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useGemini } from './GeminiContext';
import { MCP_SERVER_REGISTRY } from '../../config/mcp_config';

interface ServerStatus {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  isConnected: boolean;
  category: string;
}

export const MCPServerManagement: React.FC = () => {
  const { 
    toggleMCPServer, 
    getActiveMCPServers, 
    refreshLLMTools 
  } = useGemini();

  const [serverStatuses, setServerStatuses] = useState<ServerStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadServerStatuses();
  }, []);

  const loadServerStatuses = async () => {
    try {
      const activeServers = getActiveMCPServers();
      const statuses: ServerStatus[] = Object.entries(MCP_SERVER_REGISTRY).map(([id, config]) => ({
        id,
        name: config.name,
        description: config.description,
        isEnabled: activeServers[id] || false,
        isConnected: activeServers[id] || false, // For now, enabled = connected
        category: config.category
      }));
      
      setServerStatuses(statuses);
    } catch (error) {
      console.error('Error loading server statuses:', error);
    }
  };

  const handleServerToggle = async (serverId: string, currentEnabled: boolean) => {
    setIsLoading(true);
    try {
      await toggleMCPServer(serverId, !currentEnabled);
      
      // Update local state
      setServerStatuses(prev => 
        prev.map(server => 
          server.id === serverId 
            ? { ...server, isEnabled: !currentEnabled, isConnected: !currentEnabled }
            : server
        )
      );
      
      // Refresh tools to reflect changes
      await refreshLLMTools();
      
      Alert.alert(
        'Server Updated',
        `${serverStatuses.find(s => s.id === serverId)?.name} ${!currentEnabled ? 'enabled' : 'disabled'} successfully.`
      );
    } catch (error) {
      console.error('Error toggling server:', error);
      Alert.alert('Error', 'An error occurred while updating the server.');
    } finally {
      setIsLoading(false);
    }
  };

  const connectAllServers = async () => {
    setIsLoading(true);
    try {
      const promises = serverStatuses
        .filter(server => !server.isEnabled)
        .map(server => toggleMCPServer(server.id, true));
      
      await Promise.all(promises);
      await loadServerStatuses();
      await refreshLLMTools();
      
      Alert.alert('Success', 'All MCP servers connected successfully.');
    } catch (error) {
      console.error('Error connecting all servers:', error);
      Alert.alert('Error', 'Failed to connect all servers.');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectAllServers = async () => {
    setIsLoading(true);
    try {
      const promises = serverStatuses
        .filter(server => server.isEnabled)
        .map(server => toggleMCPServer(server.id, false));
      
      await Promise.all(promises);
      await loadServerStatuses();
      await refreshLLMTools();
      
      Alert.alert('Success', 'All MCP servers disconnected successfully.');
    } catch (error) {
      console.error('Error disconnecting all servers:', error);
      Alert.alert('Error', 'Failed to disconnect all servers.');
    } finally {
      setIsLoading(false);
    }
  };

  const groupedServers = serverStatuses.reduce((groups, server) => {
    if (!groups[server.category]) {
      groups[server.category] = [];
    }
    groups[server.category].push(server);
    return groups;
  }, {} as Record<string, ServerStatus[]>);

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          MCP Server Management
        </Text>
        <Text className="text-gray-600 mb-4">
          Control which AI tools and capabilities are available by enabling or disabling MCP servers.
        </Text>
        
        {/* Quick Actions */}
        <View className="flex-row space-x-4 mb-6">
          <TouchableOpacity
            onPress={connectAllServers}
            disabled={isLoading}
            className="flex-1 bg-blue-500 py-3 px-4 rounded-lg"
          >
            <Text className="text-white text-center font-semibold">
              {isLoading ? 'Loading...' : 'Enable All'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={disconnectAllServers}
            disabled={isLoading}
            className="flex-1 bg-red-500 py-3 px-4 rounded-lg"
          >
            <Text className="text-white text-center font-semibold">
              {isLoading ? 'Loading...' : 'Disable All'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Server Groups */}
      {Object.entries(groupedServers).map(([category, servers]) => (
        <View key={category} className="mb-6">
          <Text className="text-lg font-semibold text-gray-800 mb-3 capitalize">
            {category} Tools
          </Text>
          
          {servers.map((server) => (
            <View 
              key={server.id}
              className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-200"
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-4">
                  <Text className="text-lg font-semibold text-gray-900 mb-1">
                    {server.name}
                  </Text>
                  <Text className="text-gray-600 text-sm mb-2">
                    {server.description}
                  </Text>
                  
                  {/* Status Indicator */}
                  <View className="flex-row items-center">
                    <View 
                      className={`w-3 h-3 rounded-full mr-2 ${
                        server.isConnected ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    />
                    <Text className={`text-sm font-medium ${
                      server.isConnected ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {server.isConnected ? 'Connected' : 'Disconnected'}
                    </Text>
                  </View>
                </View>
                
                {/* Toggle Switch */}
                <Switch
                  value={server.isEnabled}
                  onValueChange={(value) => handleServerToggle(server.id, server.isEnabled)}
                  disabled={isLoading}
                  trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                  thumbColor={server.isEnabled ? '#ffffff' : '#ffffff'}
                />
              </View>
            </View>
          ))}
        </View>
      ))}

      {serverStatuses.length === 0 && (
        <View className="bg-white rounded-lg p-6 items-center">
          <Text className="text-gray-500 text-center">
            No MCP servers configured. Check your server registry configuration.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

export default MCPServerManagement;
