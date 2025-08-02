import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useWallet } from '@/contexts/WalletContext';
import Toast from 'react-native-toast-message';

interface BackupControl {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'ai' | 'node' | 'wallet' | 'mcp';
  status: 'available' | 'connected' | 'error' | 'disabled';
}

export const BackupManualControls: React.FC = () => {
  const { 
    connected: walletConnected, 
    disconnect: disconnectWallet, 
    connect: connectWallet 
  } = useWallet();

  const [loading, setLoading] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  
  // Mock states for demo purposes - in real app these would come from actual contexts
  const [aiConnected, setAiConnected] = useState(false);
  const [nodeCount, setNodeCount] = useState(0);
  const [mcpServersActive, setMcpServersActive] = useState(0);

  const backupControls: BackupControl[] = [
    {
      id: 'ai_connection',
      name: 'AI Connection',
      description: 'Manage AI connection and fallback to manual mode',
      icon: '🤖',
      category: 'ai',
      status: aiConnected ? 'connected' : 'available'
    },
    {
      id: 'wallet_connection',
      name: 'Wallet Connection',
      description: 'Manual wallet connection controls',
      icon: '👛',
      category: 'wallet',
      status: walletConnected ? 'connected' : 'available'
    },
    {
      id: 'node_management',
      name: 'Node Management',
      description: 'Backup controls for node creation and management',
      icon: '🗂️',
      category: 'node',
      status: nodeCount > 0 ? 'connected' : 'available'
    },
    {
      id: 'mcp_servers',
      name: 'MCP Servers',
      description: 'Manual control of MCP server connections',
      icon: '🔗',
      category: 'mcp',
      status: mcpServersActive > 0 ? 'connected' : 'available'
    }
  ];

  const handleAIControl = async (action: 'connect' | 'disconnect' | 'reset') => {
    setLoading('ai_connection');
    try {
      switch (action) {
        case 'disconnect':
          setAiConnected(false);
          Toast.show({
            type: 'success',
            text1: 'AI Disconnected',
            text2: 'Switched to manual mode',
          });
          setManualMode(true);
          break;
        case 'connect':
          setAiConnected(true);
          Toast.show({
            type: 'success',
            text1: 'AI Reconnected',
            text2: 'AI features restored',
          });
          setManualMode(false);
          break;
        case 'reset':
          setAiConnected(false);
          setTimeout(() => {
            setAiConnected(true);
            Toast.show({
              type: 'success',
              text1: 'AI Reset Complete',
              text2: 'AI connection refreshed',
            });
          }, 1000);
          break;
      }
    } catch (error) {
      console.error('AI control error:', error);
      Toast.show({
        type: 'error',
        text1: 'AI Control Failed',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleWalletControl = async (action: 'connect' | 'disconnect') => {
    setLoading('wallet_connection');
    try {
      switch (action) {
        case 'disconnect':
          await disconnectWallet();
          Toast.show({
            type: 'success',
            text1: 'Wallet Disconnected',
            text2: 'Manual reconnection required',
          });
          break;
        case 'connect':
          await connectWallet();
          Toast.show({
            type: 'success',
            text1: 'Wallet Connected',
            text2: 'Wallet features restored',
          });
          break;
      }
    } catch (error) {
      console.error('Wallet control error:', error);
      Toast.show({
        type: 'error',
        text1: 'Wallet Control Failed',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(null);
    }
  };

  const handleNodeControl = (action: 'clear_active' | 'clear_all' | 'backup_export') => {
    switch (action) {
      case 'clear_active':
        Alert.alert(
          'Clear Active Node',
          'Remove active node from context?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Clear',
              style: 'destructive',
              onPress: () => {
                Toast.show({
                  type: 'success',
                  text1: 'Active Node Cleared',
                  text2: 'No node context active',
                });
              }
            }
          ]
        );
        break;
      case 'clear_all':
        Alert.alert(
          'Clear All Nodes',
          `Delete all ${nodeCount} nodes? This cannot be undone.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete All',
              style: 'destructive',
              onPress: () => {
                setNodeCount(0);
                Toast.show({
                  type: 'success',
                  text1: 'All Nodes Cleared',
                  text2: 'Node system reset',
                });
              }
            }
          ]
        );
        break;
      case 'backup_export':
        // In a real implementation, this would export node data
        Alert.alert(
          'Export Nodes',
          'This would export your nodes for backup. Feature coming soon.',
          [{ text: 'OK' }]
        );
        break;
    }
  };

  const renderControlCard = (control: BackupControl) => {
    const isLoading = loading === control.id;
    
    return (
      <View key={control.id} style={styles.controlCard}>
        <View style={styles.controlHeader}>
          <Text style={styles.controlIcon}>{control.icon}</Text>
          <View style={styles.controlInfo}>
            <Text style={styles.controlName}>{control.name}</Text>
            <Text style={styles.controlDescription}>{control.description}</Text>
          </View>
          <View style={[styles.statusIndicator, styles[`status_${control.status}`]]} />
        </View>

        <View style={styles.controlActions}>
          {control.category === 'ai' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={() => handleAIControl(aiConnected ? 'disconnect' : 'connect')}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {aiConnected ? 'Disconnect' : 'Connect'}
                  </Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => handleAIControl('reset')}
                disabled={isLoading}
              >
                <Text style={styles.secondaryButtonText}>Reset</Text>
              </TouchableOpacity>
            </>
          )}

          {control.category === 'wallet' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={() => handleWalletControl(walletConnected ? 'disconnect' : 'connect')}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {walletConnected ? 'Disconnect' : 'Connect'}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {control.category === 'node' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => handleNodeControl('clear_active')}
                disabled={nodeCount === 0}
              >
                <Text style={styles.secondaryButtonText}>Clear Active</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.warningButton]}
                onPress={() => handleNodeControl('clear_all')}
                disabled={nodeCount === 0}
              >
                <Text style={styles.warningButtonText}>Clear All</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => handleNodeControl('backup_export')}
              >
                <Text style={styles.secondaryButtonText}>Export</Text>
              </TouchableOpacity>
            </>
          )}

          {control.category === 'mcp' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() => {
                Alert.alert(
                  'MCP Server Control',
                  'MCP server management will be available in the dedicated MCP panel.',
                  [{ text: 'OK' }]
                );
              }}
            >
              <Text style={styles.secondaryButtonText}>Manage</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Backup & Manual Controls</Text>
      <Text style={styles.subtitle}>
        Manual override controls for all AI-powered features
      </Text>

      <View style={styles.manualModeSection}>
        <View style={styles.manualModeHeader}>
          <Text style={styles.manualModeTitle}>Manual Mode Override</Text>
          <Switch
            value={manualMode}
            onValueChange={setManualMode}
          />
        </View>
        <Text style={styles.manualModeDescription}>
          {manualMode 
            ? 'Manual mode active - AI features disabled' 
            : 'AI mode active - automatic features enabled'
          }
        </Text>
      </View>

      <View style={styles.systemStatus}>
        <Text style={styles.sectionTitle}>System Status</Text>
        <View style={styles.statusGrid}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>AI</Text>
            <View style={[styles.statusDot, aiConnected ? styles.statusActive : styles.statusInactive]} />
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Wallet</Text>
            <View style={[styles.statusDot, walletConnected ? styles.statusActive : styles.statusInactive]} />
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Nodes</Text>
            <View style={[styles.statusDot, nodeCount > 0 ? styles.statusActive : styles.statusInactive]} />
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>MCP</Text>
            <View style={[styles.statusDot, mcpServersActive > 0 ? styles.statusActive : styles.statusInactive]} />
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Component Controls</Text>
      {backupControls.map(renderControlCard)}

      <View style={styles.emergencySection}>
        <Text style={styles.emergencyTitle}>🚨 Emergency Controls</Text>
        <Text style={styles.emergencyDescription}>
          Use these controls if the app becomes unresponsive
        </Text>
        
        <TouchableOpacity
          style={styles.emergencyButton}
          onPress={() => {
            Alert.alert(
              'Full System Reset',
              'This will disconnect all services and clear temporary data. Continue?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset All',
                  style: 'destructive',
                  onPress: async () => {
                    setLoading('emergency');
                    try {
                      setAiConnected(false);
                      await disconnectWallet();
                      setNodeCount(0);
                      setManualMode(true);
                      
                      Toast.show({
                        type: 'success',
                        text1: 'System Reset Complete',
                        text2: 'All services disconnected',
                      });
                    } catch (error) {
                      console.error('Emergency reset error:', error);
                    } finally {
                      setLoading(null);
                    }
                  }
                }
              ]
            );
          }}
          disabled={loading === 'emergency'}
        >
          {loading === 'emergency' ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.emergencyButtonText}>Full System Reset</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  manualModeSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  manualModeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  manualModeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  manualModeDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  systemStatus: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: '#28a745',
  },
  statusInactive: {
    backgroundColor: '#dc3545',
  },
  controlCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  controlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  controlIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  controlInfo: {
    flex: 1,
  },
  controlName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  controlDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  status_available: {
    backgroundColor: '#ffc107',
  },
  status_connected: {
    backgroundColor: '#28a745',
  },
  status_error: {
    backgroundColor: '#dc3545',
  },
  status_disabled: {
    backgroundColor: '#6c757d',
  },
  controlActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  warningButton: {
    backgroundColor: '#dc3545',
  },
  warningButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  emergencySection: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  emergencyDescription: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 16,
    lineHeight: 20,
  },
  emergencyButton: {
    backgroundColor: '#dc3545',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
