import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Node, PersonNode, EventNode, CommunityNode } from '../../types/nodes';

interface NodeSummaryCardProps {
  node: Node;
  onPress?: () => void;
  isSelected?: boolean;
  isActive?: boolean;
  compact?: boolean;
}

const NodeTypeColors = {
  person: '#007AFF',
  event: '#28a745',
  community: '#9c27b0'
};

const NodeTypeIcons = {
  person: '👤',
  event: '📅',
  community: '🏛️'
};

export const NodeSummaryCard: React.FC<NodeSummaryCardProps> = ({
  node,
  onPress,
  isSelected = false,
  isActive = false,
  compact = false
}) => {
  const renderPersonDetails = (person: PersonNode) => (
    <View style={styles.detailsContainer}>
      {person.walletAddress && (
        <Text style={styles.detailText}>
          🔗 {person.walletAddress.slice(0, 8)}...{person.walletAddress.slice(-4)}
        </Text>
      )}
      {person.relationship && (
        <Text style={styles.detailText}>👥 {person.relationship}</Text>
      )}
      {(person.totalTransactions ?? 0) > 0 && (
        <Text style={styles.detailText}>💰 {person.totalTransactions} transactions</Text>
      )}
    </View>
  );

  const renderEventDetails = (event: EventNode) => (
    <View style={styles.detailsContainer}>
      <Text style={styles.detailText}>
        📅 {event.date.toLocaleDateString()}
      </Text>
      {event.location && (
        <Text style={styles.detailText}>📍 {event.location}</Text>
      )}
      {event.maxAttendees && (
        <Text style={styles.detailText}>
          👥 {event.currentAttendees}/{event.maxAttendees} attendees
        </Text>
      )}
      {event.ticketPrice && (
        <Text style={styles.detailText}>🎫 {event.ticketPrice} SOL</Text>
      )}
    </View>
  );

  const renderCommunityDetails = (community: CommunityNode) => (
    <View style={styles.detailsContainer}>
      <Text style={styles.detailText}>👥 {community.memberCount ?? 0} members</Text>
      {community.communityType && (
        <Text style={styles.detailText}>🏷️ {community.communityType}</Text>
      )}
      {community.isPublic !== undefined && (
        <Text style={styles.detailText}>
          {community.isPublic ? '🌐 Public' : '🔒 Private'}
        </Text>
      )}
    </View>
  );

  const renderDetails = () => {
    if (compact) return null;
    
    switch (node.type) {
      case 'person':
        return renderPersonDetails(node as PersonNode);
      case 'event':
        return renderEventDetails(node as EventNode);
      case 'community':
        return renderCommunityDetails(node as CommunityNode);
      default:
        return null;
    }
  };

  const backgroundColor = NodeTypeColors[node.type];

  return (
    <TouchableOpacity
      style={[
        styles.card,
        compact && styles.compactCard,
        isSelected && styles.selectedCard,
        isActive && styles.activeCard,
        { borderLeftColor: backgroundColor }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{NodeTypeIcons[node.type]}</Text>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {node.name}
          </Text>
          <Text style={[styles.type, { color: backgroundColor }]}>
            {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
          </Text>
        </View>
        {isActive && (
          <View style={[styles.statusBadge, { backgroundColor }]}>
            <Text style={styles.statusText}>Active</Text>
          </View>
        )}
      </View>

      {/* Description */}
      {node.description && !compact && (
        <Text style={styles.description} numberOfLines={2}>
          {node.description}
        </Text>
      )}

      {/* Details */}
      {renderDetails()}

      {/* Tags */}
      {node.tags && node.tags.length > 0 && !compact && (
        <View style={styles.tagsContainer}>
          {node.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={[styles.tag, { backgroundColor: backgroundColor + '20' }]}>
              <Text style={[styles.tagText, { color: backgroundColor }]}>
                {tag}
              </Text>
            </View>
          ))}
          {node.tags.length > 3 && (
            <Text style={styles.moreTagsText}>+{node.tags.length - 3}</Text>
          )}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.timestamp}>
          Updated {node.updatedAt.toLocaleDateString()}
        </Text>
        {isSelected && (
          <Text style={styles.selectedIndicator}>✓ Selected</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactCard: {
    padding: 12,
    marginVertical: 4,
  },
  selectedCard: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#f0f8ff',
  },
  activeCard: {
    backgroundColor: '#f8fff8',
    borderLeftWidth: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  type: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  detailsContainer: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 12,
    color: '#777',
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '500',
  },
  moreTagsText: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
  },
  selectedIndicator: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
});
