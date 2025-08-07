import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProfileScreenProps {
  onBack: () => void;
}

const PROFILE_STORAGE_KEY = 'user_profile_data';

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const storedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      if (storedProfile) {
        const { name, bio } = JSON.parse(storedProfile);
        setName(name);
        setBio(bio);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleSave = async () => {
    try {
      const profileData = JSON.stringify({ name, bio });
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, profileData);
      Alert.alert('Success', 'Profile saved successfully.');
    } catch (error) {
      console.error('Failed to save profile:', error);
      Alert.alert('Error', 'Failed to save profile.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-row items-center justify-between p-5 border-b border-gray-200">
        <TouchableOpacity onPress={onBack} className="p-1">
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-800">Profile</Text>
        <View className="w-6" />
      </View>
      <ScrollView className="p-5">
        <View className="mb-5">
          <Text className="text-lg font-semibold text-gray-700 mb-2">Name</Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-lg p-3 text-lg text-gray-800"
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
          />
        </View>
        <View className="mb-5">
          <Text className="text-lg font-semibold text-gray-700 mb-2">Bio</Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-lg p-3 text-lg text-gray-800 h-24"
            placeholder="Tell us about yourself"
            multiline
            value={bio}
            onChangeText={setBio}
          />
        </View>
        <TouchableOpacity
          onPress={handleSave}
          className="bg-blue-500 rounded-lg p-4 items-center"
        >
          <Text className="text-white font-bold text-lg">Save</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};
