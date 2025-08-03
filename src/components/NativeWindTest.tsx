import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

export const NativeWindTest: React.FC = () => {
  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      {/* Basic Layout Test */}
      <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <Text className="text-lg font-bold text-gray-900 mb-2">
          Layout Test
        </Text>
        <View className="flex-row justify-between items-center">
          <View className="flex-1 bg-blue-100 p-2 mr-2 rounded">
            <Text className="text-sm text-blue-800">Flex 1</Text>
          </View>
          <View className="flex-1 bg-green-100 p-2 ml-2 rounded">
            <Text className="text-sm text-green-800">Flex 1</Text>
          </View>
        </View>
      </View>

      {/* Color & Background Test */}
      <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <Text className="text-lg font-bold text-gray-900 mb-2">
          Colors & Backgrounds
        </Text>
        <View className="flex-row flex-wrap">
          <View className="bg-red-500 w-16 h-16 m-1 rounded-lg" />
          <View className="bg-blue-500 w-16 h-16 m-1 rounded-lg" />
          <View className="bg-green-500 w-16 h-16 m-1 rounded-lg" />
          <View className="bg-yellow-500 w-16 h-16 m-1 rounded-lg" />
        </View>
      </View>

      {/* Typography Test */}
      <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <Text className="text-lg font-bold text-gray-900 mb-2">
          Typography
        </Text>
        <Text className="text-xs text-gray-500 mb-1">Extra Small Text</Text>
        <Text className="text-sm text-gray-600 mb-1">Small Text</Text>
        <Text className="text-base text-gray-700 mb-1">Base Text</Text>
        <Text className="text-lg text-gray-800 mb-1">Large Text</Text>
        <Text className="text-xl font-semibold text-gray-900 mb-1">XL Semibold</Text>
        <Text className="text-2xl font-bold text-blue-600">2XL Bold Blue</Text>
      </View>

      {/* Spacing & Padding Test */}
      <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <Text className="text-lg font-bold text-gray-900 mb-2">
          Spacing & Padding
        </Text>
        <View className="bg-gray-100 p-1 mb-2">
          <Text className="text-sm">p-1</Text>
        </View>
        <View className="bg-gray-200 p-2 mb-2">
          <Text className="text-sm">p-2</Text>
        </View>
        <View className="bg-gray-300 p-4 mb-2">
          <Text className="text-sm">p-4</Text>
        </View>
      </View>

      {/* Button & Interactive Test */}
      <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <Text className="text-lg font-bold text-gray-900 mb-4">
          Buttons & Interaction
        </Text>
        
        <TouchableOpacity className="bg-blue-500 px-4 py-2 rounded-md mb-2">
          <Text className="text-white text-center font-medium">Primary Button</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="bg-gray-200 px-4 py-2 rounded-md mb-2">
          <Text className="text-gray-800 text-center font-medium">Secondary Button</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="border border-blue-500 px-4 py-2 rounded-md">
          <Text className="text-blue-500 text-center font-medium">Outline Button</Text>
        </TouchableOpacity>
      </View>

      {/* Flex & Alignment Test */}
      <View className="bg-white p-4 rounded-lg shadow-sm mb-4">
        <Text className="text-lg font-bold text-gray-900 mb-4">
          Flex & Alignment
        </Text>
        
        <View className="flex-row justify-center items-center bg-blue-50 p-4 mb-2">
          <Text className="text-blue-800">Centered Content</Text>
        </View>
        
        <View className="flex-row justify-between items-center bg-green-50 p-4 mb-2">
          <Text className="text-green-800">Left</Text>
          <Text className="text-green-800">Right</Text>
        </View>
        
        <View className="flex-row justify-around items-center bg-yellow-50 p-4">
          <Text className="text-yellow-800">A</Text>
          <Text className="text-yellow-800">B</Text>
          <Text className="text-yellow-800">C</Text>
        </View>
      </View>

      {/* Status Indicator */}
      <View className="bg-green-100 border border-green-400 p-4 rounded-lg">
        <Text className="text-green-800 font-semibold text-center">
          ✅ If you can see all these styles properly, NativeWind is working correctly!
        </Text>
      </View>
    </ScrollView>
  );
};
