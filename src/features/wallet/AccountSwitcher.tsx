import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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
        className="flex-row items-center bg-amber-100 px-3 py-2 rounded mt-2"
        onPress={() => setModalVisible(true)}
      >
        <Text className="text-sm text-amber-800 flex-1">
          Account {activeAccountIndex + 1} of {accounts.length}
        </Text>
        <Text className="text-sm text-amber-600">⌄</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-amber-50 rounded-t-3xl max-h-4/5">
            <View className="flex-row justify-between items-center p-5 border-b border-amber-200">
              <Text className="text-lg font-semibold text-amber-900">Select Account</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="p-1"
              >
                <Text className="text-lg text-amber-600">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="p-5">
              {accounts.map((account, index) => (
                <TouchableOpacity
                  key={account}
                  className={`flex-row justify-between items-center p-4 border rounded-lg mb-3 ${
                    index === activeAccountIndex 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-amber-200'
                  }`}
                  onPress={() => handleAccountSwitch(index)}
                  disabled={switching}
                >
                  <View className="flex-1">
                    <Text className="text-base font-medium text-amber-900 mb-1">
                      Account {index + 1}
                    </Text>
                    <Text className="text-sm font-mono text-amber-700">
                      {formatAddress(account)}
                    </Text>
                  </View>
                  
                  <View className="items-end">
                    {index === activeAccountIndex && (
                      <Text className="text-sm text-orange-600 font-medium">Active</Text>
                    )}
                    {switching && index !== activeAccountIndex && (
                      <ActivityIndicator size="small" color="#E49B3F" />
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
