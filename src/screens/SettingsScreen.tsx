import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Surface } from 'react-native-paper';
import { BackupManualControls } from '../features/system/BackupManualControls';
import { E2ETestRunner } from '../features/system/E2ETestRunner';

interface SettingsScreenProps {
  onBack: () => void;
}

type SettingsTab = 'controls' | 'testing';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('controls');
  return (
    <View className="flex-1 bg-surface-primary">
      <SafeAreaView className="flex-1">
        {/* iOS-style status bar spacing */}
        {Platform.OS === 'ios' && (
          <View style={{ height: RNStatusBar.currentHeight || 44 }} />
        )}

        {/* Settings Header */}
        <LinearGradient
          colors={['#2D2D2D', '#404040', '#B85C38']}
          className="border-b border-accent-amber/20"
        >
          <Surface className="bg-transparent mt-2" elevation={0}>
            <View className="px-5 py-3 pb-4">
              <View className="flex-row items-center mb-4">
                {/* Back Button */}
                <TouchableOpacity
                  className="mr-4 p-2 -ml-2"
                  onPress={onBack}
                  activeOpacity={0.7}
                >
                  <Ionicons name="arrow-back" size={24} color="#E49B3F" />
                </TouchableOpacity>
                
                {/* Title */}
                <View className="flex-1">
                  <Text className="text-2xl font-bold text-neutral-light font-ios">
                    Settings & Tools
                  </Text>
                  <Text className="text-sm text-accent-gold font-ios">
                    System controls & testing suite
                  </Text>
                </View>
                
                {/* Settings Icon */}
                <View className="w-10 h-10 rounded-full bg-accent-amber/20 items-center justify-center">
                  <Ionicons name="settings" size={20} color="#E49B3F" />
                </View>
              </View>

              {/* Tab Navigation */}
              <View className="flex-row bg-black/20 rounded-xl p-1">
                <TouchableOpacity
                  className={`flex-1 py-2.5 px-4 rounded-lg flex-row items-center justify-center gap-2 ${
                    activeTab === 'controls' ? 'bg-accent-amber/30' : ''
                  }`}
                  onPress={() => setActiveTab('controls')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="shield-checkmark" 
                    size={18} 
                    color={activeTab === 'controls' ? '#E49B3F' : '#8B7355'} 
                  />
                  <Text className={`font-medium ${
                    activeTab === 'controls' ? 'text-accent-gold' : 'text-neutral-medium'
                  }`}>
                    Controls
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className={`flex-1 py-2.5 px-4 rounded-lg flex-row items-center justify-center gap-2 ${
                    activeTab === 'testing' ? 'bg-accent-amber/30' : ''
                  }`}
                  onPress={() => setActiveTab('testing')}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="flask" 
                    size={18} 
                    color={activeTab === 'testing' ? '#E49B3F' : '#8B7355'} 
                  />
                  <Text className={`font-medium ${
                    activeTab === 'testing' ? 'text-accent-gold' : 'text-neutral-medium'
                  }`}>
                    Testing
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Surface>
        </LinearGradient>

        {/* Settings Content */}
        <View className="flex-1 bg-surface-primary">
          <BackupManualControls />
        </View>
      </SafeAreaView>
    </View>
  );
};
