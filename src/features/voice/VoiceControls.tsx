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
    <View style={styles.container}>
      {/* Microphone Button */}
      <Animated.View style={[styles.micButton, { transform: [{ scale: pulseAnim }] }]}>
        {/* <TouchableOpacity
          onPress={handleMicPress}
          style={styles.micTouchable}
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
        </TouchableOpacity> */}
        <TouchableOpacity
          onPress={handleMicPress}
          style={styles.micTouchable}
          // disabled={!voiceEnabled}
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
    </View>
  );
};


// turn (
//     <View style={styles.container}>
//       {/* Voice Status */}
//       {voiceEnabled && (
//         <View style={styles.statusContainer}>
//           <Text style={[styles.statusText, isListening ? styles.listeningText : styles.readyText]}>
//             {isListening ? 'Listening...' : 'Voice Ready'}
//           </Text>
//         </View>
//       )}

//       {/* Microphone Button */}
//       <Animated.View style={[styles.micButton, { transform: [{ scale: pulseAnim }] }]}>
        // <TouchableOpacity
        //   onPress={handleMicPress}
        //   style={styles.micTouchable}
        //   disabled={!voiceEnabled}
        // >
        //   <LinearGradient
        //     colors={isListening ? ['#FF3B30', '#FF6B6B'] : ['#007AFF', '#0056CC']}
        //     style={styles.micGradient}
        //   >
        //     <Ionicons 
        //       name={isListening ? 'stop' : 'mic'} 
        //       size={24} 
        //       color="white" 
        //     />
        //   </LinearGradient>
        // </TouchableOpacity>


//         {/* Voice Toggle */}
//         <TouchableOpacity
//           onPress={onToggleVoice}
//           style={styles.toggleButton}
//         >
//           <Text style={styles.toggleText}>
//             {voiceEnabled ? 'Disable Voice' : 'Enable Voice'}
//           </Text>
//         </TouchableOpacity>

        
//       </Animated.View>

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
    marginLeft: 8,
  },
  micButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  micTouchable: {
    width: 25,
    height: 25,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  micGradient: {
    width: 40,
    height: 40,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
