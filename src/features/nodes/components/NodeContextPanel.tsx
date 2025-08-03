import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Node } from '../../types/nodes';
import { NodeSummaryCard } from './NodeSummaryCard';

interface NodeContextPanelProps {
  activeNodes: Node[];
  selectedNode?: Node;
  onNodeSelect?: (node: Node) => void;
  onNodeRemove?: (nodeId: string) => void;
  onClearAll?: () => void;
  showDetails?: boolean;
}

export const NodeContextPanel: React.FC<NodeContextPanelProps> = ({
  activeNodes,
  selectedNode,
  onNodeSelect,
  onNodeRemove,
  onClearAll,
  showDetails = true
}) => {
  if (activeNodes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>No Active Nodes</Text>
        <Text style={styles.emptySubtitle}>
          Select nodes to provide context for AI conversations
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Active Context ({activeNodes.length})
        </Text>
        {activeNodes.length > 0 && onClearAll && (
          <TouchableOpacity onPress={onClearAll} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Nodes List */}
      <ScrollView 
        style={styles.nodesList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.nodesListContent}
      >
        {activeNodes.map((node) => (
          <View key={node.id} style={styles.nodeItemContainer}>
            <NodeSummaryCard
              node={node}
              onPress={() => onNodeSelect?.(node)}
              isSelected={selectedNode?.id === node.id}
              isActive={true}
              compact={!showDetails}
            />
            
            {onNodeRemove && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => onNodeRemove(node.id)}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Context Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          🤖 AI has access to {activeNodes.length} {activeNodes.length === 1 ? 'node' : 'nodes'}
        </Text>
        <View style={styles.nodeTypesSummary}>
          {Array.from(new Set(activeNodes.map(node => node.type))).map(type => (
            <View key={type} style={[styles.typeBadge, getTypeBadgeStyle(type)]}>
              <Text style={styles.typeBadgeText}>
                {getTypeIcon(type)} {type}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'person': return '👤';
    case 'event': return '📅';
    case 'community': return '🏛️';
    default: return '📋';
  }
};

const getTypeBadgeStyle = (type: string) => {
  switch (type) {
    case 'person': return { backgroundColor: '#007AFF20' };
    case 'event': return { backgroundColor: '#28a74520' };
    case 'community': return { backgroundColor: '#9c27b020' };
    default: return { backgroundColor: '#f0f0f0' };
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ff4444',
    borderRadius: 16,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  nodesList: {
    flex: 1,
  },
  nodesListContent: {
    paddingVertical: 8,
  },
  nodeItemContainer: {
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 16,
  },
  summary: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  nodeTypesSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
});
