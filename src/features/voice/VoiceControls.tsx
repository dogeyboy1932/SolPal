import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VoiceControlsProps {
  isListening: boolean;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
  className?: string;
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
  className = '',
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
  
  const handleVoiceToggle = () => {
    if (!voiceEnabled) {
      onToggleVoice();
    } else if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  };
  
  const getButtonColor = () => {
    if (!voiceEnabled) return '#E5E5EA';
    if (isListening) return '#FF3B30'; // Red while recording
    return '#007AFF'; // Blue when ready
  };
  
  const getIconName = () => {
    if (!voiceEnabled) return 'mic-off' as const;
    if (isListening) return 'stop' as const;
    return 'mic' as const;
  };
  
  const getStatusText = () => {
    if (!voiceEnabled) return 'Voice Disabled';
    if (isListening) return 'Listening...';
    return 'Voice Ready';
  };
  
  return (
    <View className={`flex-row items-center ${className}`}>
      {/* Voice Status Indicator */}
      {voiceEnabled && (
        <View className="mr-3">
          <Text className={`text-xs ${isListening ? 'text-red-500' : 'text-blue-500'}`}>
            {getStatusText()}
          </Text>
        </View>
      )}
      
      {/* Voice Button */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          onPress={handleVoiceToggle}
          className="rounded-full p-3 shadow-lg"
          style={{ backgroundColor: getButtonColor() }}
          activeOpacity={0.7}
        >
          <Ionicons
            name={getIconName()}
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </Animated.View>
      
      {/* Voice Mode Toggle (if voice is disabled) */}
      {!voiceEnabled && (
        <TouchableOpacity
          onPress={onToggleVoice}
          className="ml-3 px-3 py-1 bg-blue-100 rounded-full"
        >
          <Text className="text-blue-600 text-xs font-medium">
            Enable Voice
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

/**
 * Floating Voice Button for always-visible voice access
 */
interface FloatingVoiceButtonProps {
  isListening: boolean;
  voiceEnabled: boolean;
  onPress: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FloatingVoiceButton: React.FC<FloatingVoiceButtonProps> = ({
  isListening,
  voiceEnabled,
  onPress,
  position = 'bottom-right',
}) => {
  const [pulseAnim] = useState(new Animated.Value(1));
  
  useEffect(() => {
    if (isListening) {
      const pulse = Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]);
      Animated.loop(pulse).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening, pulseAnim]);
  
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'absolute bottom-6 right-6';
      case 'bottom-left':
        return 'absolute bottom-6 left-6';
      case 'top-right':
        return 'absolute top-6 right-6';
      case 'top-left':
        return 'absolute top-6 left-6';
      default:
        return 'absolute bottom-6 right-6';
    }
  };
  
  if (!voiceEnabled) return null;
  
  return (
    <Animated.View
      style={{ transform: [{ scale: pulseAnim }] }}
      className={getPositionClasses()}
    >
      <TouchableOpacity
        onPress={onPress}
        className={`
          w-16 h-16 rounded-full shadow-lg items-center justify-center
          ${isListening ? 'bg-red-500' : 'bg-blue-500'}
        `}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isListening ? 'stop' : 'mic'}
          size={28}
          color="white"
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

export default VoiceControls;
