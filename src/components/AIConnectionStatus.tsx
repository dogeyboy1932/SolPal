import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
    <View style={styles.container}>
      <View style={styles.statusHeader}>
        <Animated.View style={[
          styles.statusIndicator,
          { backgroundColor: statusInfo.color },
          status === 'connecting' && { transform: [{ scale: pulse }] }
        ]} />
        
        <View style={styles.statusInfo}>
          <Text style={styles.statusText}>{statusInfo.text}</Text>
          <Text style={styles.statusDescription}>{statusInfo.description}</Text>
        </View>

        <TouchableOpacity
          style={styles.detailsButton}
          onPress={onViewDetails}
        >
          <Text style={styles.detailsButtonText}>ⓘ</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status:</Text>
          <Text style={[styles.detailValue, { color: statusInfo.color }]}>
            {statusInfo.icon} {statusInfo.text}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Last Activity:</Text>
          <Text style={styles.detailValue}>{formatLastActivity()}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Mode:</Text>
          <Text style={styles.detailValue}>
            {status === 'connected' ? 'AI-Powered' : 'Manual Control'}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[
            styles.connectionButton,
            status === 'connected' ? styles.disconnectButton : styles.connectButton
          ]}
          onPress={() => {
            setStatus(status === 'connected' ? 'disconnected' : 'connecting');
            setTimeout(() => {
              setStatus(status === 'connected' ? 'disconnected' : 'connected');
            }, 2000);
            onToggleConnection?.();
          }}
        >
          <Text style={styles.connectionButtonText}>
            {status === 'connected' ? 'Disconnect AI' : 'Connect AI'}
          </Text>
        </TouchableOpacity>

        {status === 'error' && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setStatus('connecting');
              setTimeout(() => setStatus('connected'), 2000);
            }}
          >
            <Text style={styles.retryButtonText}>Retry Connection</Text>
          </TouchableOpacity>
        )}
      </View>

      {status === 'connected' && (
        <View style={styles.aiCapabilities}>
          <Text style={styles.capabilitiesTitle}>Available AI Features:</Text>
          <View style={styles.capabilitiesList}>
            <Text style={styles.capabilityItem}>✓ Smart transaction suggestions</Text>
            <Text style={styles.capabilityItem}>✓ Node-based context understanding</Text>
            <Text style={styles.capabilityItem}>✓ Natural language processing</Text>
            <Text style={styles.capabilityItem}>✓ Automatic transaction validation</Text>
          </View>
        </View>
      )}

      {status === 'disconnected' && (
        <View style={styles.manualModeInfo}>
          <Text style={styles.manualModeTitle}>Manual Mode Active</Text>
          <Text style={styles.manualModeDescription}>
            All features are available through manual controls. Connect AI for enhanced automation and smart suggestions.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
  },
  detailsButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsButtonText: {
    fontSize: 14,
    color: '#666',
  },
  statusDetails: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  connectionButton: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  connectButton: {
    backgroundColor: '#007AFF',
  },
  disconnectButton: {
    backgroundColor: '#dc3545',
  },
  connectionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    flex: 1,
    backgroundColor: '#ffc107',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  aiCapabilities: {
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    padding: 12,
  },
  capabilitiesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#28a745',
    marginBottom: 8,
  },
  capabilitiesList: {
    gap: 4,
  },
  capabilityItem: {
    fontSize: 14,
    color: '#155724',
    lineHeight: 20,
  },
  manualModeInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  manualModeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
  },
  manualModeDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
});
