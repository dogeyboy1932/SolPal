import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
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
import { useNodes } from '../../contexts/NodeContext';
import { PersonNodeForm } from './forms/PersonNodeForm';
import { EventNodeForm } from './forms/EventNodeForm';
import { CommunityNodeForm } from './forms/CommunityNodeForm';
import type {
  Node,
  NodeType,
  PersonNode,
  EventNode,
  CommunityNode,
} from '../../types/nodes';
import { nodeService } from '../../services/nodeService';

type TabType = 'all' | 'contacts' | 'events' | 'communities';
type ViewMode = 'list' | 'create' | 'edit';

interface NodeItemProps {
  node: Node;
  onEdit: (node: Node) => void;
  onDelete: (node: Node) => void;
  onView: (node: Node) => void;
  onSignUp: (node: EventNode) => void;
}

const NodeItem: React.FC<NodeItemProps> = ({
  node,
  onEdit,
  onDelete,
  onView,
  onSignUp,
}) => {
  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case 'person':
        return 'person';
      case 'event':
        return 'calendar';
      case 'community':
        return 'people';
      default:
        return 'ellipse';
    }
  };

  const getNodeDetails = (node: Node) => {
    switch (node.type) {
      case 'person':
        const person = node as PersonNode;
        return {
          subtitle: person.walletAddress
            ? `💰 ${person.walletAddress.slice(0, 12)}...`
            : person.email || 'No contact info',
          badge: person.relationship || 'contact',
          statusColor: person.walletAddress ? '#10B981' : '#6B7280',
        };
      case 'event':
        const event = node as EventNode;
        return {
          subtitle: `📅 ${event.date.toLocaleDateString()} ${event.location ? `• 📍 ${event.location}` : ''}`,
          badge: event.eventType,
          statusColor:
            new Date(event.date) > new Date() ? '#3B82F6' : '#6B7280',
        };
      case 'community':
        const community = node as CommunityNode;
        return {
          subtitle: `👥 ${community.memberCount || 0} members • ${community.isPublic ? '🔓 Public' : '🔒 Private'}`,
          badge: community.communityType,
          statusColor: community.isPublic ? '#10B981' : '#F59E0B',
        };
      default:
        return {
          subtitle: 'Unknown node type',
          badge: 'unknown',
          statusColor: '#6B7280',
        };
    }
  };

  const details = getNodeDetails(node);

  return (
    <View className="bg-white rounded-xl mb-3 p-4 shadow-sm">
      <View className="flex-row justify-between items-start">
        <View className="flex-1 flex-row gap-3">
          <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
            <Ionicons
              name={getNodeIcon(node.type) as any}
              size={24}
              color="#007AFF"
            />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-1">
              <Text
                className="text-base font-semibold text-gray-900 flex-1 mr-2"
                numberOfLines={1}
              >
                {node.name}
              </Text>
              <View
                className="rounded-lg px-2 py-0.5"
                style={{ backgroundColor: details.statusColor }}
              >
                <Text className="text-xs font-semibold text-white uppercase">
                  {details.badge}
                </Text>
              </View>
            </View>
            <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
              {details.subtitle}
            </Text>
            {node.type === 'event' && (
              <Text className="text-sm text-gray-600 mb-2">
                Attendees: {node.attendees?.length || 0} /{' '}
                {node.maxAttendees || '∞'}
              </Text>
            )}
            {node.tags && node.tags.length > 0 && (
              <View className="flex-row flex-wrap gap-1.5 items-center">
                {node.tags.slice(0, 3).map((tag, index) => (
                  <View
                    key={index}
                    className="bg-gray-100 rounded-md px-2 py-0.5"
                  >
                    <Text className="text-xs text-gray-600">{tag}</Text>
                  </View>
                ))}
                {node.tags.length > 3 && (
                  <Text className="text-xs text-gray-400 italic">
                    +{node.tags.length - 3}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
        <View className="flex-row gap-2">
          {node.type === 'event' &&
            (node.attendees?.length || 0) < (node.maxAttendees || Infinity) && (
              <TouchableOpacity
                className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center"
                onPress={() => onSignUp(node as EventNode)}
              >
                <Ionicons name="person-add" size={18} color="#3B82F6" />
              </TouchableOpacity>
            )}
          <TouchableOpacity
            className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
            onPress={() => onView(node)}
          >
            <Ionicons name="eye" size={18} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity
            className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
            onPress={() => onEdit(node)}
          >
            <Ionicons name="pencil" size={18} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
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
        communities: 'community',
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
          ...(node.type === 'person'
            ? [(node as PersonNode).walletAddress, (node as PersonNode).email]
            : []),
          ...(node.type === 'event'
            ? [(node as EventNode).location, (node as EventNode).eventType]
            : []),
          ...(node.type === 'community'
            ? [(node as CommunityNode).communityType]
            : []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(query);
      });
    }

    return filtered.sort(
      (a, b) =>
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

  const handleDeleteNode = useCallback(
    async (node: Node) => {
      
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
                Alert.alert(
                  'Error',
                  'Failed to delete node. Please try again.'
                );
                console.error('Error deleting node:', error);
              }
            },
          },
        ]
      );
    },
    [deleteNode]
  );

  const handleViewNode = useCallback((node: Node) => {
    setSelectedNode(node);
    setViewMode('edit'); // Use edit form as view - forms handle display mode
    setShowFormModal(true);
  }, []);

  const handleSignUpForEvent = useCallback(async (event: EventNode) => {
    // This is a placeholder for the current user's person node ID.
    // In a real application, you would get this from the user's session or context.
    const currentPersonNodeId = '1';
    const success = await nodeService.signUpForEvent(
      event.id,
      currentPersonNodeId
    );
    if (success) {
      Alert.alert(
        'Success',
        `You have successfully signed up for ${event.name}.`
      );
    } else {
      Alert.alert(
        'Error',
        `Could not sign up for ${event.name}. You may not have the required NFT.`
      );
    }
  }, []);

  const handleFormSave = useCallback(
    (savedNode: Node) => {
      setShowFormModal(false);
      setSelectedNode(undefined);
      setViewMode('list');
      Alert.alert(
        'Success',
        `${savedNode.name} has been ${viewMode === 'create' ? 'created' : 'updated'}.`
      );
    },
    [viewMode]
  );

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
    const withWallets = nodes.filter(
      n => n.type === 'person' && (n as PersonNode).walletAddress
    ).length;

    return { total: nodes.length, contacts, events, communities, withWallets };
  }, [nodes]);

  const tabs: Array<{
    key: TabType;
    label: string;
    icon: string;
    count: number;
  }> = [
    { key: 'all', label: 'All', icon: 'grid', count: stats.total },
    {
      key: 'contacts',
      label: 'Contacts',
      icon: 'person',
      count: stats.contacts,
    },
    { key: 'events', label: 'Events', icon: 'calendar', count: stats.events },
    {
      key: 'communities',
      label: 'Communities',
      icon: 'people',
      count: stats.communities,
    },
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

      // FIX: FOR NEXT IMPLEMENTATION
      // case 'event':
      //   return (
      //     <EventNodeForm
      //       node={selectedNode as EventNode}
      //       onSave={handleFormSave}
      //       onCancel={handleFormCancel}
      //       isEditing={viewMode === 'edit'}
      //     />
      //   );
      // case 'community':
      //   return (
      //     <CommunityNodeForm
      //       node={selectedNode as CommunityNode}
      //       onSave={handleFormSave}
      //       onCancel={handleFormCancel}
      //       isEditing={viewMode === 'edit'}
      //     />
      //   );
      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-3 border-b border-gray-200">
        <View className="mt-1">
          <Text className="text-sm text-gray-600">
            {stats.total} nodes • {stats.withWallets} with wallets
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View className="bg-white px-5 py-3  border-b border-gray-200">
        <View className="flex-row px-3 items-center bg-gray-100 rounded-xl">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 text-base text-gray-900"
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
      <View className="bg-white border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              className={`flex-row items-center px-4 py-3 mx-1 gap-2 ${
                activeTab === tab.key ? 'border-b-2 border-blue-500' : ''
              }`}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={activeTab === tab.key ? '#007AFF' : '#6B7280'}
              />
              <Text
                className={`text-sm font-medium ${
                  activeTab === tab.key ? 'text-blue-500' : 'text-gray-600'
                }`}
              >
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View className="bg-gray-100 rounded-full px-1.5 py-0.5 min-w-5 items-center">
                  <Text className="text-xs font-semibold text-gray-600">
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Node List */}
      <ScrollView
        className="flex-1 p-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {filteredNodes.length === 0 ? (
          <View className="items-center justify-center py-15 px-10">
            <Ionicons name="folder-open" size={64} color="#D1D5DB" />
            <Text className="text-lg font-semibold text-gray-700 mt-4 mb-2 text-center">
              {searchQuery.trim()
                ? 'No matches found'
                : `No ${activeTab === 'all' ? 'nodes' : activeTab} yet`}
            </Text>
            <Text className="text-sm text-gray-600 text-center leading-5">
              {searchQuery.trim()
                ? 'Try adjusting your search terms'
                : `Create your first ${activeTab === 'all' ? 'node' : activeTab.slice(0, -1)} to get started`}
            </Text>
          </View>
        ) : (
          filteredNodes.map(node => (
            <NodeItem
              key={node.id}
              node={node}
              onEdit={handleEditNode}
              onDelete={handleDeleteNode}
              onView={handleViewNode}
              onSignUp={handleSignUpForEvent}
            />
          ))
        )}
      </ScrollView>

      {/* Create Button */}
      <View
        className={`flex-row bg-white p-4 gap-3 border-t border-gray-200 ${Platform.OS === 'ios' ? 'pb-8' : ''}`}
      >
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center bg-blue-500 rounded-xl py-3 gap-2"
          onPress={() => {
            setActiveTab('contacts');
            handleCreateNode('person');
          }}
        >
          <Ionicons name="person-add" size={20} color="#FFFFFF" />
          <Text className="text-sm font-semibold text-white">Contact</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center bg-blue-500 rounded-xl py-3 gap-2"
          disabled={true} // FIX: NEXT STEP
          style={{ opacity: 0.5 }} // FIX: NEXT STEP
          onPress={() => {
            setActiveTab('events');
            handleCreateNode('event');
          }}
        >
          <Ionicons name="calendar" size={20} color="#FFFFFF" />
          <Text className="text-sm font-semibold text-white">Event</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center bg-blue-500 rounded-xl py-3 gap-2"
          disabled={true} // FIX: NEXT STEP
          style={{ opacity: 0.5 }} // FIX: NEXT STEP
          onPress={() => {
            setActiveTab('communities');
            handleCreateNode('community');
          }}
        >
          <Ionicons name="people" size={20} color="#FFFFFF" />
          <Text className="text-sm font-semibold text-white">Community</Text>
        </TouchableOpacity>
      </View>

      {/* Form Modal */}
      <Modal
        visible={showFormModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleFormCancel}
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          {renderForm()}
        </SafeAreaView>
      </Modal>
    </View>
  );
};
