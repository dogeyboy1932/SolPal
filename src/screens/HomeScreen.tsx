import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// UI Libraries
import { Surface, Card, Avatar } from 'react-native-paper';

// Components
import AITransactionChat from '@/screens/AIChatScreen';
import { ManualOperationsScreen } from '../../src/screens/ManualOperationsScreen';
import { SettingsScreen } from '../../src/screens/SettingsScreen';
import { WalletConnectButton } from '@/features/wallet/WalletConnectButton';
import { PrivateKeyInput } from '@/features/wallet/PrivateKeyInput';



type TabType = 'chat' | 'manual' | 'settings';

export const HomeScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  // If settings is active, show the settings screen
  if (activeTab === 'settings') {
    return (
      <SettingsScreen onBack={() => setActiveTab('chat')} />
    );
  }

  return (
    <View className="flex-1 bg-surface-primary ">
      <SafeAreaView className="flex-1">
        {/* iOS-style status bar spacing */}
        {Platform.OS === 'ios' && (
          <View style={{ height: RNStatusBar.currentHeight || 44 }} />
        )}

        {/* Warm AI Header with Balanced Gradient */}
        <LinearGradient
          colors={['#b29b9bff', '#404040', '#B85C38']}
          className="border-b border-accent-amber/20"
        >
          <Surface className="bg-transparent mt-2" elevation={0}>
            
            <View className="px-5 py-2 pb-3">
              
              <View className="flex-row justify-between items-center my-1">
                <View className="flex-1">
                  <Text className="text-3xl font-bold text-neutral-light font-ios">
                    SolPal
                  </Text>
                  <Text className="text-base text-accent-gold font-ios">
                    Intelligent blockchain interactions
                  </Text>
                </View>
                
                <View className="flex-row items-center gap-3">
                  {/* Settings Button */}
                  <TouchableOpacity
                    className="w-10 h-10 rounded-full bg-accent-amber/20 items-center justify-center"
                    onPress={() => setActiveTab('settings')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="settings" size={20} color="#E49B3F" />
                  </TouchableOpacity>
                  
                  {/* AI Avatar */}
                  <Avatar.Icon 
                    size={48} 
                    icon="robot" 
                    style={{ backgroundColor: '#E49B3F' }}
                    color="#1A1A1A"
                  />
                </View>
              </View>
              
              {/* Wallet Connection & Private Key */}
              <Card className="bg-surface-secondary border border-accent-amber/40 rounded-lg">
                <Card.Content className="py-1 px-3 mb-2">
                  {/* Private Key Section */}
                  <PrivateKeyInput />
                  
                  {/* Wallet Connection Section */}
                  <Text className="text-sm font-semibold text-neutral-light mb-1 pt-1 mt-1">
                    Wallet Connection
                  </Text>

                  <WalletConnectButton />

                </Card.Content>
              </Card>
            </View>

          </Surface>
        </LinearGradient>

        {/* Main Content Area with Warm AI Theme */}
        <View className="flex-1 bg-surface-primary">
          {activeTab === 'chat' ? (
            <AITransactionChat />
          ) : (
            <ManualOperationsScreen />
          )}
        </View>

        {/* Warm AI Bottom Navigation */}
        <Surface 
          elevation={3}
          className="bg-surface-secondary border-t border-accent-amber/20"
        >
          <View className="flex-row bg-surface-secondary">
            <TouchableOpacity
              className={`flex-1 p-2 ${activeTab === 'chat' ? 'bg-accent-amber/20' : ''}`}
              onPress={() => setActiveTab('chat')}
              activeOpacity={0.7}
            >
              <View className="items-center">
                <Ionicons
                  name="chatbubble"
                  size={24}
                  color={activeTab === 'chat' ? '#E49B3F' : '#8B7355'}
                />
                <Text className={`text-xs mt-1 ${
                  activeTab === 'chat' ? 'text-accent-gold' : 'text-neutral-medium'
                }`}>
                  AI Chat
                </Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              className={`flex-1 p-2 ${activeTab === 'manual' ? 'bg-accent-amber/20' : ''}`}
              onPress={() => setActiveTab('manual')}
              activeOpacity={0.7}
            >
              <View className="items-center">
                <Ionicons
                  name="hammer-outline"
                  size={24}
                  color={activeTab === 'manual' ? '#E49B3F' : '#8B7355'}
                />
                <Text className={`text-xs mt-1 ${
                  activeTab === 'manual' ? 'text-accent-gold' : 'text-neutral-medium'
                }`}>
                  Manual
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* iOS Home Indicator */}
          {Platform.OS === 'ios' && (
            <View className="items-center py-2">
              <View className="w-32 h-1 bg-neutral-medium/30 rounded-full" />
            </View>
          )}
        </Surface>
      </SafeAreaView>
    </View>
  );
};
