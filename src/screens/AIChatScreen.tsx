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
import { useWallet } from '../contexts/WalletContext';
import { useNodes } from '../contexts/NodeContext';
import { useGemini } from '../features/ai/GeminiContext';
import { VoiceControls } from '../features/voice/VoiceControls';
import { Node, NodeType } from '../types/nodes';
import { ManualNodeManagement } from '@/features/nodes/NodeManagement';
import { MCPServerManagement } from '../features/ai/MCPServerManagement';

const NodeTypeColors = {
  person: '#00f6ff', // Neon Blue
  event: '#ff00ff', // Neon Pink
  community: '#9d00ff', // Neon Purple
};

const NodeTypeIcons = {
  person: '👤',
  event: '📅',
  community: '🏛️',
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  contextNodes?: Node[];
}

export default function AITransactionChat() {
  const { connected } = useWallet();
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
  } = useGemini();

  const {
    nodes,
    selectedNode,
    addToAccessibleNodes,
    llmAccessibleNodeIds,
    getLLMAccessibleNodes,
    toggleAllNodesLLMAccess,
  } = useNodes();

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(
    'AIzaSyDsGhQALbwf6jDAHKpZLu1bhVus5CQ-ERQ'
  );
  const [showApiKeySection, setShowApiKeySection] = useState(!liveConnected);
  const [isApiKeySet, setIsApiKeySet] = useState(false);

  const [showNodeList, setShowNodeList] = useState(false);
  const [showNodeCreation, setShowNodeCreation] = useState(false);
  const [showMCPManagement, setShowMCPManagement] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setShowApiKeySection(!liveConnected);
  }, [liveConnected]);

  const handleSetApiKey = () => {
    const trimmedApiKey = apiKeyInput.trim();

    if (!trimmedApiKey) {
      Alert.alert('Invalid API Key', 'Please enter your API key.');
      return;
    }

    setApiKey(trimmedApiKey);
    setIsApiKeySet(true);
  };

  const handleConnectToAI = async () => {
    if (!isApiKeySet) {
      Alert.alert('API Key Required', 'Please set your API key first.');
      return;
    }

    try {
      const success = await liveConnect();
      if (success) {
        setShowApiKeySection(false);
      } else {
        Alert.alert(
          'Connection Failed',
          'Could not connect to AI. Please check your API key and try again.'
        );
      }
    } catch (error) {
      console.error('AI connection error:', error);
      Alert.alert(
        'Error',
        'Failed to connect to AI. Please check your API key and try again.'
      );
    }
  };

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
            setIsApiKeySet(false);
          },
        },
      ]
    );
  };

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
      await sendMessage(inputText.trim());
      setInputText('');

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
    const isAccessible = llmAccessibleNodeIds.has(node.id);
    addToAccessibleNodes(node.id, !isAccessible);
  };

  const MessageBubble = ({
    message,
    isUser,
  }: {
    message: any;
    isUser: boolean;
  }) => (
    <View
      className={`flex-row mx-4 my-2 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {!isUser && (
        <View className="w-10 h-10 rounded-full bg-[#9d00ff]/30 items-center justify-center mr-3 self-end shadow-lg shadow-purple-500/50">
          <Ionicons name="sparkles" size={20} color="#9d00ff" />
        </View>
      )}
      <View
        className={`max-w-[80%] px-5 py-4 rounded-3xl ${
          isUser
            ? 'bg-[#00f6ff]/20 rounded-br-lg'
            : 'bg-[#1a1a1a] rounded-bl-lg border border-[#9d00ff]/50'
        }`}
      >
        <Text className="text-lg leading-7 text-white font-sans">
          {message.content}
        </Text>
        <Text
          className={`text-xs mt-2 ${isUser ? 'text-white/70' : 'text-gray-400'}`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </View>
  );

  const renderNodeItem = ({ item }: { item: Node }) => {
    const isAccessible = llmAccessibleNodeIds.has(item.id);
    const isSelected = selectedNode?.id === item.id;

    return (
      <TouchableOpacity
        className={`rounded-2xl p-4 mb-3 border-2 transition-all duration-150 ${
          isAccessible
            ? 'border-[#00f6ff] bg-[#00f6ff]/10'
            : isSelected
              ? 'border-[#ff00ff] bg-[#ff00ff]/10'
              : 'border-gray-700 bg-[#1a1a1a]'
        }`}
        onPress={() => handleNodeSelect(item)}
        activeOpacity={0.9}
      >
        <View className="flex-row items-center mb-2">
          <Text className="text-2xl mr-4">{NodeTypeIcons[item.type]}</Text>
          <View className="flex-1">
            <Text className="text-base font-semibold text-white">
              {item.name}
            </Text>
            <Text className="text-sm text-gray-400 capitalize">
              {item.type}
            </Text>
          </View>
          {isAccessible && (
            <Text className="text-lg text-[#00f6ff] font-bold">✓</Text>
          )}
        </View>
        {item.description && (
          <Text className="text-sm text-gray-400 leading-5" numberOfLines={2}>
            {item.description}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const SuggestionChip = ({
    text,
    onPress,
  }: {
    text: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      className="bg-[#1a1a1a] px-4 py-2 rounded-2xl border border-[#00f6ff]/40"
      onPress={onPress}
    >
      <Text className="text-sm text-[#00f6ff] font-medium">{text}</Text>
    </TouchableOpacity>
  );

  const suggestions = [
    'Check my balance',
    'Show transaction history',
    'Send 0.1 SOL',
    'Request airdrop',
    'Create new contact',
  ];

  return (
    <View className="flex-1 bg-[#0d0d0d]">
      <View className="px-4 pt-2 pb-2 border-b border-[#00f6ff]/40 bg-[#1a1a1a]">
        <View className="flex-row justify-between items-center pb-1">
          <View className="flex-row items-center">
            <View
              className={`w-2 h-2 rounded-full mr-2 ${
                liveConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <Text className="text-sm font-semibold text-white">
              AI Assistant
            </Text>
            {liveConnected && (
              <TouchableOpacity
                className="ml-2 p-1"
                onPress={handleDisconnectAI}
              >
                <Ionicons name="power" size={14} color="#ff3b30" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        {liveConnected && (
          <View className="flex-row gap-2">
            <TouchableOpacity
              className="flex-1 bg-[#1a1a1a] px-3 py-2 rounded-lg border border-[#00f6ff]/40 flex-row items-center justify-center gap-2"
              onPress={() => setShowNodeList(true)}
            >
              <Ionicons name="people" size={16} color="#00f6ff" />
              <Text className="text-sm text-white font-medium">
                Nodes ({nodes.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-[#1a1a1a] px-3 py-2 rounded-lg border border-[#00f6ff]/40 flex-row items-center justify-center gap-2"
              onPress={() => setShowMCPManagement(true)}
            >
              <Ionicons name="server" size={16} color="#00f6ff" />
              <Text className="text-sm text-white font-medium">MCP</Text>
            </TouchableOpacity>
          </View>
        )}
        {showApiKeySection && (
          <View className="mt-2 p-4 bg-[#1a1a1a] rounded-xl border border-[#00f6ff]/40">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 pr-4">
                <Text className="text-base font-bold text-white mb-1">
                  Connect AI Assistant
                </Text>
                <Text className="text-sm text-gray-400 mb-2">
                  Enter your Gemini API key to enable AI features
                </Text>
              </View>
              <TouchableOpacity
                className="bg-[#00f6ff]/20 px-4 py-3 rounded-xl"
                onPress={() => {
                  setShowNodeList(false);
                  setShowNodeCreation(true);
                }}
              >
                <Text className="text-[#00f6ff] text-center font-semibold">
                  Manage Nodes
                </Text>
              </TouchableOpacity>
            </View>
            <View className="flex-row gap-2 items-center">
              <TextInput
                className="flex-1 border border-[#00f6ff]/40 rounded-lg px-3 text-sm bg-gray-800 h-10 text-white"
                value={apiKeyInput}
                onChangeText={text => {
                  setApiKeyInput(text);
                  setIsApiKeySet(false);
                }}
                placeholder="Enter your API key"
                placeholderTextColor="#a0a0a0"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={false}
              />
              <TouchableOpacity
                className={`rounded-lg w-10 h-10 items-center justify-center ${
                  !apiKeyInput.trim()
                    ? 'bg-gray-600'
                    : isApiKeySet
                      ? 'bg-green-500'
                      : 'bg-[#00f6ff]'
                }`}
                onPress={handleSetApiKey}
                disabled={!apiKeyInput.trim() || isApiKeySet}
              >
                <Ionicons
                  name={isApiKeySet ? 'checkmark' : 'key'}
                  size={16}
                  color="black"
                />
              </TouchableOpacity>

              <TouchableOpacity
                className={`rounded-lg ${!isApiKeySet ? 'opacity-50' : ''}`}
                onPress={handleConnectToAI}
                disabled={!isApiKeySet}
              >
                <View className="rounded-lg flex-row items-center justify-center h-10 px-3 bg-[#00f6ff]">
                  <Ionicons name="sparkles" size={16} color="black" />
                  <Text className="text-black text-sm font-semibold">
                    Connect
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            {isApiKeySet && (
              <Text className="text-xs text-green-500 mt-2">
                ✓ API key set successfully. You can now connect to the AI
                assistant.
              </Text>
            )}
          </View>
        )}
      </View>
      {nodes.length > 0 && (
        <View className="bg-[#1a1a1a] border-b border-[#00f6ff]/40 py-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row items-center px-4 gap-2">
              <Text className="text-sm text-gray-400 font-medium">Active:</Text>
              {getLLMAccessibleNodes().map((node: Node) => (
                <TouchableOpacity
                  key={node.id}
                  className="px-3 py-1.5 rounded-2xl"
                  style={{
                    backgroundColor:
                      NodeTypeColors[node.type as keyof typeof NodeTypeColors],
                  }}
                  onPress={() => addToAccessibleNodes(node.id, false)}
                >
                  <Text className="text-xs text-black font-medium">
                    {NodeTypeIcons[node.type as keyof typeof NodeTypeIcons]}{' '}
                    {node.name} ×
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                className="px-2 py-1"
                onPress={() => toggleAllNodesLLMAccess(false)}
              >
                <Text className="text-xs text-gray-400">Clear All</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
        >
          {messages.length === 0 ? (
            <View className="items-center px-8 py-6">
              <View className="w-20 h-20 rounded-full bg-[#00f6ff]/20 items-center justify-center mb-6">
                <Ionicons name="sparkles" size={32} color="#00f6ff" />
              </View>
              <Text className="text-2xl font-bold text-white mb-3">
                Call me SolPal! 👋
              </Text>
              <Text className="text-base text-gray-400 text-center leading-6 mb-8">
                I can help you manage your Solana wallet, send transactions,
                check balances, and more!
              </Text>
              {liveConnected && (
                <View className="self-stretch">
                  <Text className="text-base font-semibold text-white mb-4 text-center">
                    Try asking:
                  </Text>
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
            messages.map(message => (
              <MessageBubble
                key={message.id}
                message={message}
                isUser={message.role === 'user'}
              />
            ))
          )}
          {isLoading && (
            <View className="flex-row mx-4 my-1">
              <View className="w-8 h-8 rounded-full bg-[#9d00ff]/20 items-center justify-center mr-2 self-end">
                <Ionicons name="sparkles" size={16} color="#9d00ff" />
              </View>
              <Animated.View
                className="bg-[#1a1a1a] px-4 py-3 rounded-2xl rounded-bl-sm border border-[#9d00ff]/40"
                style={{ opacity: pulseAnim }}
              >
                <View className="flex-row gap-1">
                  <View className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  <View className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  <View className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                </View>
              </Animated.View>
            </View>
          )}
        </ScrollView>
        {liveConnected && (
          <View className="bg-[#1a1a1a] border-t-2 border-[#00f6ff]/40 px-4 py-3">
            <View className="flex-row items-center gap-2">
              <TextInput
                ref={inputRef}
                className="flex-1 border-2 border-[#00f6ff]/40 rounded-full px-4 text-lg bg-gray-800 h-12 text-white"
                value={inputText}
                onChangeText={setInputText}
                placeholder={
                  connected
                    ? 'Message AI Assistant...'
                    : 'Connect wallet to enable transactions'
                }
                placeholderTextColor="#a0a0a0"
                multiline
                maxLength={500}
                editable={liveConnected}
              />
              <TouchableOpacity
                className={`w-12 h-12 rounded-full items-center justify-center ${
                  !inputText.trim() || !liveConnected || isLoading
                    ? 'bg-gray-600'
                    : 'bg-[#00f6ff]'
                }`}
                onPress={handleSendMessage}
                disabled={!inputText.trim() || !liveConnected || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="black" />
                ) : (
                  <Ionicons name="send" size={24} color="black" />
                )}
              </TouchableOpacity>
              <VoiceControls
                isListening={isListening}
                onStartListening={startListening}
                onStopListening={stopListening}
              />
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
      <Modal
        visible={showNodeList}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNodeList(false)}
      >
        <View className="flex-1 bg-[#0d0d0d]">
          <View className="pt-12 pb-4 px-4 bg-[#1a1a1a] border-b border-[#00f6ff]/40">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-white">Nodes</Text>
              <TouchableOpacity
                className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
                onPress={() => setShowNodeList(false)}
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          <View className="p-4 flex-1">
            <TouchableOpacity
              className="bg-[#00f6ff] px-4 py-3 rounded-xl mb-4"
              onPress={() => {
                setShowNodeList(false);
                setShowNodeCreation(true);
              }}
            >
              <Text className="text-black text-center font-semibold">
                Manage Nodes
              </Text>
            </TouchableOpacity>
            {nodes.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <Ionicons name="people-outline" size={64} color="#a0a0a0" />
                <Text className="text-lg font-semibold text-gray-400 mt-4 mb-2">
                  No Nodes Yet
                </Text>
                <Text className="text-sm text-gray-500 text-center">
                  Create your first node to start building your network
                </Text>
              </View>
            ) : (
              <FlatList
                data={nodes}
                renderItem={renderNodeItem}
                keyExtractor={item => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            )}
          </View>
        </View>
      </Modal>
      <Modal
        visible={showNodeCreation}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNodeCreation(false)}
      >
        <SafeAreaView className="flex-1 bg-[#0d0d0d]">
          <View className="flex-row items-center justify-between bg-[#1a1a1a] px-5 py-4 border-b border-[#00f6ff]/40">
            <Text className="text-xl font-bold text-white">
              Node Management
            </Text>
            <TouchableOpacity
              className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
              onPress={() => setShowNodeCreation(false)}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
          <ManualNodeManagement />
        </SafeAreaView>
      </Modal>
      <Modal
        visible={showMCPManagement}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMCPManagement(false)}
      >
        <View className="flex-1 bg-[#0d0d0d]">
          <View className="pt-12 pb-4 px-4 bg-[#1a1a1a] border-b border-[#00f6ff]/40">
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-white">MCP Servers</Text>
              <TouchableOpacity
                className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
                onPress={() => setShowMCPManagement(false)}
              >
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          <MCPServerManagement />
        </View>
      </Modal>
    </View>
  );
}
