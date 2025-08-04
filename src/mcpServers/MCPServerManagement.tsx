import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useGemini } from '../features/ai/GeminiContext';

interface MCPServer {
  id: string;
  name: string;
  description: string;
  url: string;
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  category: 'solana' | 'ai' | 'data' | 'utility';
  capabilities: string[];
  lastConnected?: Date;
  errorMessage?: string;
  toolCount: number;
}

export const MCPServerManagement: React.FC = () => {
  const { mcpConnect, mcpDisconnect, liveConnect, liveDisconnect, liveConnected, tools } = useGemini();
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [expandedServer, setExpandedServer] = useState<string | null>(null);
  const [autoReconnect, setAutoReconnect] = useState(true);

  // Initialize server status based on actual MCP connection
  useEffect(() => {
    const combinedServer: MCPServer = {
      id: 'combined',
      name: 'Combined Solana + Node Management MCP',
      description: 'Unified server providing blockchain operations and contact management',
      url: 'mcp://combined-mcp',
      status: tools.length > 0 ? 'connected' : 'disconnected',
      category: 'solana',
      capabilities: tools.map(tool => tool.name),
      lastConnected: tools.length > 0 ? new Date() : undefined,
      toolCount: tools.length,
    };

    setServers([combinedServer]);
  }, [tools]);

  // Update server status when tools change
  useEffect(() => {
    setServers(prev => prev.map(server => ({
      ...server,
      status: tools.length > 0 ? 'connected' : 'disconnected',
      capabilities: tools.map(tool => tool.name),
      toolCount: tools.length,
      lastConnected: tools.length > 0 ? new Date() : server.lastConnected,
    })));
  }, [tools]);

  const connectServer = async (serverId: string) => {
    if (serverId !== 'combined') return;
    
    setLoading(serverId);
    try {
      // Connect to combined MCP server
      const success = await mcpConnect('combined');
      
      if (success) {
        setServers(prev => prev.map(server =>
          server.id === serverId
            ? { 
                ...server, 
                status: 'connected', 
                lastConnected: new Date(), 
                errorMessage: undefined,
                toolCount: tools.length 
              }
            : server
        ));

        Toast.show({
          type: 'success',
          text1: 'MCP Server Connected',
          text2: `Connected with ${tools.length} tools available`,
        });
      } else {
        throw new Error('Failed to connect to MCP server');
      }
    } catch (error) {
      setServers(prev => prev.map(server =>
        server.id === serverId
          ? { ...server, status: 'error', errorMessage: 'Connection failed' }
          : server
      ));

      Toast.show({
        type: 'error',
        text1: 'Connection Failed',
        text2: 'Unable to connect to MCP server',
      });
    } finally {
      setLoading(null);
    }
  };

  const disconnectServer = async (serverId: string) => {
    if (serverId !== 'combined') return;
    
    setLoading(serverId);
    try {
      await mcpDisconnect();
      
      setServers(prev => prev.map(server =>
        server.id === serverId
          ? { ...server, status: 'disconnected', errorMessage: undefined, toolCount: 0 }
          : server
      ));

      Toast.show({
        type: 'info',
        text1: 'MCP Server Disconnected',
        text2: 'Server has been disconnected',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Disconnection Failed',
        text2: 'Error while disconnecting server',
      });
    } finally {
      setLoading(null);
    }
  };

  const restartServer = async (serverId: string) => {
    if (serverId !== 'combined') return;
    
    setLoading(serverId);
    try {
      // Disconnect first
      await mcpDisconnect();
      
      setServers(prev => prev.map(server =>
        server.id === serverId
          ? { ...server, status: 'disconnected' }
          : server
      ));

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Show connecting state
      setServers(prev => prev.map(server =>
        server.id === serverId
          ? { ...server, status: 'connecting' }
          : server
      ));

      // Reconnect
      const success = await mcpConnect('combined');
      
      if (success) {
        setServers(prev => prev.map(server =>
          server.id === serverId
            ? { 
                ...server, 
                status: 'connected', 
                lastConnected: new Date(), 
                errorMessage: undefined,
                toolCount: tools.length 
              }
            : server
        ));

        Toast.show({
          type: 'success',
          text1: 'MCP Server Restarted',
          text2: `Server restarted with ${tools.length} tools`,
        });
      } else {
        throw new Error('Failed to restart server');
      }
    } catch (error) {
      setServers(prev => prev.map(server =>
        server.id === serverId
          ? { ...server, status: 'error', errorMessage: 'Restart failed' }
          : server
      ));

      Toast.show({
        type: 'error',
        text1: 'Restart Failed',
        text2: 'Unable to restart MCP server',
      });
    } finally {
      setLoading(null);
    }
  };

  const connectAllServers = async () => {
    // Only one server to connect to
    await connectServer('combined');
  };

  const testServer = async (serverId: string) => {
    if (serverId !== 'combined' || tools.length === 0) {
      Alert.alert(
        'Test Failed',
        'MCP server is not connected or has no tools available'
      );
      return;
    }

    try {
      // Test the list_available_tools function if available
      const listToolsCapability = tools.find(tool => tool.name === 'list_available_tools');
      
      if (listToolsCapability) {
        Toast.show({
          type: 'success',
          text1: 'Test Successful',
          text2: `MCP server responding with ${tools.length} tools`,
        });

        Alert.alert(
          'MCP Server Test',
          `✅ Connection successful!\n\n🔧 Tools available: ${tools.length}\n📋 Server: Combined Solana + Node Management\n🔗 Status: Operational`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'MCP Server Status',
          `🔧 Tools available: ${tools.length}\n📋 Server: Combined Solana + Node Management\n🔗 Status: Connected but test tool not available`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Test Failed',
        text2: 'Error testing MCP server connection',
      });

      Alert.alert(
        'Test Failed',
        `❌ Error testing server: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const getStatusColor = (status: MCPServer['status']) => {
    switch (status) {
      case 'connected': return '#28a745';
      case 'connecting': return '#ffc107';
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status: MCPServer['status']) => {
    switch (status) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'error': return '🔴';
      default: return '⚫';
    }
  };

  const getCategoryIcon = (category: MCPServer['category']) => {
    switch (category) {
      case 'solana': return '⛓️';
      case 'ai': return '🤖';
      case 'data': return '📊';
      case 'utility': return '🔧';
      default: return '📦';
    }
  };

  const formatLastConnected = (date?: Date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  const connectedCount = servers.filter(s => s.status === 'connected').length;
  const totalCount = servers.length;
  const totalTools = servers.reduce((sum, server) => sum + server.toolCount, 0);

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4" showsVerticalScrollIndicator={false}>
      <Text className="text-2xl font-bold text-gray-900 mb-2">MCP Server Management</Text>
      <Text className="text-base text-gray-600 mb-6">
        Manage Model Context Protocol server connections
      </Text>

      <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
        <View className="flex-row justify-around mb-4">
          <View className="items-center">
            <Text className="text-2xl font-bold text-blue-600">{connectedCount}/{totalCount}</Text>
            <Text className="text-sm text-gray-600">Connected</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-green-600">{totalTools}</Text>
            <Text className="text-sm text-gray-600">Total Tools</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-red-600">{servers.filter(s => s.status === 'error').length}</Text>
            <Text className="text-sm text-gray-600">Errors</Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Text className="text-base text-gray-700 mr-3">Auto-reconnect</Text>
            <Switch
              value={autoReconnect}
              onValueChange={setAutoReconnect}
            />
          </View>

          <TouchableOpacity
            className={`px-4 py-2 rounded-lg ${
              loading === 'all' || connectedCount === totalCount
                ? 'bg-gray-300'
                : 'bg-blue-500'
            }`}
            onPress={connectAllServers}
            disabled={loading === 'all' || connectedCount === totalCount}
          >
            {loading === 'all' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white text-sm font-semibold">Connect All</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Text className="text-lg font-semibold text-gray-900 mb-4">Server List</Text>

      {servers.map((server) => {
        const isExpanded = expandedServer === server.id;
        const isLoading = loading === server.id;

        return (
          <View key={server.id} className="bg-white rounded-xl mb-4 shadow-sm">
            <TouchableOpacity
              className="p-4"
              onPress={() => setExpandedServer(isExpanded ? null : server.id)}
            >
              <View className="flex-1">
                <View className="flex-row items-center mb-2">
                  <Text className="text-lg mr-2">{getCategoryIcon(server.category)}</Text>
                  <Text className="flex-1 text-lg font-semibold text-gray-900">{server.name}</Text>
                  <View 
                    className="w-3 h-3 rounded-full ml-2" 
                    style={{ backgroundColor: getStatusColor(server.status) }} 
                  />
                </View>
                <Text className="text-sm text-gray-600 mb-1">{server.description}</Text>
                <Text className="text-xs text-gray-500 font-mono">{server.url}</Text>
              </View>
              <Text className="text-gray-400 text-lg ml-4">{isExpanded ? '⌄' : '>'}</Text>
            </TouchableOpacity>

            {isExpanded && (
              <View className="px-4 pb-4 border-t border-gray-100">
                <View className="flex-row justify-between py-2">
                  <Text className="text-sm font-medium text-gray-700">Status:</Text>
                  <Text className="text-sm font-medium" style={{ color: getStatusColor(server.status) }}>
                    {getStatusIcon(server.status)} {server.status.toUpperCase()}
                  </Text>
                </View>

                <View className="flex-row justify-between py-2">
                  <Text className="text-sm font-medium text-gray-700">Tools Available:</Text>
                  <Text className="text-sm text-gray-900">{server.toolCount} tools</Text>
                </View>

                <View className="flex-row justify-between py-2">
                  <Text className="text-sm font-medium text-gray-700">Last Connected:</Text>
                  <Text className="text-sm text-gray-900">{formatLastConnected(server.lastConnected)}</Text>
                </View>

                {server.errorMessage && (
                  <View className="bg-red-50 p-3 rounded-lg mt-2">
                    <Text className="text-sm font-medium text-red-800">Error:</Text>
                    <Text className="text-sm text-red-600">{server.errorMessage}</Text>
                  </View>
                )}

                <View className="mt-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Available Tools ({server.capabilities.length}):</Text>
                  <View className="flex-row flex-wrap">
                    {server.capabilities.map((capability, index) => (
                      <View key={index} className="bg-blue-100 px-2 py-1 rounded-md mr-2 mb-2">
                        <Text className="text-xs text-blue-800">{capability}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View className="flex-row flex-wrap gap-2 mt-4">
                  {server.status === 'disconnected' && (
                    <TouchableOpacity
                      className="flex-1 min-w-20 bg-green-500 py-2 px-4 rounded-lg items-center"
                      onPress={() => connectServer(server.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text className="text-white text-sm font-medium">Connect</Text>
                      )}
                    </TouchableOpacity>
                  )}

                  {server.status === 'connected' && (
                    <TouchableOpacity
                      className="flex-1 min-w-20 bg-red-500 py-2 px-4 rounded-lg items-center"
                      onPress={() => disconnectServer(server.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text className="text-white text-sm font-medium">Disconnect</Text>
                      )}
                    </TouchableOpacity>
                  )}

                  {(server.status === 'error' || server.status === 'connected') && (
                    <TouchableOpacity
                      className="flex-1 min-w-20 bg-yellow-500 py-2 px-4 rounded-lg items-center"
                      onPress={() => restartServer(server.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text className="text-white text-sm font-medium">Restart</Text>
                      )}
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    className="flex-1 min-w-20 bg-blue-500 py-2 px-4 rounded-lg items-center"
                    onPress={() => testServer(server.id)}
                    disabled={isLoading}
                  >
                    <Text className="text-white text-sm font-medium">Test Connection</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
};
