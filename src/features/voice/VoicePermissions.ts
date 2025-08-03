import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { request, check, PERMISSIONS, RESULTS } from 'react-native-permissions';

export type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable';

/**
 * VoicePermissions utility for managing microphone permissions
 * Handles both iOS and Android permission requests
 */
export class VoicePermissions {
  
  /**
   * Check current microphone permission status
   */
  static async checkMicrophonePermission(): Promise<PermissionStatus> {
    try {
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        return result ? 'granted' : 'denied';
      } else if (Platform.OS === 'ios') {
        const result = await check(PERMISSIONS.IOS.MICROPHONE);
        return this.mapPermissionResult(result);
      } else {
        // Web or other platforms - assume granted for development
        return 'granted';
      }
    } catch (error) {
      console.error('❌ Error checking microphone permission:', error);
      return 'unavailable';
    }
  }
  
  /**
   * Request microphone permission from user
   */
  static async requestMicrophonePermission(): Promise<PermissionStatus> {
    try {
      if (Platform.OS === 'android') {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone for voice commands',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        switch (result) {
          case PermissionsAndroid.RESULTS.GRANTED:
            return 'granted';
          case PermissionsAndroid.RESULTS.DENIED:
            return 'denied';
          case PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN:
            return 'blocked';
          default:
            return 'denied';
        }
      } else if (Platform.OS === 'ios') {
        const result = await request(PERMISSIONS.IOS.MICROPHONE);
        return this.mapPermissionResult(result);
      } else {
        // Web or other platforms - assume granted for development
        return 'granted';
      }
    } catch (error) {
      console.error('❌ Error requesting microphone permission:', error);
      return 'unavailable';
    }
  }
  
  /**
   * Ensure microphone permission is granted before proceeding
   * Shows user-friendly dialogs and handles all permission states
   */
  static async ensureMicrophonePermission(): Promise<boolean> {
    const currentStatus = await this.checkMicrophonePermission();
    
    if (currentStatus === 'granted') {
      return true;
    }
    
    if (currentStatus === 'blocked') {
      Alert.alert(
        'Microphone Permission Required',
        'Please enable microphone access in your device settings to use voice commands.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: this.openAppSettings }
        ]
      );
      return false;
    }
    
    if (currentStatus === 'unavailable') {
      Alert.alert(
        'Microphone Unavailable',
        'Microphone is not available on this device.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    // Request permission
    const requestResult = await this.requestMicrophonePermission();
    
    if (requestResult === 'granted') {
      return true;
    }
    
    if (requestResult === 'denied') {
      Alert.alert(
        'Microphone Permission Denied',
        'Voice commands require microphone access. You can enable it later in settings.',
        [{ text: 'OK' }]
      );
      return false;
    }
    
    if (requestResult === 'blocked') {
      Alert.alert(
        'Microphone Permission Blocked',
        'Please enable microphone access in your device settings to use voice commands.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: this.openAppSettings }
        ]
      );
      return false;
    }
    
    return false;
  }
  
  /**
   * Open device settings (implementation varies by platform)
   */
  private static openAppSettings(): void {
    // This would open device settings - implementation depends on platform
    // For now, just log the action
    console.log('📱 Opening app settings...');
    
    // On a real implementation, you might use:
    // import { openSettings } from 'react-native-permissions';
    // openSettings();
  }
  
  /**
   * Map react-native-permissions results to our PermissionStatus type
   */
  private static mapPermissionResult(result: string): PermissionStatus {
    switch (result) {
      case RESULTS.GRANTED:
        return 'granted';
      case RESULTS.DENIED:
        return 'denied';
      case RESULTS.BLOCKED:
        return 'blocked';
      case RESULTS.UNAVAILABLE:
        return 'unavailable';
      default:
        return 'denied';
    }
  }
}

export default VoicePermissions;
