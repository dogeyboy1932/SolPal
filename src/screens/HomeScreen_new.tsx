import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AITransactionChat from '@/components/AITransactionChat';
import { ManualOperationsScreen } from './ManualOperationsScreen';

export const HomeScreen: React.FC = () => {
  const [showManualMode, setShowManualMode] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      {!showManualMode ? (
        <View style={styles.container}>
          {/* Header with Manual Mode Toggle */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>AI Solana Mobile</Text>
              <Text style={styles.subtitle}>Your AI-powered Solana wallet</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.manualModeButton} 
              onPress={() => setShowManualMode(true)}
            >
              <Ionicons name="settings-outline" size={20} color="#007AFF" />
              <Text style={styles.manualModeText}>Manual Mode</Text>
            </TouchableOpacity>
          </View>

          {/* AI Chat Interface - Primary UI */}
          <View style={styles.chatContainer}>
            <AITransactionChat />
          </View>
        </View>
      ) : (
        <View style={styles.container}>
          {/* Manual Operations Header */}
          <View style={styles.manualHeader}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => setShowManualMode(false)}
            >
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
              <Text style={styles.backText}>Back to AI Chat</Text>
            </TouchableOpacity>
            
            <Text style={styles.manualTitle}>Manual Operations</Text>
            <Text style={styles.manualSubtitle}>Full control interface</Text>
          </View>

          {/* Manual Operations Interface */}
          <View style={styles.manualContainer}>
            <ManualOperationsScreen />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  manualModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  manualModeText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  chatContainer: {
    flex: 1,
  },
  manualHeader: {
    backgroundColor: '#F2F2F7',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  manualTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  manualSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  manualContainer: {
    flex: 1,
  },
});
