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
        <View className="flex-1 justify-center items-center px-10 py-20">
          <Text className="text-xl font-bold text-gray-800 mb-2 text-center">Wallet Not Connected</Text>
          <Text className="text-base text-gray-600 text-center mb-8 leading-6">
            Connect your wallet to access manual Solana operations
          </Text>
          <WalletConnectButton />
        </View>
      );
    }

    switch (activeSection) {
      case 'balance':
        return (
          <View className="p-5">
            <WalletBalance />
          </View>
        );
      
      case 'send':
        return (
          <View className="p-5">
            <View className="gap-5">
              <Text className="text-lg font-semibold text-gray-800 mb-4 mt-5">Send SOL</Text>
              <TransferSOL />
              
              <Text className="text-lg font-semibold text-gray-800 mb-4 mt-5">Send SPL Token</Text>
              <TransferSPLToken />
            </View>
          </View>
        );
      
      case 'history':
        return (
          <View className="p-5">
            <TransactionHistory />
          </View>
        );
      
      case 'templates':
        return (
          <View className="p-5">
            <TransactionTemplates />
          </View>
        );
      
      case 'operations':
        return (
          <View className="p-5">
            <WalletOperations />
          </View>
        );
      
      case 'builder':
        return (
          <View className="p-5">
            <TransactionBuilder />
          </View>
        );
      
      case 'advanced':
        return (
          <View className="p-5">
            <AdvancedTransactionFeatures />
          </View>
        );
      
      case 'backup':
        return (
          <View className="p-5">
            <BackupManualControls />
          </View>
        );
      
      case 'ai_status':
        return (
          <View className="p-5">
            <AIConnectionStatus />
            <AIConnectionManager />
          </View>
        );
      
      case 'mcp':
        return (
          <View className="p-5">
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
              <Text className="text-white text-xs font-medium">Disconnect</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View className="flex-row items-center">
          <View 
            className={`w-2 h-2 rounded-full mr-2 ${liveConnected ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <Text className="text-sm text-gray-800 font-medium">
            AI {liveConnected ? 'Connected' : 'Disconnected'}
          </Text>
          {liveConnected && (
            <TouchableOpacity
              className="bg-red-500 px-2 py-1 rounded ml-2"
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
              <Text className="text-white text-xs font-medium">Disconnect</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {connected && publicKey && (
          <Text className="text-xs text-gray-600 font-mono">
            {`${publicKey.toString().slice(0, 8)}...${publicKey.toString().slice(-8)}`}
          </Text>
        )}
      </View>

      {/* Section Navigation */}
      <ScrollView 
        horizontal 
        className="bg-white border-b border-gray-200"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 8 }}
      >
        <TouchableOpacity
          className={`py-4 px-4 items-center border-b-2 min-w-[100px] ${
            activeSection === 'balance' ? 'border-blue-500' : 'border-transparent'
          }`}
          onPress={() => setActiveSection('balance')}
        >
          <Text className={`text-sm font-medium ${
            activeSection === 'balance' ? 'text-blue-500 font-semibold' : 'text-gray-600'
          }`}>
            💰 Balance
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={`py-4 px-4 items-center border-b-2 min-w-[100px] ${
            activeSection === 'send' ? 'border-blue-500' : 'border-transparent'
          }`}
          onPress={() => setActiveSection('send')}
        >
          <Text className={`text-sm font-medium ${
            activeSection === 'send' ? 'text-blue-500 font-semibold' : 'text-gray-600'
          }`}>
            📤 Send
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={`py-4 px-4 items-center border-b-2 min-w-[100px] ${
            activeSection === 'history' ? 'border-blue-500' : 'border-transparent'
          }`}
          onPress={() => setActiveSection('history')}
        >
          <Text className={`text-sm font-medium ${
            activeSection === 'history' ? 'text-blue-500 font-semibold' : 'text-gray-600'
          }`}>
            📋 History
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={`py-4 px-4 items-center border-b-2 min-w-[100px] ${
            activeSection === 'templates' ? 'border-blue-500' : 'border-transparent'
          }`}
          onPress={() => setActiveSection('templates')}
        >
          <Text className={`text-sm font-medium ${
            activeSection === 'templates' ? 'text-blue-500 font-semibold' : 'text-gray-600'
          }`}>
            📄 Templates
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={`py-4 px-4 items-center border-b-2 min-w-[100px] ${
            activeSection === 'operations' ? 'border-blue-500' : 'border-transparent'
          }`}
          onPress={() => setActiveSection('operations')}
        >
          <Text className={`text-sm font-medium ${
            activeSection === 'operations' ? 'text-blue-500 font-semibold' : 'text-gray-600'
          }`}>
            🔧 Operations
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={`py-4 px-4 items-center border-b-2 min-w-[100px] ${
            activeSection === 'builder' ? 'border-blue-500' : 'border-transparent'
          }`}
          onPress={() => setActiveSection('builder')}
        >
          <Text className={`text-sm font-medium ${
            activeSection === 'builder' ? 'text-blue-500 font-semibold' : 'text-gray-600'
          }`}>
            🔨 Builder
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={`py-4 px-4 items-center border-b-2 min-w-[100px] ${
            activeSection === 'advanced' ? 'border-blue-500' : 'border-transparent'
          }`}
          onPress={() => setActiveSection('advanced')}
        >
          <Text className={`text-sm font-medium ${
            activeSection === 'advanced' ? 'text-blue-500 font-semibold' : 'text-gray-600'
          }`}>
            ⚡ Advanced
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={`py-4 px-4 items-center border-b-2 min-w-[100px] ${
            activeSection === 'backup' ? 'border-blue-500' : 'border-transparent'
          }`}
          onPress={() => setActiveSection('backup')}
        >
          <Text className={`text-sm font-medium ${
            activeSection === 'backup' ? 'text-blue-500 font-semibold' : 'text-gray-600'
          }`}>
            🛠️ Backup
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={`py-4 px-4 items-center border-b-2 min-w-[100px] ${
            activeSection === 'ai_status' ? 'border-blue-500' : 'border-transparent'
          }`}
          onPress={() => setActiveSection('ai_status')}
        >
          <Text className={`text-sm font-medium ${
            activeSection === 'ai_status' ? 'text-blue-500 font-semibold' : 'text-gray-600'
          }`}>
            🤖 AI Status
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={`py-4 px-4 items-center border-b-2 min-w-[100px] ${
            activeSection === 'nodes' ? 'border-blue-500' : 'border-transparent'
          }`}
          onPress={() => setActiveSection('nodes')}
        >
          <Text className={`text-sm font-medium ${
            activeSection === 'nodes' ? 'text-blue-500 font-semibold' : 'text-gray-600'
          }`}>
            👥 Nodes
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={`py-4 px-4 items-center border-b-2 min-w-[100px] ${
            activeSection === 'node_access' ? 'border-blue-500' : 'border-transparent'
          }`}
          onPress={() => setActiveSection('node_access')}
        >
          <Text className={`text-sm font-medium ${
            activeSection === 'node_access' ? 'text-blue-500 font-semibold' : 'text-gray-600'
          }`}>
            🔐 Access
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={`py-4 px-4 items-center border-b-2 min-w-[100px] ${
            activeSection === 'mcp' ? 'border-blue-500' : 'border-transparent'
          }`}
          onPress={() => setActiveSection('mcp')}
        >
          <Text className={`text-sm font-medium ${
            activeSection === 'mcp' ? 'text-blue-500 font-semibold' : 'text-gray-600'
          }`}>
            🔗 MCP
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {renderSectionContent()}
      </ScrollView>

      {/* Quick Actions */}
      {connected && (
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4">
          <Text className="text-sm font-semibold text-gray-800 mb-3">Quick Actions</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity 
              className="flex-1 bg-gray-50 py-3 px-4 rounded-lg items-center border border-gray-200"
              onPress={() => setActiveSection('send')}
            >
              <Text className="text-xs text-gray-800 font-medium">💸 Quick Send</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-1 bg-gray-50 py-3 px-4 rounded-lg items-center border border-gray-200"
              onPress={() => setActiveSection('balance')}
            >
              <Text className="text-xs text-gray-800 font-medium">🔄 Refresh Balance</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-1 bg-gray-50 py-3 px-4 rounded-lg items-center border border-gray-200"
              onPress={() => setActiveSection('builder')}
            >
              <Text className="text-xs text-gray-800 font-medium">🔨 Builder</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-1 bg-gray-50 py-3 px-4 rounded-lg items-center border border-gray-200"
              onPress={() => setActiveSection('operations')}
            >
              <Text className="text-xs text-gray-800 font-medium">🔧 Operations</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-1 bg-gray-50 py-3 px-4 rounded-lg items-center border border-gray-200"
              onPress={() => setActiveSection('templates')}
            >
              <Text className="text-xs text-gray-800 font-medium">📄 Templates</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-1 bg-gray-50 py-3 px-4 rounded-lg items-center border border-gray-200"
              onPress={() => setActiveSection('history')}
            >
              <Text className="text-xs text-gray-800 font-medium">📊 View Transactions</Text>
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
});
