import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface VoiceControlsProps {
  isListening: boolean;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
}

/**
 * VoiceControls component for voice activation UI
 * Provides visual feedback for voice recording state
 */
export const VoiceControls: React.FC<VoiceControlsProps> = ({
  isListening,
  voiceEnabled,
  onToggleVoice,
  onStartListening,
  onStopListening,
}) => {
  const [pulseAnim] = useState(new Animated.Value(1));
  
  // Animate the microphone button while listening
  useEffect(() => {
    if (isListening) {
      const pulse = Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]);
      Animated.loop(pulse).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening, pulseAnim]);

  const handleMicPress = () => {
    if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  };

  return (
    <View className="flex-row items-center gap-2">
      {/* Voice Status */}
      {voiceEnabled && (
        <View className="mr-3">
          <Text className={`text-xs font-medium ${isListening ? 'text-red-500' : 'text-orange-500'}`}>
            {isListening ? 'Listening...' : 'Voice Ready'}
          </Text>
        </View>
      )}

      {/* Microphone Button */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          onPress={handleMicPress}
          className="rounded-full"
          disabled={!voiceEnabled}
        >
          <LinearGradient
            colors={isListening ? ['#FF3B30', '#FF6B6B'] : ['#E49B3F', '#CD853F']}
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Ionicons 
              name={isListening ? 'stop' : 'mic'} 
              size={24} 
              color="white" 
            />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Voice Toggle */}
      <TouchableOpacity
        onPress={onToggleVoice}
        className="bg-amber-100 px-3 py-1.5 rounded-2xl ml-3"
      >
        <Text className="text-xs text-orange-500 font-medium">
          {voiceEnabled ? 'Disable Voice' : 'Enable Voice'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
