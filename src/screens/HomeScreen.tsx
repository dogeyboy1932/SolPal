import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from 'react-native-paper';
import AITransactionChat from '@/screens/AIChatScreen';
import { ManualOperationsScreen } from '../../src/screens/ManualOperationsScreen';
import { ProfileScreen } from './ProfileScreen';
import { EventsScreen } from '../../src/screens/EventsScreen';
import { WalletConnectButton } from '@/features/wallet/WalletConnectButton';
import { PrivateKeyInput } from '@/features/wallet/PrivateKeyInput';

type TabType = 'chat' | 'manual' | 'settings' | 'events';

export const HomeScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  if (activeTab === 'settings') {
    return <ProfileScreen onBack={() => setActiveTab('chat')} />;
  }

  if (activeTab === 'events') {
    return <EventsScreen onBack={() => setActiveTab('chat')} />;
  }

  return (
    <View className="flex-1 bg-[#0d0d0d]">
      <SafeAreaView className="flex-1">
        <View className="p-5 bg-[#1a1a1a] border-b-2 border-[#00f6ff]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-4xl font-bold text-[#00f6ff] font-mono tracking-widest">
              SolPal
            </Text>
            <View className="flex-row items-center gap-4">
              <TouchableOpacity
                className="p-2 bg-[#00f6ff]/20 rounded-full"
                onPress={() => setActiveTab('events')}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar" size={24} color="#00f6ff" />
              </TouchableOpacity>
              <TouchableOpacity
                className="p-2 bg-[#00f6ff]/20 rounded-full"
                onPress={() => setActiveTab('settings')}
                activeOpacity={0.7}
              >
                <Ionicons name="person" size={24} color="#00f6ff" />
              </TouchableOpacity>
            </View>
          </View>
          <Card className="bg-[#1a1a1a] border-2 border-[#ff00ff]/40 rounded-xl shadow-lg shadow-cyan-500/50">
            <Card.Content className="p-4">
              <PrivateKeyInput />
              <View className="h-4" />
              <WalletConnectButton />
            </Card.Content>
          </Card>
        </View>
        <View className="flex-1 bg-[#0d0d0d]">
          {activeTab === 'chat' ? (
            <AITransactionChat />
          ) : (
            <ManualOperationsScreen />
          )}
        </View>
        <View className="flex-row bg-[#1a1a1a] border-t-2 border-[#00f6ff]">
          <TouchableOpacity
            className={`flex-1 py-3 items-center justify-center ${
              activeTab === 'chat' ? 'bg-[#00f6ff]/20' : ''
            }`}
            onPress={() => setActiveTab('chat')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={28}
              color={activeTab === 'chat' ? '#00f6ff' : '#a0a0a0'}
            />
            <Text
              className={`text-xs mt-1 font-bold ${
                activeTab === 'chat' ? 'text-[#00f6ff]' : 'text-gray-400'
              }`}
            >
              AI Chat
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-3 items-center justify-center ${
              activeTab === 'manual' ? 'bg-[#00f6ff]/20' : ''
            }`}
            onPress={() => setActiveTab('manual')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="hammer-outline"
              size={28}
              color={activeTab === 'manual' ? '#00f6ff' : '#a0a0a0'}
            />
            <Text
              className={`text-xs mt-1 font-bold ${
                activeTab === 'manual' ? 'text-[#00f6ff]' : 'text-gray-400'
              }`}
            >
              Manual
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};
