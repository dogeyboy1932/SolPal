import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch } from 'react-native';
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
    <View style={styles.container}>
      <Text style={styles.title}>AI Connection Manager</Text>
      
      {/* AI Connection Toggle */}
      <View style={styles.connectionRow}>
        <View style={styles.connectionInfo}>
          <Text style={styles.connectionLabel}>AI Assistant</Text>
          <Text style={[styles.status, { color: isConnected ? '#22c55e' : '#ef4444' }]}>
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
          style={styles.disconnectButton}
          onPress={() => handleAIToggle()}
        >
          <Text style={styles.disconnectButtonText}>Disconnect AI</Text>
        </TouchableOpacity>
      )}

      {/* MCP Servers Section */}
      {isConnected && (
        <View style={styles.mcpSection}>
          <Text style={styles.sectionTitle}>MCP Servers</Text>
          <Text style={styles.sectionDescription}>
            Enable MCP servers to give AI access to specific capabilities
          </Text>
          
          {Object.entries(MCP_SERVERS).map(([serverType, config]) => (
            <View key={serverType} style={styles.mcpServerRow}>
              <View style={styles.serverInfo}>
                <Text style={styles.serverLabel}>{config.label}</Text>
                <Text style={styles.serverStatus}>
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  connectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  connectionInfo: {
    flex: 1,
  },
  connectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  status: {
    fontSize: 14,
    marginTop: 2,
  },
  disconnectButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  disconnectButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  mcpSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  mcpServerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  serverInfo: {
    flex: 1,
  },
  serverLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  serverStatus: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});
