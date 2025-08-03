import React from 'react';
import { View, Text } from 'react-native';

export const TestNativeWind = () => {
  return (
    <View className="flex-1 bg-red-500 justify-center items-center">
      <Text className="text-white text-2xl font-bold">
        NativeWind Test
      </Text>
      <View className="bg-blue-500 p-4 mt-4 rounded-lg">
        <Text className="text-white">
          If you see colors and styling, NativeWind is working!
        </Text>
      </View>
    </View>
  );
};
