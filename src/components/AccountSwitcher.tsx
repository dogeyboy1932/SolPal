import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useWallet } from '@/contexts/WalletContext';

export const AccountSwitcher: React.FC = () => {
  const { connected, accounts, activeAccountIndex, switchAccount } = useWallet();
  const [modalVisible, setModalVisible] = useState(false);
  const [switching, setSwitching] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const handleAccountSwitch = async (index: number) => {
    if (index === activeAccountIndex) {
      setModalVisible(false);
      return;
    }

    try {
      setSwitching(true);
      await switchAccount(index);
      setModalVisible(false);
    } catch (error) {
      console.error('Failed to switch account:', error);
    } finally {
      setSwitching(false);
    }
  };

  if (!connected || accounts.length <= 1) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        style={styles.switcherButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.switcherText}>
          Account {activeAccountIndex + 1} of {accounts.length}
        </Text>
        <Text style={styles.arrowText}>⌄</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Account</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.accountList}>
              {accounts.map((account, index) => (
                <TouchableOpacity
                  key={account}
                  style={[
                    styles.accountItem,
                    index === activeAccountIndex && styles.activeAccountItem,
                  ]}
                  onPress={() => handleAccountSwitch(index)}
                  disabled={switching}
                >
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountLabel}>
                      Account {index + 1}
                    </Text>
                    <Text style={styles.accountAddress}>
                      {formatAddress(account)}
                    </Text>
                  </View>
                  
                  <View style={styles.accountStatus}>
                    {index === activeAccountIndex && (
                      <Text style={styles.activeText}>Active</Text>
                    )}
                    {switching && index !== activeAccountIndex && (
                      <ActivityIndicator size="small" color="#3b82f6" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  switcherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  switcherText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  arrowText: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 18,
    color: '#6b7280',
  },
  accountList: {
    padding: 20,
  },
  accountItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 12,
  },
  activeAccountItem: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  accountInfo: {
    flex: 1,
  },
  accountLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  accountAddress: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#6b7280',
  },
  accountStatus: {
    alignItems: 'flex-end',
  },
  activeText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
});
