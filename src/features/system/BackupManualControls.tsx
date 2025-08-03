import React, { useState } from 'react';
import {
  View,
  Text,
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
    
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'connected': return 'bg-green-500';
        case 'available': return 'bg-yellow-500';
        case 'error': return 'bg-red-500';
        case 'disabled': return 'bg-gray-500';
        default: return 'bg-gray-500';
      }
    };
    
    return (
      <View key={control.id} className="bg-white rounded-xl p-4 mb-3 border border-gray-200">
        <View className="flex-row items-center mb-3">
          <Text className="text-2xl mr-3">{control.icon}</Text>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-800 mb-0.5">{control.name}</Text>
            <Text className="text-sm text-gray-600 leading-4">{control.description}</Text>
          </View>
          <View className={`w-2.5 h-2.5 rounded-full ${getStatusColor(control.status)}`} />
        </View>

        <View className="flex-row gap-2 flex-wrap">
          {control.category === 'ai' && (
            <>
              <TouchableOpacity
                className="bg-blue-500 px-4 py-2 rounded-md min-w-20 items-center"
                onPress={() => handleAIControl(aiConnected ? 'disconnect' : 'connect')}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white text-sm font-medium">
                    {aiConnected ? 'Disconnect' : 'Connect'}
                  </Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                className="bg-gray-100 border border-gray-300 px-4 py-2 rounded-md min-w-20 items-center"
                onPress={() => handleAIControl('reset')}
                disabled={isLoading}
              >
                <Text className="text-gray-800 text-sm font-medium">Reset</Text>
              </TouchableOpacity>
            </>
          )}

          {control.category === 'wallet' && (
            <>
              <TouchableOpacity
                className="bg-blue-500 px-4 py-2 rounded-md min-w-20 items-center"
                onPress={() => handleWalletControl(walletConnected ? 'disconnect' : 'connect')}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white text-sm font-medium">
                    {walletConnected ? 'Disconnect' : 'Connect'}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {control.category === 'node' && (
            <>
              <TouchableOpacity
                className="bg-gray-100 border border-gray-300 px-4 py-2 rounded-md min-w-20 items-center"
                onPress={() => handleNodeControl('clear_active')}
                disabled={nodeCount === 0}
              >
                <Text className="text-gray-800 text-sm font-medium">Clear Active</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="bg-red-500 px-4 py-2 rounded-md min-w-20 items-center"
                onPress={() => handleNodeControl('clear_all')}
                disabled={nodeCount === 0}
              >
                <Text className="text-white text-sm font-medium">Clear All</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                className="bg-gray-100 border border-gray-300 px-4 py-2 rounded-md min-w-20 items-center"
                onPress={() => handleNodeControl('backup_export')}
              >
                <Text className="text-gray-800 text-sm font-medium">Export</Text>
              </TouchableOpacity>
            </>
          )}

          {control.category === 'mcp' && (
            <TouchableOpacity
              className="bg-gray-100 border border-gray-300 px-4 py-2 rounded-md min-w-20 items-center"
              onPress={() => {
                Alert.alert(
                  'MCP Server Control',
                  'MCP server management will be available in the dedicated MCP panel.',
                  [{ text: 'OK' }]
                );
              }}
            >
              <Text className="text-gray-800 text-sm font-medium">Manage</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-100" showsVerticalScrollIndicator={false}>
      <Text className="text-2xl font-bold text-gray-800 mb-2">Backup & Manual Controls</Text>
      <Text className="text-base text-gray-600 mb-6">
        Manual override controls for all AI-powered features
      </Text>

      <View className="bg-white rounded-xl p-4 mb-5 border border-gray-200">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-lg font-semibold text-gray-800">Manual Mode Override</Text>
          <Switch
            value={manualMode}
            onValueChange={setManualMode}
          />
        </View>
        <Text className="text-sm text-gray-600 leading-5">
          {manualMode 
            ? 'Manual mode active - AI features disabled' 
            : 'AI mode active - automatic features enabled'
          }
        </Text>
      </View>

      <View className="bg-white rounded-xl p-4 mb-5 border border-gray-200">
        <Text className="text-lg font-semibold text-gray-800 mb-4">System Status</Text>
        <View className="flex-row justify-around">
          <View className="items-center">
            <Text className="text-xs text-gray-600 mb-1">AI</Text>
            <View className={`w-3 h-3 rounded-full ${aiConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          </View>
          <View className="items-center">
            <Text className="text-xs text-gray-600 mb-1">Wallet</Text>
            <View className={`w-3 h-3 rounded-full ${walletConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          </View>
          <View className="items-center">
            <Text className="text-xs text-gray-600 mb-1">Nodes</Text>
            <View className={`w-3 h-3 rounded-full ${nodeCount > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
          </View>
          <View className="items-center">
            <Text className="text-xs text-gray-600 mb-1">MCP</Text>
            <View className={`w-3 h-3 rounded-full ${mcpServersActive > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
          </View>
        </View>
      </View>

      <Text className="text-lg font-semibold text-gray-800 mb-4">Component Controls</Text>
      {backupControls.map(renderControlCard)}

      <View className="bg-yellow-50 rounded-xl p-4 mt-5 border border-yellow-200">
        <Text className="text-lg font-semibold text-yellow-800 mb-2">🚨 Emergency Controls</Text>
        <Text className="text-sm text-yellow-800 mb-4 leading-5">
          Use these controls if the app becomes unresponsive
        </Text>
        
        <TouchableOpacity
          className="bg-red-500 rounded-lg p-3.5 items-center"
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
            <Text className="text-white text-base font-semibold">Full System Reset</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};
