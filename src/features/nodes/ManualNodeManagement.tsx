import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNodes } from '../contexts/NodeContext';
import { PersonNodeForm } from './nodes/PersonNodeForm';
import { EventNodeForm } from './nodes/EventNodeForm';
import { CommunityNodeForm } from './nodes/CommunityNodeForm';
import type { Node, NodeType, PersonNode, EventNode, CommunityNode } from '../types/nodes';

type TabType = 'all' | 'contacts' | 'events' | 'communities';
type ViewMode = 'list' | 'create' | 'edit';

interface NodeItemProps {
  node: Node;
  onEdit: (node: Node) => void;
  onDelete: (node: Node) => void;
  onView: (node: Node) => void;
}

const NodeItem: React.FC<NodeItemProps> = ({ node, onEdit, onDelete, onView }) => {
  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case 'person': return 'person';
      case 'event': return 'calendar';
      case 'community': return 'people';
      default: return 'ellipse';
    }
  };

  const getNodeDetails = (node: Node) => {
    switch (node.type) {
      case 'person':
        const person = node as PersonNode;
        return {
          subtitle: person.walletAddress ? `💰 ${person.walletAddress.slice(0, 12)}...` : person.email || 'No contact info',
          badge: person.relationship || 'contact',
          statusColor: person.walletAddress ? '#10B981' : '#6B7280'
        };
      case 'event':
        const event = node as EventNode;
        return {
          subtitle: `📅 ${event.date.toLocaleDateString()} ${event.location ? `• 📍 ${event.location}` : ''}`,
          badge: event.eventType,
          statusColor: new Date(event.date) > new Date() ? '#3B82F6' : '#6B7280'
        };
      case 'community':
        const community = node as CommunityNode;
        return {
          subtitle: `👥 ${community.memberCount || 0} members • ${community.isPublic ? '🔓 Public' : '🔒 Private'}`,
          badge: community.communityType,
          statusColor: community.isPublic ? '#10B981' : '#F59E0B'
        };
      default:
        return {
          subtitle: 'Unknown node type',
          badge: 'unknown',
          statusColor: '#6B7280'
        };
    }
  };

  const details = getNodeDetails(node);

  return (
    <View style={styles.nodeItem}>
      <View style={styles.nodeHeader}>
        <View style={styles.nodeInfo}>
          <View style={styles.nodeIconContainer}>
            <Ionicons 
              name={getNodeIcon(node.type) as any} 
              size={24} 
              color="#007AFF" 
            />
          </View>
          <View style={styles.nodeTextContainer}>
            <View style={styles.nodeTitleRow}>
              <Text style={styles.nodeName} numberOfLines={1}>
                {node.name}
              </Text>
              <View style={[styles.nodeBadge, { backgroundColor: details.statusColor }]}>
                <Text style={styles.nodeBadgeText}>{details.badge}</Text>
              </View>
            </View>
            <Text style={styles.nodeSubtitle} numberOfLines={2}>
              {details.subtitle}
            </Text>
            {node.tags && node.tags.length > 0 && (
              <View style={styles.nodeTagsContainer}>
                {node.tags.slice(0, 3).map((tag, index) => (
                  <View key={index} style={styles.nodeTag}>
                    <Text style={styles.nodeTagText}>{tag}</Text>
                  </View>
                ))}
                {node.tags.length > 3 && (
                  <Text style={styles.moreTagsText}>+{node.tags.length - 3}</Text>
                )}
              </View>
            )}
          </View>
        </View>
        <View style={styles.nodeActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onView(node)}
          >
            <Ionicons name="eye" size={18} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onEdit(node)}
          >
            <Ionicons name="pencil" size={18} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onDelete(node)}
          >
            <Ionicons name="trash" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export const ManualNodeManagement: React.FC = () => {
  const { nodes, deleteNode } = useNodes();
  
  // State management
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedNode, setSelectedNode] = useState<Node | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [createNodeType, setCreateNodeType] = useState<NodeType>('person');

  // Filter and search nodes
  const filteredNodes = useMemo(() => {
    let filtered = nodes;

    // Filter by tab
    if (activeTab !== 'all') {
      const typeMap: Record<Exclude<TabType, 'all'>, NodeType> = {
        contacts: 'person',
        events: 'event',
        communities: 'community'
      };
      filtered = filtered.filter(node => node.type === typeMap[activeTab]);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(node => {
        const searchableText = [
          node.name,
          node.type,
          ...(node.tags || []),
          // Type-specific searchable fields
          ...(node.type === 'person' ? [(node as PersonNode).walletAddress, (node as PersonNode).email] : []),
          ...(node.type === 'event' ? [(node as EventNode).location, (node as EventNode).eventType] : []),
          ...(node.type === 'community' ? [(node as CommunityNode).communityType] : []),
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableText.includes(query);
      });
    }

    return filtered.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [nodes, activeTab, searchQuery]);

  // Event handlers
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh - in real app this would refresh from API
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleCreateNode = useCallback((type: NodeType) => {
    setCreateNodeType(type);
    setSelectedNode(undefined);
    setViewMode('create');
    setShowFormModal(true);
  }, []);

  const handleEditNode = useCallback((node: Node) => {
    setSelectedNode(node);
    setViewMode('edit');
    setShowFormModal(true);
  }, []);

  const handleDeleteNode = useCallback(async (node: Node) => {
    Alert.alert(
      'Delete Node',
      `Are you sure you want to delete "${node.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteNode(node.id);
              Alert.alert('Success', `${node.name} has been deleted.`);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete node. Please try again.');
              console.error('Error deleting node:', error);
            }
          }
        }
      ]
    );
  }, [deleteNode]);

  const handleViewNode = useCallback((node: Node) => {
    setSelectedNode(node);
    setViewMode('edit'); // Use edit form as view - forms handle display mode
    setShowFormModal(true);
  }, []);

  const handleFormSave = useCallback((savedNode: Node) => {
    setShowFormModal(false);
    setSelectedNode(undefined);
    setViewMode('list');
    Alert.alert('Success', `${savedNode.name} has been ${viewMode === 'create' ? 'created' : 'updated'}.`);
  }, [viewMode]);

  const handleFormCancel = useCallback(() => {
    setShowFormModal(false);
    setSelectedNode(undefined);
    setViewMode('list');
  }, []);

  // Get statistics
  const stats = useMemo(() => {
    const contacts = nodes.filter(n => n.type === 'person').length;
    const events = nodes.filter(n => n.type === 'event').length;
    const communities = nodes.filter(n => n.type === 'community').length;
    const withWallets = nodes.filter(n => 
      (n.type === 'person' && (n as PersonNode).walletAddress)
    ).length;

    return { total: nodes.length, contacts, events, communities, withWallets };
  }, [nodes]);

  const tabs: Array<{ key: TabType; label: string; icon: string; count: number }> = [
    { key: 'all', label: 'All', icon: 'grid', count: stats.total },
    { key: 'contacts', label: 'Contacts', icon: 'person', count: stats.contacts },
    { key: 'events', label: 'Events', icon: 'calendar', count: stats.events },
    { key: 'communities', label: 'Communities', icon: 'people', count: stats.communities },
  ];

  const renderForm = () => {
    const nodeType = selectedNode?.type || createNodeType;
    
    switch (nodeType) {
      case 'person':
        return (
          <PersonNodeForm
            node={selectedNode as PersonNode}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
            isEditing={viewMode === 'edit'}
          />
        );
      case 'event':
        return (
          <EventNodeForm
            node={selectedNode as EventNode}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
            isEditing={viewMode === 'edit'}
          />
        );
      case 'community':
        return (
          <CommunityNodeForm
            node={selectedNode as CommunityNode}
            onSave={handleFormSave}
            onCancel={handleFormCancel}
            isEditing={viewMode === 'edit'}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Node Management</Text>
        <View style={styles.headerStats}>
          <Text style={styles.statsText}>
            {stats.total} nodes • {stats.withWallets} with wallets
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search nodes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#6B7280"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={18} 
                color={activeTab === tab.key ? '#007AFF' : '#6B7280'} 
              />
              <Text style={[
                styles.tabText,
                activeTab === tab.key && styles.activeTabText
              ]}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{tab.count}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Node List */}
      <ScrollView
        style={styles.nodeList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredNodes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>
              {searchQuery.trim() ? 'No matches found' : `No ${activeTab === 'all' ? 'nodes' : activeTab} yet`}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery.trim() 
                ? 'Try adjusting your search terms'
                : `Create your first ${activeTab === 'all' ? 'node' : activeTab.slice(0, -1)} to get started`
              }
            </Text>
          </View>
        ) : (
          filteredNodes.map((node) => (
            <NodeItem
              key={node.id}
              node={node}
              onEdit={handleEditNode}
              onDelete={handleDeleteNode}
              onView={handleViewNode}
            />
          ))
        )}
      </ScrollView>

      {/* Create Button */}
      <View style={styles.createButtonContainer}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            setActiveTab('contacts');
            handleCreateNode('person');
          }}
        >
          <Ionicons name="person-add" size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Contact</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            setActiveTab('events');
            handleCreateNode('event');
          }}
        >
          <Ionicons name="calendar" size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Event</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            setActiveTab('communities');
            handleCreateNode('community');
          }}
        >
          <Ionicons name="people" size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>Community</Text>
        </TouchableOpacity>
      </View>

      {/* Form Modal */}
      <Modal
        visible={showFormModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleFormCancel}
      >
        <SafeAreaView style={styles.modalContainer}>
          {renderForm()}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  headerStats: {
    marginTop: 4,
  },
  statsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#007AFF',
  },
  tabBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  nodeList: {
    flex: 1,
    padding: 16,
  },
  nodeItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  nodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nodeInfo: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  nodeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeTextContainer: {
    flex: 1,
  },
  nodeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nodeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  nodeBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  nodeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  nodeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  nodeTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  nodeTag: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  nodeTagText: {
    fontSize: 12,
    color: '#6B7280',
  },
  moreTagsText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  nodeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        paddingBottom: 34, // Account for safe area on iOS
      },
    }),
  },
  createButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});
