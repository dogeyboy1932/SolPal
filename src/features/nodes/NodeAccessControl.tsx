import React from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNodes } from '../contexts/NodeContext';
import type { Node } from '../types/nodes';

export const NodeAccessControl: React.FC = () => {
  const { 
    nodes, 
    llmAccessibleNodeIds, 
    setNodeLLMAccessible, 
    toggleAllNodesLLMAccess 
  } = useNodes();

  const getNodeIcon = (nodeType: string) => {
    switch (nodeType) {
      case 'person': return 'person';
      case 'event': return 'calendar';
      case 'community': return 'people';
      default: return 'help-circle';
    }
  };

  const getNodeTypeColor = (nodeType: string) => {
    switch (nodeType) {
      case 'person': return '#4CAF50';
      case 'event': return '#2196F3';
      case 'community': return '#FF9800';
      default: return '#666';
    }
  };

  const renderNodeItem = ({ item }: { item: Node }) => {
    const isAccessible = llmAccessibleNodeIds.has(item.id);
    
    return (
      <View style={styles.nodeItem}>
        <View style={styles.nodeInfo}>
          <Ionicons 
            name={getNodeIcon(item.type) as any} 
            size={20} 
            color={getNodeTypeColor(item.type)} 
            style={styles.nodeIcon}
          />
          <View style={styles.nodeDetails}>
            <Text style={styles.nodeName}>{item.name}</Text>
            <Text style={styles.nodeType}>{item.type}</Text>
            {item.description && (
              <Text style={styles.nodeDescription} numberOfLines={1}>
                {item.description}
              </Text>
            )}
          </View>
        </View>
        <Switch
          value={isAccessible}
          onValueChange={(value) => setNodeLLMAccessible(item.id, value)}
          trackColor={{ false: '#767577', true: '#4CAF50' }}
          thumbColor={isAccessible ? '#fff' : '#f4f3f4'}
        />
      </View>
    );
  };

  const accessibleCount = llmAccessibleNodeIds.size;
  const totalCount = nodes.length;
  const allAccessible = accessibleCount === totalCount && totalCount > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
          <Text style={styles.title}>Node Access Control</Text>
        </View>
        <Text style={styles.subtitle}>
          Control which nodes the AI can access and manage
        </Text>
      </View>

      <View style={styles.stats}>
        <Text style={styles.statsText}>
          {accessibleCount} of {totalCount} nodes accessible to AI
        </Text>
        
        {totalCount > 0 && (
          <TouchableOpacity
            style={[styles.toggleAllButton, allAccessible ? styles.toggleAllButtonActive : null]}
            onPress={() => toggleAllNodesLLMAccess(!allAccessible)}
          >
            <Ionicons 
              name={allAccessible ? "checkmark-circle" : "add-circle"} 
              size={16} 
              color={allAccessible ? "#fff" : "#4CAF50"} 
            />
            <Text style={[styles.toggleAllText, allAccessible ? styles.toggleAllTextActive : null]}>
              {allAccessible ? 'Remove All' : 'Allow All'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {nodes.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="folder-open-outline" size={48} color="#666" />
          <Text style={styles.emptyStateText}>No nodes created yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Create some contacts, events, or communities to manage AI access
          </Text>
        </View>
      ) : (
        <FlatList
          data={nodes}
          renderItem={renderNodeItem}
          keyExtractor={(item) => item.id}
          style={styles.nodeList}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={16} color="#2196F3" />
        <Text style={styles.infoText}>
          Only accessible nodes will be visible to the AI for operations and queries.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    margin: 12,
  },
  header: {
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginLeft: 32,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  statsText: {
    color: 'white',
    fontWeight: '500',
  },
  toggleAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  toggleAllButtonActive: {
    backgroundColor: '#4CAF50',
  },
  toggleAllText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  toggleAllTextActive: {
    color: 'white',
  },
  nodeList: {
    maxHeight: 300,
  },
  nodeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  nodeInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nodeIcon: {
    marginRight: 12,
  },
  nodeDetails: {
    flex: 1,
  },
  nodeName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  nodeType: {
    color: '#666',
    fontSize: 12,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  nodeDescription: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  emptyStateSubtext: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D47A1',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  infoText: {
    color: '#BBDEFB',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
});
