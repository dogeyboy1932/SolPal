import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useWallet } from '../contexts/WalletContext';
import { useGemini } from '../features/ai/GeminiContext';
import { WalletConnectButton } from '@/features/wallet/WalletConnectButton';
import { WalletBalance } from '@/features/wallet/WalletBalance';
import { TransactionHistory } from '@/features/transactions/TransactionHistory';
import { TransferSOL } from '@/features/transactions/TransferSOL';
import { TransferSPLToken } from '@/features/transactions/TransferSPLToken';
import { TransactionTemplates } from '@/features/transactions/TransactionTemplates';
import { WalletOperations } from '@/features/wallet/WalletOperations';
import { TransactionBuilder } from '@/features/transactions/TransactionBuilder';
import { AdvancedTransactionFeatures } from '@/features/transactions/AdvancedTransactionFeatures';
import { BackupManualControls } from '@/features/system/BackupManualControls';
import { AIConnectionStatus } from '@/features/ai/AIConnectionStatus';
import { MCPServerManagement } from '@/features/ai/MCPServerManagement';
import { AIConnectionManager } from '@/features/ai/AIConnectionManager';
import { ManualNodeManagement } from '@/features/nodes/ManualNodeManagement';
import { NodeAccessControl } from '@/features/nodes/NodeAccessControl';
// import { SmartTransactionFeatures } from '@/features/ai/SmartTransactionFeatures';
import { E2ETestRunner } from '@/features/system/E2ETestRunner';

export const ManualOperationsScreen: React.FC = () => {
  const { connected, connecting, publicKey, disconnect } = useWallet();
  const { liveConnected, liveDisconnect } = useGemini();
  const [refreshing, setRefreshing] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<'balance' | 'send' | 'history' | 'templates' | 'operations' | 'builder' | 'advanced' | 'backup' | 'ai_status' | 'mcp' | 'nodes' | 'node_access' 
  // | 'smart_ai' 
  | 'e2e_test'>('balance');

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
        <View className="flex-1 justify-center items-center px-10 py-15">
          <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-6">
            <Ionicons name="wallet-outline" size={48} color="#8E8E93" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-3 text-center">Wallet Not Connected</Text>
          <Text className="text-base text-gray-500 text-center leading-6 mb-8">
            Connect your wallet to access manual Solana operations
          </Text>
          <View className="self-stretch">
            <WalletConnectButton />
          </View>
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
              <Text className="text-lg font-semibold text-gray-900 mb-4 mt-5">Send SOL</Text>
              <TransferSOL />
              
              <Text className="text-lg font-semibold text-gray-900 mb-4 mt-5">Send SPL Token</Text>
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
        return (
          <View className="flex-1">
            <ManualNodeManagement />
          </View>
        );
      
      case 'node_access':
        return <NodeAccessControl />;
      
      // case 'smart_ai':
      //   return (
      //     <View className="flex-1">
      //       <SmartTransactionFeatures />
      //     </View>
      //   );
      
      case 'e2e_test':
        return (
          <View className="flex-1">
            <E2ETestRunner />
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Status Bar */}
      <LinearGradient
        colors={['#FFFFFF', '#F8F9FA']}
        className="px-5 py-3 border-b border-gray-200"
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1">
            <View className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <Text className="text-sm text-gray-900 font-medium flex-1">
              {connected ? 'Connected' : connecting ? 'Connecting...' : 'Disconnected'}
            </Text>
          </View>
          {connected && (
            <TouchableOpacity
              className="bg-red-500 px-3 py-1.5 rounded ml-2"
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
              <Text className="text-white text-xs font-semibold">Disconnect</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1">
            <View className={`w-2 h-2 rounded-full mr-2 ${liveConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <Text className="text-sm text-gray-900 font-medium flex-1">
              AI {liveConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
          {liveConnected && (
            <TouchableOpacity
              className="bg-red-500 px-3 py-1.5 rounded ml-2"
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
              <Text className="text-white text-xs font-semibold">Disconnect</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {connected && publicKey && (
          <Text className="text-xs text-gray-500 font-mono text-center mt-1">
            {`${publicKey.toString().slice(0, 8)}...${publicKey.toString().slice(-8)}`}
          </Text>
        )}
      </LinearGradient>

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

      {/* Section Navigation */}
      <View className="bg-white border-t border-gray-200 pb-8 max-h-20">
        <ScrollView 
          horizontal={true}
          className="bg-white flex-grow-0 h-15"
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 8, alignItems: 'center', flexDirection: 'row' }}
          nestedScrollEnabled={true}
          directionalLockEnabled={false}
          pagingEnabled={false}
          decelerationRate="fast"
        >
          {[
            { key: 'balance', icon: 'wallet', title: 'Balance' },
            { key: 'send', icon: 'send', title: 'Send' },
            { key: 'history', icon: 'time', title: 'History' },
            { key: 'templates', icon: 'document-text', title: 'Templates' },
            { key: 'nodes', icon: 'globe', title: 'Nodes' },
            { key: 'node_access', icon: 'lock-closed', title: 'Access' },
            { key: 'operations', icon: 'settings', title: 'Operations' },
            { key: 'builder', icon: 'construct', title: 'Builder' },
            { key: 'advanced', icon: 'flash', title: 'Advanced' },
            { key: 'backup', icon: 'shield-checkmark', title: 'Backup' },
            { key: 'ai_status', icon: 'sparkles', title: 'AI Status' },
            
            // { key: 'smart_ai', icon: 'brain', title: 'Smart AI' },
            { key: 'mcp', icon: 'link', title: 'MCP' },
            { key: 'e2e_test', icon: 'flask', title: 'E2E Test' },
          ].map((section) => (
            <TouchableOpacity
              key={section.key}
              className={`px-4 py-3 items-center justify-center min-w-25 border-b-2 flex-row gap-1.5 mx-0.5 ${
                activeSection === section.key ? 'border-blue-500' : 'border-transparent'
              }`}
              onPress={() => setActiveSection(section.key as any)}
            >
              <Ionicons 
                name={section.icon as any} 
                size={16} 
                color={activeSection === section.key ? '#007AFF' : '#8E8E93'} 
              />
              <Text className={`text-xs font-medium ${
                activeSection === section.key ? 'text-blue-500 font-semibold' : 'text-gray-500'
              }`}>
                {section.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};
