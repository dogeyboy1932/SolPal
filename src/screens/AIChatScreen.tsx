import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useWallet } from '../contexts/WalletContext';
import { useNodes } from '../contexts/NodeContext';
import { useGemini } from '../features/ai/GeminiContext';
import { VoiceControls } from '../features/voice/VoiceControls';
import { 
  Node, 
  NodeType, 
  PersonNode, 
  EventNode, 
  CommunityNode
} from '../types/nodes';
import { PersonNodeForm } from '../features/nodes/forms/PersonNodeForm';
import { EventNodeForm } from '../features/nodes/forms/EventNodeForm';
import { CommunityNodeForm } from '../features/nodes/forms/CommunityNodeForm';
import { SmartSuggestionsPanel, ConversationSuggestions } from '../features/ai/SmartSuggestions';
import { MCPServerManagement } from '../features/ai/MCPServerManagement';

const NodeTypeColors = {
  person: '#D97539', // warm-primary
  event: '#E49B3F',  // accent-gold
  community: '#B85C38' // warm-secondary
};

const NodeTypeIcons = {
  person: '👤',
  event: '📅',
  community: '🏛️'
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  contextNodes?: Node[];
}

export default function AITransactionChat() {
  const { connected, publicKey, disconnect: disconnectWallet } = useWallet();
  const { 
    sendMessage, 
    messages, 
    liveConnected, 
    setApiKey, 
    liveConnect,
    liveDisconnect,
    isListening,
    startListening,
    stopListening,
    updateNodeContext
  } = useGemini();

  const {
    nodes,
    activeNodes,
    selectedNode,
    selectNode,
    addToActiveNodes,
    removeFromActiveNodes,
    clearActiveNodes,
    createPersonNode,
    createEventNode,
    createCommunityNode
  } = useNodes();
  
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('AIzaSyDsGhQALbwf6jDAHKpZLu1bhVus5CQ-ERQ');
  const [showApiKeySection, setShowApiKeySection] = useState(!liveConnected);
  
  // Node and MCP management states
  const [showNodeList, setShowNodeList] = useState(false);
  const [showNodeCreation, setShowNodeCreation] = useState(false);
  const [nodeCreationType, setNodeCreationType] = useState<NodeType>('person');
  const [showMCPManagement, setShowMCPManagement] = useState(false);
  const [contextualMessages, setContextualMessages] = useState<Message[]>([]);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Show API key section when not connected
  useEffect(() => {
    setShowApiKeySection(!liveConnected);
  }, [liveConnected]);

  // Convert messages to contextual messages with node context
  useEffect(() => {
    const enhancedMessages = messages.map(msg => ({
      ...msg,
      contextNodes: msg.role === 'assistant' ? activeNodes : undefined
    }));
    setContextualMessages(enhancedMessages);
  }, [messages, activeNodes]);

  // Update AI context when active nodes change
  useEffect(() => {
    if (liveConnected) {
      updateNodeContext(activeNodes);
    }
  }, [activeNodes, liveConnected, updateNodeContext]);

  // Set API key and connect
  const handleConnectToAI = async () => {
    const trimmedApiKey = apiKeyInput.trim();
    
    // Simple validation - just check if not empty
    if (!trimmedApiKey) {
      Alert.alert('Invalid API Key', 'Please enter your API key.');
      return;
    }
    
    try {
      // Set the API key first
      setApiKey(trimmedApiKey);
      
      // Small delay to ensure API key is set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const success = await liveConnect();
      if (success) {
        setShowApiKeySection(false);
      } else {
        Alert.alert('Connection Failed', 'Could not connect to AI. Please check your API key and try again.');
      }
    } catch (error) {
      console.error('AI connection error:', error);
      Alert.alert('Error', 'Failed to connect to AI. Please check your API key and try again.');
    }
  };

  // Disconnect from AI
  const handleDisconnectAI = async () => {
    Alert.alert(
      'Disconnect AI',
      'Are you sure you want to disconnect from the AI assistant?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Disconnect', 
          style: 'destructive',
          onPress: async () => {
            await liveDisconnect();
            setShowApiKeySection(true);
          }
        }
      ]
    );
  };

  // Disconnect wallet
  const handleDisconnectWallet = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Disconnect', 
          style: 'destructive',
          onPress: disconnectWallet
        }
      ]
    );
  };

  // Animate AI thinking indicator
  useEffect(() => {
    if (isLoading) {
      const pulse = Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]);
      Animated.loop(pulse).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isLoading]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !liveConnected) return;

    setIsLoading(true);
    try {
      // Create user message with context
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: inputText.trim(),
        timestamp: new Date(),
        contextNodes: activeNodes.length > 0 ? [...activeNodes] : undefined
      };

      setContextualMessages(prev => [...prev, userMessage]);
      await sendMessage(inputText.trim());
      setInputText('');
      
      // Focus back to input and scroll to bottom
      setTimeout(() => {
        inputRef.current?.focus();
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
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

  const handleSaveNode = (node: Node) => {
    // This is now handled by specific handlers
    setShowNodeCreation(false);
  };

  const handleSavePersonNode = async (node: PersonNode) => {
    await createPersonNode(node);
    setShowNodeCreation(false);
  };

  const handleSaveEventNode = async (node: EventNode) => {
    await createEventNode(node);
    setShowNodeCreation(false);
  };

  const handleSaveCommunityNode = async (node: CommunityNode) => {
    await createCommunityNode(node);
    setShowNodeCreation(false);
  };

  const handleCancelNodeCreation = () => {
    setShowNodeCreation(false);
  };

  const handleSuggestionPress = (suggestion: string) => {
    setInputText(suggestion);
  };

  const MessageBubble = ({ message, isUser }: { 
    message: any; 
    isUser: boolean; 
  }) => (
    <View className={`flex-row mx-4 my-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-2 self-end">
          <Ionicons name="sparkles" size={16} color="#007AFF" />
        </View>
      )}
      <View className={`max-w-3/4 px-4 py-3 rounded-2xl ${
        isUser 
          ? 'bg-blue-500 rounded-br-sm' 
          : 'bg-white rounded-bl-sm border border-gray-300'
      }`}>
        <Text className={`text-base leading-6 ${isUser ? 'text-white' : 'text-gray-900'}`}>
          {message.content}
        </Text>
        
        {message.contextNodes && message.contextNodes.length > 0 && (
          <View className="mt-2 gap-1">
            <Text className={`text-xs font-medium ${isUser ? 'text-white/70' : 'text-gray-500'}`}>
              Context:
            </Text>
            {message.contextNodes.map((node: Node) => (
              <View 
                key={node.id} 
                className="px-2 py-1 rounded-xl self-start"
                style={{ backgroundColor: NodeTypeColors[node.type] + '20' }}
              >
                <Text className={`text-xs ${isUser ? 'text-white' : 'text-gray-700'}`}>
                  {NodeTypeIcons[node.type]} {node.name}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        <Text className={`text-xs mt-1 ${isUser ? 'text-white/70' : 'text-gray-500'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  const renderNodeItem = ({ item }: { item: Node }) => {
    const isActive = activeNodes.find(n => n.id === item.id);
    const isSelected = selectedNode?.id === item.id;
    
    return (
      <TouchableOpacity
        className={`bg-surface-secondary rounded-xl p-4 mb-3 border ${
          isActive ? 'border-warm-primary bg-warm-primary/10' : 
          isSelected ? 'bg-accent-amber/10' : 'border-warm-primary/20'
        }`}
        onPress={() => handleNodeSelect(item)}
      >
        <View className="flex-row items-center mb-2">
          <Text className="text-2xl mr-3">
            {NodeTypeIcons[item.type]}
          </Text>
          <View className="flex-1">
            <Text className="text-base font-semibold text-neutral-light">
              {item.name}
            </Text>
            <Text className="text-sm text-neutral-medium capitalize">
              {item.type}
            </Text>
          </View>
          {isActive && (
            <Text className="text-base text-warm-primary font-bold">
              ✓
            </Text>
          )}
        </View>
        {item.description && (
          <Text className="text-sm text-neutral-medium leading-5" numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const SuggestionChip = ({ text, onPress }: { text: string; onPress: () => void }) => (
    <TouchableOpacity className="bg-white px-4 py-2 rounded-2xl border border-gray-300" onPress={onPress}>
      <Text className="text-sm text-blue-500 font-medium">{text}</Text>
    </TouchableOpacity>
  );

  const suggestions = [
    "Check my balance",
    "Show transaction history", 
    "Send 0.1 SOL",
    "Request airdrop",
    "Create new contact"
  ];

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header with Connection Status and Controls */}
      <View
        // colors={['#FFFFFF', '#F8F9FA']}
        className="px-4 pt-2 pb-2 border-b border-gray-300 bg-neutral-medium"
      >
        
        {/* Top Row: Wallet & AI Status */}
        <View className="flex-row justify-between items-center pb-1">
          {/* Wallet Status */}
          <View className="flex-row items-center">
            <View className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <Text className="text-sm font-semibold text-gray-900">Wallet</Text>
            {connected && (
              <TouchableOpacity className="ml-2 p-1" onPress={handleDisconnectWallet}>
                <Ionicons name="power" size={14} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>

          {/* AI Status */}
          <View className="flex-row items-center">
            <View className={`w-2 h-2 rounded-full mr-2 ${liveConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <Text className="text-sm font-semibold text-gray-900">AI Assistant</Text>
            {liveConnected && (
              <TouchableOpacity className="ml-2 p-1" onPress={handleDisconnectAI}>
                <Ionicons name="power" size={14} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>
        </View>



        {/* Management Buttons Row */}
        {liveConnected && (
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="flex-1 bg-white px-3 py-2 rounded-lg border border-gray-300 flex-row items-center justify-center gap-2"
              onPress={() => setShowNodeList(true)}
            >
              <Ionicons name="people" size={16} color="#007AFF" />
              <Text className="text-sm text-gray-900 font-medium">
                Nodes ({nodes.length})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-1 bg-white px-3 py-2 rounded-lg border border-gray-300 flex-row items-center justify-center gap-2"
              onPress={() => setShowMCPManagement(true)}
            >
              <Ionicons name="server" size={16} color="#007AFF" />
              <Text className="text-sm text-gray-900 font-medium">MCP</Text>
            </TouchableOpacity>
          </View>
        )}




        {/* API Key Section - Show when not connected */}
        {showApiKeySection && (
          <View className="mt-2 p-4 bg-white rounded-xl border border-gray-300">
            <Text className="text-base font-bold text-gray-900 mb-1">Connect AI Assistant</Text>
            <Text className="text-sm text-gray-500 mb-2">Enter your Gemini API key to enable AI features</Text>
            
            <View className="flex-row gap-3 items-center">
              <TextInput
                className="flex-1 border border-gray-300 rounded-lg px-3 text-sm bg-gray-50 h-10"
                value={apiKeyInput}
                onChangeText={setApiKeyInput}
                placeholder="Enter your API key"
                placeholderTextColor="#C7C7CC"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={false}
              />
              
              <TouchableOpacity
                className={`rounded-lg ${!apiKeyInput.trim() ? 'opacity-50' : ''}`}
                onPress={handleConnectToAI}
                disabled={!apiKeyInput.trim()}
              >
                <LinearGradient
                  colors={
                    apiKeyInput.trim()
                      ? ['#007AFF', '#0056CC']
                      : ['#C7C7CC', '#A8A8A8']
                  }
                  className="rounded-lg flex-row items-center justify-center gap-1.5 h-10 px-3"
                >
                  <Ionicons name="sparkles" size={16} color="white" />
                  <Text className="text-white text-sm font-semibold">Connect</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

      </View>

      {/* Active Nodes Bar */}
      {activeNodes.length > 0 && (
        <View className="bg-white border-b border-gray-300 py-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row items-center px-4 gap-2">
              <Text className="text-sm text-gray-600 font-medium">
                Active:
              </Text>
              {activeNodes.map(node => (
                <TouchableOpacity
                  key={node.id}
                  className="px-3 py-1.5 rounded-2xl"
                  style={{ backgroundColor: NodeTypeColors[node.type] }}
                  onPress={() => removeFromActiveNodes(node.id)}
                >
                  <Text className="text-xs text-white font-medium">
                    {NodeTypeIcons[node.type]} {node.name} ×
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                className="px-2 py-1"
                onPress={clearActiveNodes}
              >
                <Text className="text-xs text-gray-500">
                  Clear All
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Main Chat Interface */}
      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
        >
          {messages.length === 0 ? (
            <View className="items-center px-8 py-6">
              <View className="w-20 h-20 rounded-full bg-blue-100 items-center justify-center mb-6">
                <Ionicons name="sparkles" size={32} color="#007AFF" />
              </View>
              <Text className="text-2xl font-bold text-gray-900 mb-3">AI Solana Assistant</Text>
              <Text className="text-base text-gray-500 text-center leading-6 mb-8">
                I can help you manage your Solana wallet, send transactions, check balances, and more!
              </Text>
              
              {/* Suggestion Chips */}
              {liveConnected && (
                <View className="self-stretch">
                  <Text className="text-base font-semibold text-gray-900 mb-4 text-center">Try asking:</Text>
                  <View className="flex-row flex-wrap justify-center gap-2">
                    {suggestions.map((suggestion, index) => (
                      <SuggestionChip
                        key={index}
                        text={suggestion}
                        onPress={() => setInputText(suggestion)}
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isUser={message.role === 'user'}
              />
            ))
          )}
          
          {/* AI Thinking Indicator */}
          {isLoading && (
            <View className="flex-row mx-4 my-1">
              <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-2 self-end">
                <Ionicons name="sparkles" size={16} color="#007AFF" />
              </View>
              <Animated.View className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm border border-gray-300" style={{ opacity: pulseAnim }}>
                <View className="flex-row gap-1">
                  <View className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  <View className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  <View className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                </View>
              </Animated.View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        {liveConnected && (
          <View className="bg-white border-t border-gray-300 px-4 py-3">
            <View className="flex-row items-end gap-2">
              <TextInput
                ref={inputRef}
                className="flex-1 border border-gray-300 rounded-xl px-2 text-base bg-gray-50 h-10"
                value={inputText}
                onChangeText={setInputText}
                placeholder={connected ? "Message AI Assistant..." : "Connect wallet to enable transactions"}
                placeholderTextColor="#C7C7CC"
                multiline
                maxLength={500}
                editable={liveConnected}
              />
              
              {/* Send Button */}
              <TouchableOpacity
                className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${
                  (!inputText.trim() || !liveConnected || isLoading) ? 'bg-gray-400' : 'bg-blue-500'
                }`}
                onPress={handleSendMessage}
                disabled={!inputText.trim() || !liveConnected || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="send" size={20} color="white" />
                )}
              </TouchableOpacity>

              {/* Voice Control */}
              <VoiceControls
                isListening={isListening}
                onStartListening={startListening}
                onStopListening={stopListening}
              />
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Node List Modal */}
      <Modal
        visible={showNodeList}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNodeList(false)}
      >
        <View className="flex-1 bg-gray-50">
          <LinearGradient
            colors={['#FFEE58', '#FFD54F', '#FFCA28']}
            className="pt-12 pb-4 px-4"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-gray-900">Nodes</Text>
              <TouchableOpacity
                className="w-8 h-8 rounded-full bg-black/10 items-center justify-center"
                onPress={() => setShowNodeList(false)}
              >
                <Ionicons name="close" size={20} color="#333" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <View className="p-4">
            <TouchableOpacity
              className="bg-blue-500 px-4 py-3 rounded-xl mb-4"
              onPress={() => {
                setShowNodeList(false);
                setShowNodeCreation(true);
              }}
            >
              <Text className="text-white text-center font-semibold">
                Create New Node
              </Text>
            </TouchableOpacity>

            <ScrollView className="flex-1">
              {nodes.map(node => renderNodeItem({ item: node }))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Node Creation Modal */}
      <Modal
        visible={showNodeCreation}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNodeCreation(false)}
      >
        <View className="flex-1 bg-gray-50">
          <LinearGradient
            colors={['#FFEE58', '#FFD54F', '#FFCA28']}
            className="pt-12 pb-4 px-4"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-gray-900">Create Node</Text>
              <TouchableOpacity
                className="w-8 h-8 rounded-full bg-black/10 items-center justify-center"
                onPress={() => setShowNodeCreation(false)}
              >
                <Ionicons name="close" size={20} color="#333" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <View className="p-4">
            <View className="flex-row mb-4 bg-gray-200 rounded-xl p-1">
              {(['person', 'event', 'community'] as const).map(type => (
                <TouchableOpacity
                  key={type}
                  className={`flex-1 py-2 rounded-lg ${nodeCreationType === type ? 'bg-white shadow-sm' : ''}`}
                  onPress={() => setNodeCreationType(type)}
                >
                  <Text className={`text-center font-medium ${
                    nodeCreationType === type ? 'text-gray-900' : 'text-gray-600'
                  }`}>
                    {NodeTypeIcons[type]} {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView className="flex-1">
              {nodeCreationType === 'person' && (
                <PersonNodeForm onSave={handleSavePersonNode} onCancel={handleCancelNodeCreation} />
              )}
              {nodeCreationType === 'event' && (
                <EventNodeForm onSave={handleSaveEventNode} onCancel={handleCancelNodeCreation} />
              )}
              {nodeCreationType === 'community' && (
                <CommunityNodeForm onSave={handleSaveCommunityNode} onCancel={handleCancelNodeCreation} />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MCP Management Modal */}
      <Modal
        visible={showMCPManagement}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMCPManagement(false)}
      >
        <View className="flex-1 bg-gray-50">
          <LinearGradient
            colors={['#FFEE58', '#FFD54F', '#FFCA28']}
            className="pt-12 pb-4 px-4"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-gray-900">MCP Servers</Text>
              <TouchableOpacity
                className="w-8 h-8 rounded-full bg-black/10 items-center justify-center"
                onPress={() => setShowMCPManagement(false)}
              >
                <Ionicons name="close" size={20} color="#333" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <MCPServerManagement />
        </View>
      </Modal>
    </View>
  );
}


