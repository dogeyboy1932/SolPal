import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
} from 'react-native';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface AIConnectionStatusProps {
  onToggleConnection?: () => void;
  onViewDetails?: () => void;
}

export const AIConnectionStatus: React.FC<AIConnectionStatusProps> = ({
  onToggleConnection,
  onViewDetails,
}) => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [pulse] = useState(new Animated.Value(1));
  const [lastActivity, setLastActivity] = useState<Date | null>(null);

  // Mock connection status - in real app this would come from context
  useEffect(() => {
    // Simulate status changes for demo
    const interval = setInterval(() => {
      const statuses: ConnectionStatus[] = ['connected', 'connected', 'connected', 'error', 'disconnected'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      setStatus(randomStatus);
      
      if (randomStatus === 'connected') {
        setLastActivity(new Date());
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Pulse animation for connecting state
  useEffect(() => {
    if (status === 'connecting') {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [status, pulse]);

  const getStatusInfo = () => {
    switch (status) {
      case 'connected':
        return {
          color: '#28a745',
          text: 'AI Connected',
          icon: '🟢',
          description: 'AI features active'
        };
      case 'connecting':
        return {
          color: '#ffc107',
          text: 'Connecting...',
          icon: '🟡',
          description: 'Establishing connection'
        };
      case 'error':
        return {
          color: '#dc3545',
          text: 'Connection Error',
          icon: '🔴',
          description: 'AI features unavailable'
        };
      default:
        return {
          color: '#6c757d',
          text: 'AI Disconnected',
          icon: '⚫',
          description: 'Manual mode active'
        };
    }
  };

  const statusInfo = getStatusInfo();

  const formatLastActivity = () => {
    if (!lastActivity) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - lastActivity.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  return (
    <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 shadow-sm">
      <View className="flex-row items-center mb-3">
        <Animated.View 
          className="w-3 h-3 rounded-full mr-3"
          style={[
            { backgroundColor: statusInfo.color },
            status === 'connecting' && { transform: [{ scale: pulse }] }
          ]} 
        />
        
        <View className="flex-1">
          <Text className="text-base font-semibold text-amber-900">{statusInfo.text}</Text>
          <Text className="text-sm text-amber-700">{statusInfo.description}</Text>
        </View>

        <TouchableOpacity
          className="w-6 h-6 rounded-full bg-amber-100 items-center justify-center"
          onPress={onViewDetails}
        >
          <Text className="text-sm text-amber-600">ⓘ</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-amber-100 rounded-lg p-3 mb-4">
        <View className="flex-row justify-between mb-1.5">
          <Text className="text-sm text-amber-700 font-medium">Status:</Text>
          <Text className="text-sm font-medium" style={{ color: statusInfo.color }}>
            {statusInfo.icon} {statusInfo.text}
          </Text>
        </View>

        <View className="flex-row justify-between mb-1.5">
          <Text className="text-sm text-amber-700 font-medium">Last Activity:</Text>
          <Text className="text-sm text-amber-800 font-medium">{formatLastActivity()}</Text>
        </View>

        <View className="flex-row justify-between">
          <Text className="text-sm text-amber-700 font-medium">Mode:</Text>
          <Text className="text-sm text-amber-800 font-medium">
            {status === 'connected' ? 'AI-Powered' : 'Manual Control'}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-3 mb-4">
        <TouchableOpacity
          className={`flex-1 rounded-lg p-3 items-center ${
            status === 'connected' ? 'bg-red-500' : 'bg-orange-500'
          }`}
          onPress={() => {
            setStatus(status === 'connected' ? 'disconnected' : 'connecting');
            setTimeout(() => {
              setStatus(status === 'connected' ? 'disconnected' : 'connected');
            }, 2000);
            onToggleConnection?.();
          }}
        >
          <Text className="text-white text-base font-semibold">
            {status === 'connected' ? 'Disconnect AI' : 'Connect AI'}
          </Text>
        </TouchableOpacity>

        {status === 'error' && (
          <TouchableOpacity
            className="flex-1 bg-yellow-500 rounded-lg p-3 items-center"
            onPress={() => {
              setStatus('connecting');
              setTimeout(() => setStatus('connected'), 2000);
            }}
          >
            <Text className="text-white text-base font-semibold">Retry Connection</Text>
          </TouchableOpacity>
        )}
      </View>

      {status === 'connected' && (
        <View className="bg-green-100 rounded-lg p-3">
          <Text className="text-base font-semibold text-green-800 mb-2">Available AI Features:</Text>
          <View className="gap-1">
            <Text className="text-sm text-green-700 leading-5">✓ Smart transaction suggestions</Text>
            <Text className="text-sm text-green-700 leading-5">✓ Node-based context understanding</Text>
            <Text className="text-sm text-green-700 leading-5">✓ Natural language processing</Text>
            <Text className="text-sm text-green-700 leading-5">✓ Automatic transaction validation</Text>
          </View>
        </View>
      )}

      {status === 'disconnected' && (
        <View className="bg-gray-100 rounded-lg p-3">
          <Text className="text-base font-semibold text-gray-700 mb-2">Manual Mode Active</Text>
          <Text className="text-sm text-gray-600 leading-5">
            All features are available through manual controls. Connect AI for enhanced automation and smart suggestions.
          </Text>
        </View>
      )}
    </View>
  );
};
