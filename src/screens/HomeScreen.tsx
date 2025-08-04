import React, { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  StatusBar as RNStatusBar,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AITransactionChat from '@/features/ai/AITransactionChat';
import { ManualOperationsScreen } from './ManualOperationsScreen';
import { WalletConnectButton } from '@/features/wallet/WalletConnectButton';
import { PrivateKeyInput } from '@/features/wallet/PrivateKeyInput';

type TabType = 'chat' | 'manual';

export const HomeScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('chat');

  const TabButton = ({ 
    tab, 
    icon, 
    label, 
    isActive 
  }: { 
    tab: TabType; 
    icon: string; 
    label: string; 
    isActive: boolean;
  }) => (
    <TouchableOpacity
      style={styles.tabButton}
      onPress={() => setActiveTab(tab)}
      activeOpacity={0.6}
    >
      <View style={styles.tabContent}>
        <View style={[
          styles.iconContainer,
          isActive && styles.activeIconContainer
        ]}>
          <Ionicons
            name={icon as any}
            size={24}
            color={isActive ? '#007AFF' : '#8E8E93'}
          />
        </View>
        <Text style={[
          styles.tabLabel,
          isActive && styles.activeTabLabel
        ]}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* iOS-style status bar spacing */}
        {Platform.OS === 'ios' && (
          <View style={{ height: RNStatusBar.currentHeight || 44 }} />
        )}

        {/* Header with Gradient */}
        <LinearGradient
          colors={['#FFFFFF', '#F8F9FA']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>AI Solana Mobile</Text>
                <Text style={styles.subtitle}>Your AI-powered Solana wallet</Text>
              </View>
              <WalletConnectButton />
            </View>
            
            {/* Private Key Input for Development */}
            <PrivateKeyInput />
          </View>
        </LinearGradient>

        {/* Main Content Area */}
        <View style={styles.content}>
          {activeTab === 'chat' ? (
            <AITransactionChat />
          ) : (
            <ManualOperationsScreen />
          )}
        </View>

        {/* iOS-style Bottom Navigation */}
        <View style={styles.bottomNav}>
          {/* Blur effect overlay */}
          <View style={styles.tabBar}>
            <TabButton
              tab="chat"
              icon="chatbubble"
              label="AI Chat"
              isActive={activeTab === 'chat'}
            />
            <TabButton
              tab="manual"
              icon="settings"
              label="Manual"
              isActive={activeTab === 'manual'}
            />
          </View>
          
          {/* Home indicator for iOS-style */}
          {Platform.OS === 'ios' && (
            <View style={styles.homeIndicatorContainer}>
              <View style={styles.homeIndicator} />
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  safeArea: {
    flex: 1,
  },
  headerGradient: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '400',
  },
  content: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  bottomNav: {
    backgroundColor: 'rgba(248, 249, 250, 0.95)',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  tabBar: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 4,
  },
  tabButton: {
    flex: 1,
  },
  tabContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  activeIconContainer: {
    backgroundColor: '#E3F2FD',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeTabLabel: {
    color: '#007AFF',
  },
  homeIndicatorContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  homeIndicator: {
    width: 134,
    height: 5,
    backgroundColor: '#C7C7CC',
    borderRadius: 3,
  },
});
