import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Modal,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGemini } from '../features/ai/GeminiContext';
import { useNodes } from '../contexts/NodeContext';
import { Node, NodeType } from '../types/nodes';
import { PersonNodeForm } from '../features/nodes/components/PersonNodeForm';
import { EventNodeForm } from '../features/nodes/components/EventNodeForm';
import { CommunityNodeForm } from '../features/nodes/components/CommunityNodeForm';
import { SmartSuggestionsPanel, ConversationSuggestions } from '../features/ai/SmartSuggestions';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  contextNodes?: Node[];
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

export const MainChatScreen: React.FC = () => {
  const {
    sendMessage,
    messages: geminiMessages,
    liveConnected,
    setApiKey,
    liveConnect,
    updateNodeContext
  } = useGemini();

  const {
    nodes,
    activeNodes,
    selectedNode,
    selectNode,
    addToActiveNodes,
    removeFromActiveNodes,
    clearActiveNodes
  } = useNodes();

  const [inputText, setInputText] = useState('');
  const [apiKey, setApiKeyInput] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [hasTriedConnection, setHasTriedConnection] = useState(false);
  const [showNodeCreation, setShowNodeCreation] = useState(false);
  const [nodeCreationType, setNodeCreationType] = useState<NodeType>('person');
  const [showNodeList, setShowNodeList] = useState(false);

  // Enhanced messages with context
  const [contextualMessages, setContextualMessages] = useState<Message[]>([]);

  // Mark connection attempt when already connected
  React.useEffect(() => {
    if (liveConnected && !hasTriedConnection) {
      setHasTriedConnection(true);
    }
  }, [liveConnected, hasTriedConnection]);

  // Auto-setup API key modal if not connected and haven't tried yet
  React.useEffect(() => {
    // Only show modal if:
    // 1. Not connected
    // 2. Haven't tried connecting yet
    // 3. Modal isn't already showing
    // 4. Connection is truly needed (not just a temporary navigation state)
    if (!liveConnected && !hasTriedConnection && !showApiKeyModal) {
      // Add a small delay to prevent showing modal during navigation
      const timer = setTimeout(() => {
        if (!liveConnected) {
          setShowApiKeyModal(true);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [liveConnected, hasTriedConnection, showApiKeyModal]);

  // Convert Gemini messages to contextual messages
  React.useEffect(() => {
    const enhancedMessages = geminiMessages.map(msg => ({
      ...msg,
      contextNodes: msg.role === 'assistant' ? activeNodes : undefined
    }));
    setContextualMessages(enhancedMessages);
  }, [geminiMessages, activeNodes]);

  // Update AI context when active nodes change (but only when meaningful changes occur)
  React.useEffect(() => {
    if (liveConnected) {
      // Let updateNodeContext handle change detection internally
      updateNodeContext(activeNodes);
    }
  }, [activeNodes, liveConnected, updateNodeContext]);

  const handleSendMessage = useCallback(() => {
    if (!inputText.trim() || !liveConnected) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
      contextNodes: activeNodes.length > 0 ? [...activeNodes] : undefined
    };

    setContextualMessages(prev => [...prev, userMessage]);
    sendMessage(inputText.trim());
    setInputText('');
  }, [inputText, liveConnected, sendMessage, activeNodes]);

  const handleSuggestionPress = useCallback((suggestion: string) => {
    setInputText(suggestion);
  }, []);

  const handleApiKeySubmit = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter a valid API key');
      return;
    }

    try {
      setApiKey(apiKey.trim());
      setHasTriedConnection(true); // Mark that we've tried connecting
      await liveConnect();
      setShowApiKeyModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to connect with API key');
    }
  };

  const handleNodeSelect = (node: Node) => {
    if (activeNodes.find(n => n.id === node.id)) {
      removeFromActiveNodes(node.id);
    } else {
      addToActiveNodes(node);
    }
  };

  const handleCreateNode = (nodeType: NodeType) => {
    setNodeCreationType(nodeType);
    setShowNodeCreation(true);
    setShowNodeList(false);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.role === 'user' ? styles.userMessage : styles.assistantMessage
    ]}>
      <Text style={[
        styles.messageText,
        item.role === 'user' ? styles.userMessageText : styles.assistantMessageText
      ]}>
        {item.content}
      </Text>
      
      {item.contextNodes && item.contextNodes.length > 0 && (
        <View style={styles.contextNodesContainer}>
          <Text style={styles.contextLabel}>Context:</Text>
          {item.contextNodes.map(node => (
            <View key={node.id} style={[
              styles.contextNodeTag,
              { backgroundColor: NodeTypeColors[node.type] + '20' }
            ]}>
              <Text style={styles.contextNodeText}>
                {NodeTypeIcons[node.type]} {node.name}
              </Text>
            </View>
          ))}
        </View>
      )}
      
      <Text style={styles.timestamp}>
        {item.timestamp.toLocaleTimeString()}
      </Text>
    </View>
  );

  const renderNodeItem = ({ item }: { item: Node }) => {
    const isActive = activeNodes.find(n => n.id === item.id);
    const isSelected = selectedNode?.id === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.nodeItem,
          isActive && styles.nodeItemActive,
          isSelected && styles.nodeItemSelected
        ]}
        onPress={() => handleNodeSelect(item)}
      >
        <View style={styles.nodeItemHeader}>
          <Text style={styles.nodeItemIcon}>{NodeTypeIcons[item.type]}</Text>
          <View style={styles.nodeItemInfo}>
            <Text style={styles.nodeItemName}>{item.name}</Text>
            <Text style={styles.nodeItemType}>{item.type}</Text>
          </View>
          {isActive && <Text style={styles.activeIndicator}>✓</Text>}
        </View>
        {item.description && (
          <Text style={styles.nodeItemDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Assistant</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowNodeList(true)}
          >
            <Text style={styles.headerButtonText}>Nodes ({nodes.length})</Text>
          </TouchableOpacity>
          <View style={[
            styles.connectionStatus,
            liveConnected ? styles.connected : styles.disconnected
          ]}>
            <Text style={styles.connectionStatusText}>
              {liveConnected ? '🟢' : '🔴'}
            </Text>
          </View>
        </View>
      </View>

      {/* Active Nodes Bar */}
      {activeNodes.length > 0 && (
        <View style={styles.activeNodesBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.activeNodesContainer}>
              <Text style={styles.activeNodesLabel}>Active:</Text>
              {activeNodes.map(node => (
                <TouchableOpacity
                  key={node.id}
                  style={[
                    styles.activeNodeChip,
                    { backgroundColor: NodeTypeColors[node.type] }
                  ]}
                  onPress={() => removeFromActiveNodes(node.id)}
                >
                  <Text style={styles.activeNodeChipText}>
                    {NodeTypeIcons[node.type]} {node.name} ×
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.clearActiveButton}
                onPress={clearActiveNodes}
              >
                <Text style={styles.clearActiveButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Chat Messages */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <FlatList
          data={contextualMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Smart Suggestions */}
        <SmartSuggestionsPanel
          activeNodes={activeNodes}
          onSuggestionPress={handleSuggestionPress}
          visible={liveConnected && activeNodes.length > 0}
        />

        {/* Conversation Suggestions */}
        <ConversationSuggestions
          activeNodes={activeNodes}
          lastMessage={contextualMessages[contextualMessages.length - 1]?.content}
          onSuggestionPress={handleSuggestionPress}
        />

        {/* Input Section */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask me anything about your nodes..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            editable={liveConnected}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || !liveConnected) && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || !liveConnected}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowNodeList(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* API Key Modal */}
      <Modal
        visible={showApiKeyModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Connect to AI</Text>
            <Text style={styles.modalDescription}>
              Enter your Google Gemini API key to start chatting with AI
            </Text>
            
            <TextInput
              style={styles.apiKeyInput}
              value={apiKey}
              onChangeText={setApiKeyInput}
              placeholder="Enter Gemini API Key"
              placeholderTextColor="#999"
              secureTextEntry
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleApiKeySubmit}
              >
                <Text style={styles.modalButtonText}>Connect</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Node List Modal */}
      <Modal
        visible={showNodeList}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manage Nodes</Text>
            <TouchableOpacity onPress={() => setShowNodeList(false)}>
              <Text style={styles.closeButton}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Node Creation Buttons */}
          <View style={styles.createNodeButtons}>
            {(['person', 'event', 'community'] as NodeType[]).map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.createButton, { backgroundColor: NodeTypeColors[type] }]}
                onPress={() => handleCreateNode(type)}
              >
                <Text style={styles.createButtonText}>
                  {NodeTypeIcons[type]} Add {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Nodes List */}
          <FlatList
            data={nodes}
            renderItem={renderNodeItem}
            keyExtractor={(item) => item.id}
            style={styles.nodesList}
            contentContainerStyle={styles.nodesListContent}
          />
        </SafeAreaView>
      </Modal>

      {/* Node Creation Modal */}
      <Modal
        visible={showNodeCreation}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.fullScreenModal}>
          {nodeCreationType === 'person' && (
            <PersonNodeForm
              onSave={() => setShowNodeCreation(false)}
              onCancel={() => setShowNodeCreation(false)}
            />
          )}
          {nodeCreationType === 'event' && (
            <EventNodeForm
              onSave={() => setShowNodeCreation(false)}
              onCancel={() => setShowNodeCreation(false)}
            />
          )}
          {nodeCreationType === 'community' && (
            <CommunityNodeForm
              onSave={() => setShowNodeCreation(false)}
              onCancel={() => setShowNodeCreation(false)}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
  },
  headerButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  connectionStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  connected: {
    backgroundColor: '#4CAF50',
  },
  disconnected: {
    backgroundColor: '#f44336',
  },
  connectionStatusText: {
    fontSize: 8,
  },
  activeNodesBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
  },
  activeNodesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 8,
  },
  activeNodesLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeNodeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeNodeChipText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  clearActiveButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearActiveButtonText: {
    fontSize: 12,
    color: '#999',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 10,
  },
  messageContainer: {
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 12,
    borderRadius: 16,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  assistantMessageText: {
    color: '#333',
  },
  contextNodesContainer: {
    marginTop: 8,
    gap: 4,
  },
  contextLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  contextNodeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  contextNodeText: {
    fontSize: 12,
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    }),
  },
  fabText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '300',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  apiKeyInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtons: {
    gap: 12,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  createNodeButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  createButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  nodesList: {
    flex: 1,
  },
  nodesListContent: {
    paddingHorizontal: 20,
  },
  nodeItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  nodeItemActive: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  nodeItemSelected: {
    backgroundColor: '#e3f2fd',
  },
  nodeItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nodeItemIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  nodeItemInfo: {
    flex: 1,
  },
  nodeItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  nodeItemType: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  activeIndicator: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  nodeItemDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
