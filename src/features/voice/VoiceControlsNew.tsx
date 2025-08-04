import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Animated,
  StyleSheet,
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
    <View style={styles.container}>
      {/* Voice Status */}
      {voiceEnabled && (
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, isListening ? styles.listeningText : styles.readyText]}>
            {isListening ? 'Listening...' : 'Voice Ready'}
          </Text>
        </View>
      )}

      {/* Microphone Button */}
      <Animated.View style={[styles.micButton, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          onPress={handleMicPress}
          style={styles.micTouchable}
          disabled={!voiceEnabled}
        >
          <LinearGradient
            colors={isListening ? ['#FF3B30', '#FF6B6B'] : ['#007AFF', '#0056CC']}
            style={styles.micGradient}
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
        style={styles.toggleButton}
      >
        <Text style={styles.toggleText}>
          {voiceEnabled ? 'Disable Voice' : 'Enable Voice'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusContainer: {
    marginRight: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listeningText: {
    color: '#FF3B30',
  },
  readyText: {
    color: '#007AFF',
  },
  micButton: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  micTouchable: {
    borderRadius: 20,
  },
  micGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButton: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 12,
  },
  toggleText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
});
