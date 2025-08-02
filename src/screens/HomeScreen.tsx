import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { WalletConnectButton } from '@/components/WalletConnectButton';
import { WalletBalance } from '@/components/WalletBalance';
import { AccountSwitcher } from '@/components/AccountSwitcher';
import { TransferSOL } from '@/components/TransferSOL';
import { TransferSPLToken } from '@/components/TransferSPLToken';
import { TransactionHistory } from '@/components/TransactionHistory';
import { TransactionTemplates } from '@/components/TransactionTemplates';
import { WalletTester } from '@/components/WalletTester';
import { ChatScreen } from './ChatScreen';

export const HomeScreen: React.FC = () => {
  const [showChat, setShowChat] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Solana Mobile</Text>
          <Text style={styles.subtitle}>Your AI-powered Solana wallet</Text>
          
          {/* AI Chat Button */}
          <TouchableOpacity 
            style={styles.chatButton} 
            onPress={() => setShowChat(true)}
          >
            <Text style={styles.chatButtonText}>🤖 AI Chat</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.walletSection}>
          <WalletConnectButton />
          <AccountSwitcher />
        </View>

        <WalletBalance />
        
        <TransferSOL />

        <TransferSPLToken />

        <TransactionTemplates />

        <TransactionHistory />

        <WalletTester />

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Phase 1 MVP - Wallet & Transactions Complete ✅
          </Text>
          <Text style={styles.footerText}>
            Phase 2 AI Integration - In Progress 🚧
          </Text>
        </View>
      </ScrollView>

      {/* AI Chat Modal */}
      <Modal
        visible={showChat}
        animationType="slide"
        presentationStyle="formSheet"
      >
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setShowChat(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          <ChatScreen />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  chatButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  walletSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  footer: {
    alignItems: 'center',
    padding: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});
