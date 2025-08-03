import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AITransactionChat from '@/features/ai/AITransactionChat';
import { ManualOperationsScreen } from './ManualOperationsScreen';
import { WalletConnectButton } from '@/features/wallet/WalletConnectButton';

export const HomeScreen: React.FC = () => {
  const [showManualMode, setShowManualMode] = useState(true);

  return (
    <SafeAreaView className="flex-1 bg-white">
      {!showManualMode ? (
        <View className="flex-1">
          {/* Header with Manual Mode Toggle */}
          <View className="flex-row justify-between items-center py-4 px-5 border-b border-gray-200 bg-white">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900 mb-0.5">AI Solana Mobile</Text>
              <Text className="text-sm text-gray-500">Your AI-powered Solana wallet</Text>
            </View>

            <WalletConnectButton />
            
            <TouchableOpacity 
              className="flex-row items-center bg-gray-100 px-3 py-2 rounded-full" 
              onPress={() => setShowManualMode(true)}
            >
              <Ionicons name="settings-outline" size={20} color="#007AFF" />
              <Text className="text-blue-500 text-sm font-medium ml-1.5">Manual Mode</Text>
            </TouchableOpacity>
          </View>

          {/* AI Chat Interface - Primary UI */}
          <View className="flex-1">
            <AITransactionChat />
          </View>
        </View>
      ) : (
        <View className="flex-1">
          {/* Manual Operations Header */}
          <View className="bg-gray-100 py-4 px-5 border-b border-gray-200">
            <TouchableOpacity 
              className="flex-row items-center mb-3" 
              onPress={() => setShowManualMode(false)}
            >
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
              <Text className="text-blue-500 text-base font-medium ml-2">Back to AI Chat</Text>
            </TouchableOpacity>
            
            <Text className="text-xl font-semibold text-gray-900 mb-0.5">Manual Operations</Text>
            <Text className="text-sm text-gray-500">Full control interface</Text>
          </View>

          {/* Manual Operations Interface */}
          <View className="flex-1">
            <ManualOperationsScreen />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};
