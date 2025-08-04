import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
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
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#F8F9FA']}
        style={styles.card}
      >
        <Text style={styles.title}>AI Connection Manager</Text>
        
        {/* AI Connection Toggle */}
        <View style={styles.connectionRow}>
          <View style={styles.connectionInfo}>
            <Text style={styles.connectionTitle}>AI Assistant</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: isConnected ? '#34C759' : '#FF3B30' }]} />
              <Text style={[styles.statusText, { color: isConnected ? '#34C759' : '#FF3B30' }]}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          </View>
          <Switch
            value={isConnected}
            onValueChange={handleAIToggle}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor={isConnected ? '#FFFFFF' : '#FFFFFF'}
            ios_backgroundColor="#E5E5EA"
          />
        </View>

        {/* Disconnect Button */}
        {isConnected && (
          <TouchableOpacity style={styles.disconnectButton} onPress={() => handleAIToggle()}>
            <LinearGradient
              colors={['#FF3B30', '#FF6B6B']}
              style={styles.disconnectGradient}
            >
              <Ionicons name="power" size={16} color="white" />
              <Text style={styles.disconnectText}>Disconnect AI</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* MCP Servers Section */}
        {isConnected && (
          <View style={styles.mcpSection}>
            <Text style={styles.mcpTitle}>MCP Servers</Text>
            <Text style={styles.mcpSubtitle}>
              Enable MCP servers to give AI access to specific capabilities
            </Text>
            
            {Object.entries(MCP_SERVERS).map(([serverType, config]) => (
              <View key={serverType} style={styles.mcpServerRow}>
                <View style={styles.mcpServerInfo}>
                  <Text style={styles.mcpServerTitle}>{config.name}</Text>
                  <View style={styles.mcpStatusContainer}>
                    <View style={[
                      styles.mcpStatusDot, 
                      { backgroundColor: activeMCPServers[serverType] ? '#34C759' : '#C7C7CC' }
                    ]} />
                    <Text style={styles.mcpStatusText}>
                      {activeMCPServers[serverType] ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={activeMCPServers[serverType] || false}
                  onValueChange={(enabled) => handleMCPServerToggle(serverType, enabled)}
                  trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
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

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 20,
  },
  connectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  connectionInfo: {
    flex: 1,
  },
  connectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  disconnectButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    borderRadius: 8,
  },
  disconnectGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  disconnectText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  mcpSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  mcpTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  mcpSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
    lineHeight: 20,
  },
  mcpServerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  mcpServerInfo: {
    flex: 1,
  },
  mcpServerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  mcpStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mcpStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  mcpStatusText: {
    fontSize: 12,
    color: '#8E8E93',
  },
});
