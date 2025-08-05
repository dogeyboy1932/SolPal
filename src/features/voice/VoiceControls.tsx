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
  onStartListening: () => void;
  onStopListening: () => void;
}

/**
 * Simplified VoiceControls component - just a mic button to start/stop listening
 */
export const VoiceControls: React.FC<VoiceControlsProps> = ({
  isListening,
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
    <View className="items-center py-2 ml-2">
      {/* Microphone Button */}
      <Animated.View className="items-center justify-center" style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          onPress={handleMicPress}
          className="w-6 h-6 rounded-full justify-center items-center shadow-md"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          <LinearGradient
            colors={isListening ? ['#FF3B30', '#FF6B6B'] : ['#007AFF', '#0056CC']}
            className="w-10 h-10 rounded-full justify-center items-center"
          >
            <Ionicons 
              name={isListening ? 'stop' : 'mic'} 
              size={24} 
              color="white" 
            />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};
