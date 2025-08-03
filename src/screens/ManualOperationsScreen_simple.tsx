import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
  StyleSheet,
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
        <View style={styles.notConnectedContainer}>
          <Text style={styles.notConnectedTitle}>Wallet Not Connected</Text>
          <Text style={styles.notConnectedText}>
            Connect your wallet to access manual Solana operations
          </Text>
          <WalletConnectButton />
        </View>
      );
    }

    switch (activeSection) {
      case 'balance':
        return (
          <View style={styles.sectionContainer}>
            <WalletBalance />
          </View>
        );
      
      case 'send':
        return (
          <View style={styles.sectionContainer}>
            <View style={styles.sendContainer}>
              <Text style={styles.sectionTitle}>Send SOL</Text>
              <TransferSOL />
              
              <Text style={styles.sectionTitle}>Send SPL Token</Text>
              <TransferSPLToken />
            </View>
          </View>
        );
      
      case 'history':
        return (
          <View style={styles.sectionContainer}>
            <TransactionHistory />
          </View>
        );
      
      case 'templates':
        return (
          <View style={styles.sectionContainer}>
            <TransactionTemplates />
          </View>
        );
      
      case 'operations':
        return (
          <View style={styles.sectionContainer}>
            <WalletOperations />
          </View>
        );
      
      case 'builder':
        return (
          <View style={styles.sectionContainer}>
            <TransactionBuilder />
          </View>
        );
      
      case 'advanced':
        return (
          <View style={styles.sectionContainer}>
            <AdvancedTransactionFeatures />
          </View>
        );
      
      case 'backup':
        return (
          <View style={styles.sectionContainer}>
            <BackupManualControls />
          </View>
        );
      
      case 'ai_status':
        return (
          <View style={styles.sectionContainer}>
            <AIConnectionStatus />
            <AIConnectionManager />
          </View>
        );
      
      case 'mcp':
        return (
          <View style={styles.sectionContainer}>
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
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusSection}>
          <View 
            style={[styles.statusDot, { backgroundColor: connected ? '#10B981' : '#EF4444' }]}
          />
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
        
        <View style={styles.statusSection}>
          <View 
            style={[styles.statusDot, { backgroundColor: liveConnected ? '#10B981' : '#EF4444' }]}
          />
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
          <Text style={styles.publicKeyText}>
            {`${publicKey.toString().slice(0, 8)}...${publicKey.toString().slice(-8)}`}
          </Text>
        )}
      </View>

      {/* Section Navigation */}
      <ScrollView 
        horizontal 
        style={styles.navigationContainer}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      >
        <TouchableOpacity
          style={[styles.navTab, activeSection === 'balance' && styles.activeNavTab]}
          onPress={() => setActiveSection('balance')}
        >
          <Text style={[styles.navTabText, activeSection === 'balance' && styles.activeNavTabText]}>
            💰 Balance
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navTab, activeSection === 'send' && styles.activeNavTab]}
          onPress={() => setActiveSection('send')}
        >
          <Text style={[styles.navTabText, activeSection === 'send' && styles.activeNavTabText]}>
            📤 Send
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navTab, activeSection === 'history' && styles.activeNavTab]}
          onPress={() => setActiveSection('history')}
        >
          <Text style={[styles.navTabText, activeSection === 'history' && styles.activeNavTabText]}>
            📋 History
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navTab, activeSection === 'templates' && styles.activeNavTab]}
          onPress={() => setActiveSection('templates')}
        >
          <Text style={[styles.navTabText, activeSection === 'templates' && styles.activeNavTabText]}>
            📄 Templates
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navTab, activeSection === 'operations' && styles.activeNavTab]}
          onPress={() => setActiveSection('operations')}
        >
          <Text style={[styles.navTabText, activeSection === 'operations' && styles.activeNavTabText]}>
            🔧 Operations
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navTab, activeSection === 'builder' && styles.activeNavTab]}
          onPress={() => setActiveSection('builder')}
        >
          <Text style={[styles.navTabText, activeSection === 'builder' && styles.activeNavTabText]}>
            🔨 Builder
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navTab, activeSection === 'advanced' && styles.activeNavTab]}
          onPress={() => setActiveSection('advanced')}
        >
          <Text style={[styles.navTabText, activeSection === 'advanced' && styles.activeNavTabText]}>
            ⚡ Advanced
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navTab, activeSection === 'backup' && styles.activeNavTab]}
          onPress={() => setActiveSection('backup')}
        >
          <Text style={[styles.navTabText, activeSection === 'backup' && styles.activeNavTabText]}>
            🛠️ Backup
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navTab, activeSection === 'ai_status' && styles.activeNavTab]}
          onPress={() => setActiveSection('ai_status')}
        >
          <Text style={[styles.navTabText, activeSection === 'ai_status' && styles.activeNavTabText]}>
            🤖 AI Status
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navTab, activeSection === 'nodes' && styles.activeNavTab]}
          onPress={() => setActiveSection('nodes')}
        >
          <Text style={[styles.navTabText, activeSection === 'nodes' && styles.activeNavTabText]}>
            👥 Nodes
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navTab, activeSection === 'node_access' && styles.activeNavTab]}
          onPress={() => setActiveSection('node_access')}
        >
          <Text style={[styles.navTabText, activeSection === 'node_access' && styles.activeNavTabText]}>
            🔐 Access
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navTab, activeSection === 'mcp' && styles.activeNavTab]}
          onPress={() => setActiveSection('mcp')}
        >
          <Text style={[styles.navTabText, activeSection === 'mcp' && styles.activeNavTabText]}>
            🔗 MCP
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderSectionContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  disconnectButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  disconnectButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  publicKeyText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  navigationContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  navTab: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minWidth: 100,
  },
  activeNavTab: {
    borderBottomColor: '#3B82F6',
  },
  navTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeNavTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
  },
  notConnectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  notConnectedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  notConnectedText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  sectionContainer: {
    padding: 20,
  },
  sendContainer: {
    gap: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    marginTop: 20,
  },
});
