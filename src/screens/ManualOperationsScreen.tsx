import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWallet } from '../contexts/WalletContext';
import { useGemini } from '../ai/GeminiContext';
import { WalletConnectButton } from '../components/WalletConnectButton';
import { WalletBalance } from '../components/WalletBalance';
import { TransactionHistory } from '../components/TransactionHistory';
import { TransferSOL } from '../components/TransferSOL';
import { TransferSPLToken } from '../components/TransferSPLToken';
import { TransactionTemplates } from '../components/TransactionTemplates';
import { WalletOperations } from '../components/WalletOperations';
import { TransactionBuilder } from '../components/TransactionBuilder';
import { AdvancedTransactionFeatures } from '@/components/AdvancedTransactionFeatures';
import { BackupManualControls } from '@/components/BackupManualControls';
import { AIConnectionStatus } from '../components/AIConnectionStatus';
import { MCPServerManagement } from '../components/MCPServerManagement';
import { AIConnectionManager } from '../components/AIConnectionManager';
import { ManualNodeManagement } from '../components/ManualNodeManagement';
import { NodeAccessControl } from '../components/NodeAccessControl';

export const ManualOperationsScreen: React.FC = () => {
  const { connected, connecting, publicKey, disconnect } = useWallet();
  const { liveConnected, liveDisconnect } = useGemini();
  const [refreshing, setRefreshing] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<'balance' | 'send' | 'history' | 'templates' | 'operations' | 'builder' | 'advanced' | 'backup' | 'ai_status' | 'mcp' | 'nodes' | 'node_access'>('balance');

  // Cross-platform alert function
  const showAlert = (title: string, message: string, buttons: Array<{text: string, onPress?: () => void, style?: 'default' | 'cancel' | 'destructive'}>) => {
    if (Platform.OS === 'web') {
      // Web implementation using window.confirm
      const confirmMessage = `${title}\n\n${message}`;
      const result = window.confirm(confirmMessage);
      
      // Find the appropriate button to execute
      if (result) {
        // User clicked OK - execute the non-cancel button
        const actionButton = buttons.find(btn => btn.style !== 'cancel');
        if (actionButton && actionButton.onPress) {
          actionButton.onPress();
        }
      } else {
        // User clicked Cancel - execute cancel button if exists
        const cancelButton = buttons.find(btn => btn.style === 'cancel');
        if (cancelButton && cancelButton.onPress) {
          cancelButton.onPress();
        }
      }
    } else {
      // Mobile implementation using Alert.alert
      Alert.alert(title, message, buttons);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Refresh data
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderSectionContent = () => {
    if (!connected || !publicKey) {
      return (
        <View style={styles.disconnectedContainer}>
          <Text style={styles.disconnectedTitle}>Wallet Not Connected</Text>
          <Text style={styles.disconnectedSubtitle}>
            Connect your wallet to access manual Solana operations
          </Text>
          <WalletConnectButton />
        </View>
      );
    }

    switch (activeSection) {
      case 'balance':
        return (
          <View style={styles.sectionContent}>
            <WalletBalance />
          </View>
        );
      
      case 'send':
        return (
          <View style={styles.sectionContent}>
            <View style={styles.transferContainer}>
              <Text style={styles.sectionTitle}>Send SOL</Text>
              <TransferSOL />
              
              <Text style={styles.sectionTitle}>Send SPL Token</Text>
              <TransferSPLToken />
            </View>
          </View>
        );
      
      case 'history':
        return (
          <View style={styles.sectionContent}>
            <TransactionHistory />
          </View>
        );
      
      case 'templates':
        return (
          <View style={styles.sectionContent}>
            <TransactionTemplates />
          </View>
        );
      
      case 'operations':
        return (
          <View style={styles.sectionContent}>
            <WalletOperations />
          </View>
        );
      
      case 'builder':
        return (
          <View style={styles.sectionContent}>
            <TransactionBuilder />
          </View>
        );
      
      case 'advanced':
        return (
          <View style={styles.sectionContent}>
            <AdvancedTransactionFeatures />
          </View>
        );
      
      case 'backup':
        return (
          <View style={styles.sectionContent}>
            <BackupManualControls />
          </View>
        );
      
      case 'ai_status':
        return (
          <View style={styles.sectionContent}>
            <AIConnectionStatus />
            <AIConnectionManager />
          </View>
        );
      
      case 'mcp':
        return (
          <View style={styles.sectionContent}>
            <MCPServerManagement />
          </View>
        );
      
      case 'nodes':
        return <ManualNodeManagement />;
      
      case 'node_access':
        return <NodeAccessControl />;
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manual Operations</Text>
        <Text style={styles.headerSubtitle}>Direct Solana wallet management</Text>
      </View>

      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusItem}>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: connected ? '#28a745' : '#dc3545' }
          ]} />
          <Text style={styles.statusText}>
            {connected ? 'Connected' : connecting ? 'Connecting...' : 'Disconnected'}
          </Text>
          {connected && (
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={() => {
                console.log('Wallet disconnect button pressed');
                try {
                  showAlert(
                    'Disconnect Wallet',
                    'Are you sure you want to disconnect your wallet?',
                    [
                      { 
                        text: 'Cancel', 
                        style: 'cancel',
                        onPress: () => console.log('Wallet disconnect cancelled')
                      },
                      { 
                        text: 'Disconnect', 
                        style: 'destructive', 
                        onPress: async () => {
                          console.log('Wallet disconnect confirmed');
                          try {
                            if (typeof disconnect === 'function') {
                              await disconnect();
                              console.log('Wallet disconnected successfully');
                            } else {
                              console.error('Disconnect function is not available');
                            }
                          } catch (error) {
                            console.error('Error disconnecting wallet:', error);
                            showAlert('Error', 'Failed to disconnect wallet', [{ text: 'OK' }]);
                          }
                        }
                      }
                    ]
                  );
                } catch (error) {
                  console.error('Error showing alert:', error);
                }
              }}
            >
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.statusItem}>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: liveConnected ? '#28a745' : '#dc3545' }
          ]} />
          <Text style={styles.statusText}>
            AI {liveConnected ? 'Connected' : 'Disconnected'}
          </Text>
          {liveConnected && (
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={() => {
                console.log('AI disconnect button pressed');
                try {
                  showAlert(
                    'Disconnect AI',
                    'Are you sure you want to disconnect from Gemini AI?',
                    [
                      { 
                        text: 'Cancel', 
                        style: 'cancel',
                        onPress: () => console.log('AI disconnect cancelled')
                      },
                      { 
                        text: 'Disconnect', 
                        style: 'destructive', 
                        onPress: async () => {
                          console.log('AI disconnect confirmed');
                          try {
                            if (typeof liveDisconnect === 'function') {
                              await liveDisconnect();
                              console.log('AI disconnected successfully');
                            } else {
                              console.error('liveDisconnect function is not available');
                            }
                          } catch (error) {
                            console.error('Error disconnecting AI:', error);
                            showAlert('Error', 'Failed to disconnect from AI', [{ text: 'OK' }]);
                          }
                        }
                      }
                    ]
                  );
                } catch (error) {
                  console.error('Error showing AI disconnect alert:', error);
                }
              }}
            >
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {connected && publicKey && (
          <Text style={styles.walletAddress}>
            {`${publicKey.toString().slice(0, 8)}...${publicKey.toString().slice(-8)}`}
          </Text>
        )}
      </View>

      {/* Section Navigation */}
      <ScrollView 
        horizontal 
        style={styles.sectionNav}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sectionNavContent}
      >
        <TouchableOpacity
          style={[
            styles.sectionButton,
            activeSection === 'balance' && styles.sectionButtonActive
          ]}
          onPress={() => setActiveSection('balance')}
        >
          <Text style={[
            styles.sectionButtonText,
            activeSection === 'balance' && styles.sectionButtonTextActive
          ]}>
            💰 Balance
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.sectionButton,
            activeSection === 'send' && styles.sectionButtonActive
          ]}
          onPress={() => setActiveSection('send')}
        >
          <Text style={[
            styles.sectionButtonText,
            activeSection === 'send' && styles.sectionButtonTextActive
          ]}>
            📤 Send
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.sectionButton,
            activeSection === 'history' && styles.sectionButtonActive
          ]}
          onPress={() => setActiveSection('history')}
        >
          <Text style={[
            styles.sectionButtonText,
            activeSection === 'history' && styles.sectionButtonTextActive
          ]}>
            📋 History
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.sectionButton,
            activeSection === 'templates' && styles.sectionButtonActive
          ]}
          onPress={() => setActiveSection('templates')}
        >
          <Text style={[
            styles.sectionButtonText,
            activeSection === 'templates' && styles.sectionButtonTextActive
          ]}>
            📄 Templates
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.sectionButton,
            activeSection === 'operations' && styles.sectionButtonActive
          ]}
          onPress={() => setActiveSection('operations')}
        >
          <Text style={[
            styles.sectionButtonText,
            activeSection === 'operations' && styles.sectionButtonTextActive
          ]}>
            🔧 Operations
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.sectionButton,
            activeSection === 'builder' && styles.sectionButtonActive
          ]}
          onPress={() => setActiveSection('builder')}
        >
          <Text style={[
            styles.sectionButtonText,
            activeSection === 'builder' && styles.sectionButtonTextActive
          ]}>
            🔨 Builder
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.sectionButton,
            activeSection === 'advanced' && styles.sectionButtonActive
          ]}
          onPress={() => setActiveSection('advanced')}
        >
          <Text style={[
            styles.sectionButtonText,
            activeSection === 'advanced' && styles.sectionButtonTextActive
          ]}>
            ⚡ Advanced
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.sectionButton,
            activeSection === 'backup' && styles.sectionButtonActive
          ]}
          onPress={() => setActiveSection('backup')}
        >
          <Text style={[
            styles.sectionButtonText,
            activeSection === 'backup' && styles.sectionButtonTextActive
          ]}>
            🛠️ Backup
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.sectionButton,
            activeSection === 'ai_status' && styles.sectionButtonActive
          ]}
          onPress={() => setActiveSection('ai_status')}
        >
          <Text style={[
            styles.sectionButtonText,
            activeSection === 'ai_status' && styles.sectionButtonTextActive
          ]}>
            🤖 AI Status
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.sectionButton,
            activeSection === 'nodes' && styles.sectionButtonActive
          ]}
          onPress={() => setActiveSection('nodes')}
        >
          <Text style={[
            styles.sectionButtonText,
            activeSection === 'nodes' && styles.sectionButtonTextActive
          ]}>
            👥 Nodes
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.sectionButton,
            activeSection === 'node_access' && styles.sectionButtonActive
          ]}
          onPress={() => setActiveSection('node_access')}
        >
          <Text style={[
            styles.sectionButtonText,
            activeSection === 'node_access' && styles.sectionButtonTextActive
          ]}>
            🔐 Access
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.sectionButton,
            activeSection === 'mcp' && styles.sectionButtonActive
          ]}
          onPress={() => setActiveSection('mcp')}
        >
          <Text style={[
            styles.sectionButtonText,
            activeSection === 'mcp' && styles.sectionButtonTextActive
          ]}>
            🔗 MCP
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderSectionContent()}
      </ScrollView>

      {/* Quick Actions */}
      {connected && (
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setActiveSection('send')}
            >
              <Text style={styles.quickActionText}>💸 Quick Send</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setActiveSection('balance')}
            >
              <Text style={styles.quickActionText}>🔄 Refresh Balance</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setActiveSection('builder')}
            >
              <Text style={styles.quickActionText}>🔨 Builder</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setActiveSection('operations')}
            >
              <Text style={styles.quickActionText}>🔧 Operations</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setActiveSection('templates')}
            >
              <Text style={styles.quickActionText}>📄 Templates</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => setActiveSection('history')}
            >
              <Text style={styles.quickActionText}>📊 View Transactions</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 5,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  walletAddress: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  sectionNav: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionNavContent: {
    paddingHorizontal: 8,
  },
  sectionButton: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minWidth: 100,
  },
  sectionButtonActive: {
    borderBottomColor: '#007AFF',
  },
  sectionButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  sectionButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100, // Space for quick actions
  },
  sectionContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    marginTop: 20,
  },
  transferContainer: {
    gap: 20,
  },
  disconnectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  disconnectedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  disconnectedSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  quickActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  disconnectButton: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  disconnectButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});
