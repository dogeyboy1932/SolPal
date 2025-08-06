import React, { useState, useCallback, useEffect } from 'react';
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

// import { TransactionBuilder } from '@/features/transactions/TransactionBuilder';
// import { AdvancedTransactionFeatures } from '@/features/transactions/AdvancedTransactionFeatures';
// import { BackupManualControls } from '@/features/system/BackupManualControls';
// import { AIConnectionStatus } from '@/features/ai/AIConnectionStatus';
// import { MCPServerManagement } from '@/features/ai/MCPServerManagement';
// import { AIConnectionManager } from '@/features/ai/AIConnectionManager';
// import { ManualNodeManagement } from '@/features/nodes/ManualNodeManagement';
// import { NodeAccessControl } from '@/features/nodes/NodeAccessControl';
// import { SmartTransactionFeatures } from '@/features/ai/SmartTransactionFeatures';
// import { E2ETestRunner } from '@/features/system/E2ETestRunner';

export const ManualOperationsScreen: React.FC = () => {
  const { connected, connecting, publicKey, disconnect } = useWallet();
  const { stopListening } = useGemini();
  const [refreshing, setRefreshing] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<'balance' | 'send' | 'history' | 'templates' | 'operations' | 'builder' | 'advanced' | 'backup' | 'ai_status' | 'mcp' | 'nodes' | 'node_access' 
  // | 'smart_ai' 
  | 'e2e_test'>('balance');


  useEffect(() => {
    // Stop listening when component unmounts
    return () => {
      stopListening();
    };
  }, [stopListening]);

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


  const renderSectionContent = () => {
    if (!connected || !publicKey) {
      return (
        <View className="flex-1 justify-center items-center bg-surface-secondary pb-6 px-3">
          <View className="w-20 h-20 rounded-full bg-surface-secondary items-center justify-center">
            <Ionicons name="wallet-outline" size={48} color="#E49B3F" />
          </View>
          <Text className="text-2xl font-bold text-neutral-light mb-3 text-center">Wallet Not Connected</Text>
          <Text className="text-base text-neutral-medium text-center leading-6 mb-8">
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
          <View className="px-3 py-1">
            <WalletBalance />
          </View>
        );
      
      case 'send':
        return (
          <View className="px-3 py-3">
            <TransferSOL />
            <TransferSPLToken />
          </View>
        );
      
      case 'history':
        return (
          <View className="px-3 py-1">
            <TransactionHistory />
          </View>
        );
      
      case 'templates':
        return (
          <View className="px-3 py-1">
            <TransactionTemplates />
          </View>
        );
      
      case 'operations':
        return (
          <View className="px-3 py-1">
            <WalletOperations />
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <View className="flex-1" style={{backgroundColor: '#F9EEE1'}}>
      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {renderSectionContent()}
      </ScrollView>

      {/* Section Navigation */}
      <ScrollView
        horizontal={true}
        className="bg-neutral-light border-t border-warm-tertiary flex-grow-0 py-1"
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
          { key: 'operations', icon: 'settings', title: 'Operations' },
          // a

        ].map((section, index) => (
          <React.Fragment key={section.key}>
            <TouchableOpacity
              className={`px-1 py-2 items-center justify-center min-w-25 border-b-2 flex-row  ${
                activeSection === section.key ? 'border-orange-400' : 'border-transparent'
              }`}
              onPress={() => setActiveSection(section.key as any)}
            >
              <Ionicons 
                name={section.icon as any} 
                size={16} 
                color={activeSection === section.key ? '#E49B3F' : '#8B5A3C'} 
              />
              <Text className={`ml-0.5 text-xs font-medium ${
                activeSection === section.key ? 'text-orange-500 font-semibold' : 'text-amber-700'
              }`}>
                {section.title}
              </Text>
            </TouchableOpacity>

            {index < 4 && (
              <View className="w-1 h-1 bg-amber-600 rounded-full mx-1" />
            )}
          </React.Fragment>
        ))}
      </ScrollView>
    </View>
  );
};







        {/* <View className="flex-row items-center justify-between">
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
        </View> */}

{/* Status Bar */}
      {/* <LinearGradient
        colors={['#C4A484', '#e7bd8aff']}
        className="px-2 py-1 border-b border-amber-800"
      >
        <View className="flex-row items-center justify-between my-1">
          <View className="flex-row items-center flex-1">
            <View className={`w-2 h-2 rounded-full mr-2 border border-black ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <Text className="text-sm text-gray-900 font-medium flex-1">
              Wallet {connected ? 'Connected' : connecting ? 'Connecting...' : 'Disconnected'}
            </Text>

            {connected && publicKey && (
            <Text className="text-xs font-mono text-center ">
              {`${publicKey.toString().slice(0, 8)}...${publicKey.toString().slice(-8)}`}
            </Text>
          )}
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
        
      </LinearGradient> */}        

// { key: 'nodes', icon: 'globe', title: 'Nodes' },
// { key: 'mcp', icon: 'link', title: 'MCP' },
// { key: 'builder', icon: 'construct', title: 'Builder' },
// { key: 'ai_status', icon: 'sparkles', title: 'AI Status' },
// { key: 'e2e_test', icon: 'flask', title: 'E2E Test' },


// const onRefresh = React.useCallback(async () => {
  //   setRefreshing(true);
  //   // Refresh data
  //   setTimeout(() => setRefreshing(false), 1000);
  // }, []);