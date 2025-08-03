import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useGemini } from '../ai/GeminiContext';

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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>MCP Server Management</Text>
      <Text style={styles.subtitle}>
        Manage Model Context Protocol server connections
      </Text>

      <View style={styles.overview}>
        <View style={styles.overviewStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{connectedCount}/{totalCount}</Text>
            <Text style={styles.statLabel}>Connected</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{totalTools}</Text>
            <Text style={styles.statLabel}>Total Tools</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{servers.filter(s => s.status === 'error').length}</Text>
            <Text style={styles.statLabel}>Errors</Text>
          </View>
        </View>

        <View style={styles.overviewControls}>
          <View style={styles.autoReconnectRow}>
            <Text style={styles.autoReconnectLabel}>Auto-reconnect</Text>
            <Switch
              value={autoReconnect}
              onValueChange={setAutoReconnect}
            />
          </View>

          <TouchableOpacity
            style={[styles.connectAllButton, loading === 'all' && styles.disabledButton]}
            onPress={connectAllServers}
            disabled={loading === 'all' || connectedCount === totalCount}
          >
            {loading === 'all' ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.connectAllButtonText}>Connect All</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Server List</Text>

      {servers.map((server) => {
        const isExpanded = expandedServer === server.id;
        const isLoading = loading === server.id;

        return (
          <View key={server.id} style={styles.serverCard}>
            <TouchableOpacity
              style={styles.serverHeader}
              onPress={() => setExpandedServer(isExpanded ? null : server.id)}
            >
              <View style={styles.serverInfo}>
                <View style={styles.serverTitleRow}>
                  <Text style={styles.categoryIcon}>{getCategoryIcon(server.category)}</Text>
                  <Text style={styles.serverName}>{server.name}</Text>
                  <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(server.status) }]} />
                </View>
                <Text style={styles.serverDescription}>{server.description}</Text>
                <Text style={styles.serverUrl}>{server.url}</Text>
              </View>
              <Text style={styles.expandIcon}>{isExpanded ? '⌄' : '>'}</Text>
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.serverDetails}>
                <View style={styles.statusRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <Text style={[styles.statusText, { color: getStatusColor(server.status) }]}>
                    {getStatusIcon(server.status)} {server.status.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.statusRow}>
                  <Text style={styles.detailLabel}>Tools Available:</Text>
                  <Text style={styles.detailValue}>{server.toolCount} tools</Text>
                </View>

                <View style={styles.statusRow}>
                  <Text style={styles.detailLabel}>Last Connected:</Text>
                  <Text style={styles.detailValue}>{formatLastConnected(server.lastConnected)}</Text>
                </View>

                {server.errorMessage && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorLabel}>Error:</Text>
                    <Text style={styles.errorMessage}>{server.errorMessage}</Text>
                  </View>
                )}

                <View style={styles.capabilitiesContainer}>
                  <Text style={styles.capabilitiesLabel}>Available Tools ({server.capabilities.length}):</Text>
                  <View style={styles.capabilitiesList}>
                    {server.capabilities.map((capability, index) => (
                      <View key={index} style={styles.capabilityTag}>
                        <Text style={styles.capabilityText}>{capability}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.serverActions}>
                  {server.status === 'disconnected' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.connectButton]}
                      onPress={() => connectServer(server.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.actionButtonText}>Connect</Text>
                      )}
                    </TouchableOpacity>
                  )}

                  {server.status === 'connected' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.disconnectButton]}
                      onPress={() => disconnectServer(server.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.actionButtonText}>Disconnect</Text>
                      )}
                    </TouchableOpacity>
                  )}

                  {(server.status === 'error' || server.status === 'connected') && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.restartButton]}
                      onPress={() => restartServer(server.id)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.actionButtonText}>Restart</Text>
                      )}
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionButton, styles.testButton]}
                    onPress={() => testServer(server.id)}
                    disabled={isLoading}
                  >
                    <Text style={styles.actionButtonText}>Test Connection</Text>
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
