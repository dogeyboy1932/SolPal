import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { WalletConnectButton } from '@/components/WalletConnectButton';
import { WalletBalance } from '@/components/WalletBalance';
import { TransferSOL } from '@/components/TransferSOL';

export const HomeScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>AI Solana Mobile</Text>
          <Text style={styles.subtitle}>Your AI-powered Solana wallet</Text>
        </View>

        <View style={styles.walletSection}>
          <WalletConnectButton />
        </View>

        <WalletBalance />
        
        <TransferSOL />

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Phase 1 MVP - Wallet & Transactions Complete ✅
          </Text>
        </View>
      </ScrollView>
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
  },
});
