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
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '../contexts/WalletContext';
import { useNodes } from '../contexts/NodeContext';
import { useGemini } from '../ai/GeminiContext';
import { Node, NodeType } from '../types/nodes';
import { PersonNodeForm } from './nodes/PersonNodeForm';
import { EventNodeForm } from './nodes              Your API key is stored locally and used only to connect to Google's Gemini AI service.
              Get your free API key at: console.cloud.google.com
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (!liveConnected) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Ionicons name="chatbubble-ellipses-outline" size={64} color="#8E8E93" />
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginTop: 16, textAlign: 'center' }}>
          AI Assistant Connecting...
        </Text>
        <Text style={{ fontSize: 16, color: '#8E8E93', marginTop: 8, textAlign: 'center', marginBottom: 32 }}>
          Please wait while we connect to the AI assistant
        </Text>
        {/* Manual retry button */
ventNodeForm';
import { CommunityNodeForm } from './nodes/CommunityNodeForm';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    confidence?: number;
    suggestions?: string[];
    warnings?: string[];
    transaction?: {
      amount: number;
      recipient: string;
      fee: number;
    };
  };
}

interface NodeContext {
  activeNode?: {
    id: string;
    name: string;
    type: 'person' | 'event' | 'community';
    walletAddress?: string;
  };
  availableNodes?: Array<{
    id: string;
    name: string;
    type: 'person' | 'event' | 'community';
    walletAddress?: string;
  }>;
  recentNodes?: Array<{
    id: string;
    name: string;
    type: 'person' | 'event' | 'community';
    walletAddress?: string;
  }>;
}

export default function AITransactionChat() {
  const { connected, publicKey, balance } = useWallet();
  const { nodes, activeNodes, selectedNode, selectNode, addToActiveNodes, removeFromActiveNodes, createPersonNode, createEventNode, createCommunityNode } = useNodes();
  const { sendMessage, messages, liveConnected, updateNodeContext, setApiKey, liveConnect, tools, getToolStatus } = useGemini();
  
  // Node creation states
  const [showCreateNodeModal, setShowCreateNodeModal] = useState(false);
  const [createNodeType, setCreateNodeType] = useState<NodeType>('person');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // API Key setup states
  const [apiKey, setApiKeyLocal] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false); // Start with chat view
  
  // Create dynamic intro message based on user's node setup
  const getIntroMessage = () => {
    if (nodes.length === 0) {
      return '👋 Hi! I can help you with Solana transactions using natural language.\n\n🎯 **Getting Started:**\n1. Tap the (+) button below to create contacts\n2. Add wallet addresses to your contacts\n3. Say "send 0.5 SOL to [name]"\n\n**For now, try:**\n• "check my balance"\n• "help" for more info';
    }
    
    const nodesWithAddresses = nodes.filter(node => 
      (node.type === 'person' && (node as any).walletAddress) ||
      (node.type === 'community' && (node as any).treasuryAddress) ||
      (node.type === 'event' && (node as any).paymentAddress)
    );
    
    if (nodesWithAddresses.length === 0) {
      return `👋 Hi! I can help you with Solana transactions.\n\n⚠️ **Setup needed:** You have ${nodes.length} contact(s) but none have wallet addresses.\n\n1. Edit your contacts (tap ⚙️ in Manual Mode)\n2. Add wallet addresses to your contacts\n3. Come back and say "send SOL to [name]"\n\n**For now, try:**\n• "check my balance"\n• "help"`;
    }
    
    return `👋 Hi! I can help you with Solana transactions using natural language.\n\n💡 **Try saying:**\n• "send 0.5 SOL to ${nodesWithAddresses[0].name}"\n• "check my balance"\n• "suggest transactions"\n• "help" for more options\n\n**Available:** ${nodesWithAddresses.map(n => n.name).join(', ')}`;
  };
  
  // Update node context with Gemini when nodes change
  useEffect(() => {
    updateNodeContext(activeNodes);
  }, [activeNodes, updateNodeContext]);

  // Auto-setup API key for testing (simplified flow per user request)
  useEffect(() => {
    if (!liveConnected) {
      // For development/testing, use a placeholder key to bypass API key input
      // In production, this would need to be replaced with proper key management
      const testKey = 'test-key-for-development';
      console.log('🔑 Auto-setting test API key to bypass input screen...');
      setApiKey(testKey);
      setApiKeyLocal(testKey);
      
      // Auto-connect
      setTimeout(() => {
        handleSetApiKey();
      }, 1000);
    }
  }, []);

  // Remove the check that shows API key input
  // useEffect(() => {
  //   if (!apiKey && !showApiKeyInput) {
  //     console.log('🔑 No API key found, showing input...');
  //     setShowApiKeyInput(true);
  //   }
  // }, []);

  const scrollViewRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Auto-connect to Gemini Live when component mounts
  useEffect(() => {
    const autoConnect = async () => {
      if (!liveConnected) {
        console.log('🚀 Auto-connecting to Gemini Live...');
        try {
          const success = await liveConnect(tools, activeNodes);
          if (success) {
            console.log('✅ Auto-connected to Gemini Live');
          } else {
            console.log('⚠️ Failed to auto-connect to Gemini Live');
          }
        } catch (error) {
          console.error('❌ Error auto-connecting to Gemini Live:', error);
        }
      }
    };

    autoConnect();
  }, []); // Run once on mount

  // Send intro message when AI connects and no messages yet
  // Commented out to simplify UI flow per user request
  /*
  useEffect(() => {
    if (liveConnected && messages.length === 0) {
      // Log tool status for debugging
      const toolStatus = getToolStatus();
      console.log('🔧 AI Connected - Tool Status:', toolStatus);
      console.log('🔧 Available tools:', tools.map(t => t.name).join(', '));
      
      const introText = `Welcome! I'm your AI assistant for Solana transactions. I can help you send SOL to people and communities using natural language. 

Current setup: You have ${nodes.length} contact(s) configured.
AI Tools Available: ${toolStatus.totalTools} (${toolStatus.toolNames.join(', ')})

${nodes.length === 0 
  ? "To get started, tap the (+) button below to create contacts, then say something like 'send 0.5 SOL to Alice'." 
  : `Available contacts: ${nodes.filter(node => 
      (node.type === 'person' && (node as any).walletAddress) ||
      (node.type === 'community' && (node as any).treasuryAddress) ||
      (node.type === 'event' && (node as any).paymentAddress)
    ).map(n => n.name).join(', ') || 'None have wallet addresses yet'}`
}

Try saying: "check my balance", "help", or "send SOL to [contact name]"`;

      // Send intro message through Gemini
      sendMessage(introText, activeNodes);
    }
  }, [liveConnected, nodes.length, messages.length, sendMessage, activeNodes, tools, getToolStatus]);
  */

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
    if (!inputText.trim() || isLoading) return;
    
    const userMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);
    
    try {
      // Send message to Gemini with current node context
      sendMessage(userMessage, activeNodes);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Node creation handlers
  const handleCreateNode = (type: NodeType) => {
    setCreateNodeType(type);
    setShowCreateNodeModal(true);
  };

  const handleNodeCreated = (node: Node) => {
    setShowCreateNodeModal(false);
    // Send notification through Gemini
    sendMessage(`✅ I've successfully created ${node.type}: ${node.name}${node.type === 'person' && (node as any).walletAddress ? ' with wallet address' : ''}. You can now send SOL to them using natural language!`, activeNodes);
  };

  // API Key setup handlers
  const handleSetApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter a valid Gemini API key');
      return;
    }
    
    if (!apiKey.startsWith('AIza')) {
      Alert.alert('Invalid API Key', 'Gemini API keys should start with "AIza". Please check your key.');
      return;
    }
    
    try {
      setApiKey(apiKey);
      setShowApiKeyInput(false);
      
      // Attempt to connect with retry
      console.log('🔑 Setting API key and attempting connection...');
      const connected = await liveConnect();
      if (!connected) {
        console.error('❌ Connection failed, showing API key input again');
        Alert.alert(
          'Connection Failed', 
          'Failed to connect to Gemini Live. Please check your API key and internet connection.\n\nIf the issue persists, try:\n1. Generating a new API key\n2. Checking API key permissions\n3. Restarting the app',
          [
            { text: 'Try Again', onPress: () => setShowApiKeyInput(true) },
            { text: 'Skip for Now', style: 'cancel' }
          ]
        );
      }
    } catch (error) {
      console.error('❌ API key setup error:', error);
      Alert.alert(
        'Setup Error', 
        `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or check your API key.`,
        [
          { text: 'Retry', onPress: () => setShowApiKeyInput(true) },
          { text: 'Skip', style: 'cancel' }
        ]
      );
      setShowApiKeyInput(true);
    }
  };

  const renderMessage = (geminiMessage: {id: string, role: 'user' | 'assistant', content: string, timestamp: Date}) => {
    // Convert Gemini message format to our ChatMessage format
    const message: ChatMessage = {
      id: geminiMessage.id,
      type: geminiMessage.role === 'user' ? 'user' : 'ai',
      content: geminiMessage.content,
      timestamp: geminiMessage.timestamp,
    };
    
    const isUser = message.type === 'user';
    const isSystem = message.type === 'system';
    
    return (
      <View
        key={message.id}
        style={{
          marginVertical: 8,
          alignItems: isUser ? 'flex-end' : 'flex-start',
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            maxWidth: '85%',
            backgroundColor: isUser ? '#007AFF' : isSystem ? '#FF3B30' : '#F2F2F7',
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 12,
            ...(isUser && {
              borderBottomRightRadius: 4,
            }),
            ...(!isUser && !isSystem && {
              borderBottomLeftRadius: 4,
            }),
          }}
        >
          <Text
            style={{
              color: isUser || isSystem ? '#FFFFFF' : '#000000',
              fontSize: 16,
              lineHeight: 22,
            }}
          >
            {message.content}
          </Text>
          
          {/* Show metadata for AI messages */}
          {message.metadata?.transaction && (
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.1)' }}>
              <Text style={{ color: '#000000', fontSize: 12, opacity: 0.7 }}>
                Transaction Preview
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={{ color: '#000000', fontSize: 14, fontWeight: '600' }}>
                  {message.metadata.transaction.amount} SOL
                </Text>
                <Text style={{ color: '#000000', fontSize: 14 }}>
                  to {message.metadata.transaction.recipient}
                </Text>
              </View>
            </View>
          )}
        </View>
        
        <Text
          style={{
            fontSize: 12,
            color: '#8E8E93',
            marginTop: 4,
            marginHorizontal: 4,
          }}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  const NodeSelector = () => {
    const nodesWithAddresses = nodes.filter(node => 
      (node.type === 'person' && (node as any).walletAddress) ||
      (node.type === 'community' && (node as any).treasuryAddress) ||
      (node.type === 'event' && (node as any).paymentAddress)
    );
    
    return (
      <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F8F9FA' }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#8E8E93', marginBottom: 8 }}>
          {nodesWithAddresses.length > 0 ? 'Available for AI Transactions:' : 'Quick Access:'}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {nodesWithAddresses.length > 0 ? (
            nodesWithAddresses.map((node) => (
              <TouchableOpacity
                key={node.id}
                onPress={() => selectNode(selectedNode?.id === node.id ? undefined : node)}
                style={{
                  backgroundColor: selectedNode?.id === node.id ? '#007AFF' : '#FFFFFF',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  marginRight: 8,
                  borderWidth: 1,
                  borderColor: selectedNode?.id === node.id ? '#007AFF' : '#E5E5EA',
                }}
              >
                <Text style={{
                  color: selectedNode?.id === node.id ? '#FFFFFF' : '#1C1C1E',
                  fontSize: 12,
                  fontWeight: '500',
                }}>
                  {node.type === 'person' ? '👤' : node.type === 'community' ? '🏛️' : '📅'} {node.name}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: '#8E8E93', fontSize: 12, fontStyle: 'italic', marginRight: 12 }}>
                {nodes.length === 0 
                  ? 'Create people/communities in Manual Mode to enable AI transactions'
                  : 'Add wallet addresses to your nodes in Manual Mode'
                }
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#007AFF',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}
                onPress={() => {
                  sendMessage('How do I set up contacts for AI transactions?', activeNodes);
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '500' }}>
                  How to Set Up
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  const QuickActions = () => (
    <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[
          { title: 'Check Balance', action: 'check my balance' },
          ...(selectedNode ? [{ title: `Send to ${selectedNode.name}`, action: `send 0.1 SOL to ${selectedNode.name}` }] : []),
          { title: 'Get Suggestions', action: 'suggest transactions' },
          { title: 'Show History', action: 'show transaction history' },
          { title: 'Help', action: 'help' },
        ].map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => {
              setInputText(item.action);
              handleSendMessage();
            }}
            style={{
              backgroundColor: '#F2F2F7',
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              marginRight: 8,
            }}
          >
            <Text style={{ color: '#007AFF', fontSize: 14, fontWeight: '500' }}>
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Always show chat interface - commented out wallet connection check
  /*
  if (!connected) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Ionicons name="wallet-outline" size={64} color="#8E8E93" />
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginTop: 16, textAlign: 'center' }}>
          Connect Your Wallet
        </Text>
        <Text style={{ fontSize: 16, color: '#8E8E93', marginTop: 8, textAlign: 'center' }}>
          Connect your wallet to start using AI-powered transactions
        </Text>
      </View>
    );
  }
  */

  // Always show chat interface - commented out API key input screen
  /*
  if (showApiKeyInput) {
    return (
      <KeyboardAvoidingView 
        style={{ flex: 1, backgroundColor: '#FFFFFF' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="key-outline" size={64} color="#007AFF" />
          <Text style={{ fontSize: 24, fontWeight: '600', color: '#1C1C1E', marginTop: 16, textAlign: 'center' }}>
            Setup AI Assistant
          </Text>
          <Text style={{ fontSize: 16, color: '#8E8E93', marginTop: 8, textAlign: 'center', marginBottom: 32 }}>
            Enter your Google Gemini API key to enable AI-powered Solana transactions
          </Text>
          
          <View style={{ width: '100%', maxWidth: 400 }}>
            placeholder="Enter your Gemini API key (AIza...)"
              value={apiKey}
              onChangeText={setApiKeyLocal}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="off"
            />
            
            <TouchableOpacity
              style={{
                backgroundColor: apiKey.trim() ? '#007AFF' : '#E5E5EA',
                borderRadius: 12,
                paddingVertical: 16,
                alignItems: 'center',
                marginBottom: 16,
              }}
              onPress={handleSetApiKey}
              disabled={!apiKey.trim() || isConnecting}
            >
              {isConnecting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ 
                  color: apiKey.trim() ? '#FFFFFF' : '#8E8E93', 
                  fontSize: 16, 
                  fontWeight: '600' 
                }}>
                  Connect
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (!liveConnected) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginTop: 16, textAlign: 'center' }}>
          Connecting to AI Assistant
        </Text>
        <Text style={{ fontSize: 16, color: '#8E8E93', marginTop: 8, textAlign: 'center' }}>
          Please wait while we connect to the AI assistant
        </Text>
        
        <TouchableOpacity
          style={{
            backgroundColor: '#007AFF',
            borderRadius: 12,
            paddingHorizontal: 24,
            paddingVertical: 12,
            marginBottom: 16,
          }}
          onPress={async () => {
            try {
              console.log('🔄 Manual retry connection...');
              await liveConnect();
            } catch (error) {
              Alert.alert('Connection Error', 'Failed to connect. Please check your API key and try again.');
            }
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
            Retry Connection
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{
            backgroundColor: '#F2F2F7',
            borderRadius: 12,
            paddingHorizontal: 24,
            paddingVertical: 12,
          }}
          onPress={() => setShowApiKeyInput(true)}
        >
          <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: '600' }}>
            Change API Key
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
  */

  // Always show main chat interface
  return (
            
            <Text style={{ fontSize: 14, color: '#8E8E93', textAlign: 'center', lineHeight: 20 }}>
              Your API key is stored locally and used only to connect to Google's Gemini AI service.{'\n\n'}
              Get your free API key at: console.cloud.google.com
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (!liveConnected) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Ionicons name="chatbubble-ellipses-outline" size={64} color="#8E8E93" />
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#1C1C1E', marginTop: 16, textAlign: 'center' }}>
          AI Assistant Connecting...
        </Text>
        <Text style={{ fontSize: 16, color: '#8E8E93', marginTop: 8, textAlign: 'center', marginBottom: 32 }}>
          Please wait while we connect to the AI assistant
        </Text>
        
        {/* Manual retry button */}
        <TouchableOpacity
          style={{
            backgroundColor: '#007AFF',
            borderRadius: 12,
            paddingHorizontal: 24,
            paddingVertical: 12,
            marginBottom: 16,
          }}
          onPress={async () => {
            try {
              console.log('🔄 Manual retry connection...');
              await liveConnect();
            } catch (error) {
              Alert.alert('Connection Error', 'Failed to connect. Please check your API key and try again.');
            }
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>
            Retry Connection
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{
            backgroundColor: '#F2F2F7',
            borderRadius: 12,
            paddingHorizontal: 24,
            paddingVertical: 12,
          }}
          onPress={() => setShowApiKeyInput(true)}
        >
          <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: '600' }}>
            Change API Key
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={{ 
        backgroundColor: '#007AFF',
        paddingTop: 60, 
        paddingBottom: 20, 
        paddingHorizontal: 20 
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons name="chatbubble-ellipses" size={28} color="#FFFFFF" />
            </Animated.View>
            <Text style={{ fontSize: 20, fontWeight: '600', color: '#FFFFFF', marginLeft: 12 }}>
              AI Transaction Chat
            </Text>
          </View>
          
          {/* Tool Status & Active Node Indicator */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* Tool count indicator */}
            <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '500' }}>
                🔧 {tools.length}
              </Text>
            </View>
            
            {/* Active Node Indicator */}
            {selectedNode && (
              <View style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                paddingHorizontal: 12, 
                paddingVertical: 6, 
                borderRadius: 12 
              }}>
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>
                  {selectedNode.type === 'person' ? '👤' : selectedNode.type === 'community' ? '🏛️' : '📅'} {selectedNode.name}
                </Text>
              </View>
            )}
            
            {!selectedNode && nodes.length > 0 && (
              <View style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                paddingHorizontal: 12, 
                paddingVertical: 6, 
                borderRadius: 12 
              }}>
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>
                  💡 Select a person/community
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Node Selector */}
      <NodeSelector />

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(renderMessage)}
        
        {/* Loading indicator */}
        {isLoading && (
          <View style={{ marginVertical: 8, alignItems: 'flex-start', paddingHorizontal: 16 }}>
            <View style={{
              backgroundColor: '#F2F2F7',
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomLeftRadius: 4,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={{ color: '#007AFF', fontSize: 16, marginLeft: 8 }}>
                AI is thinking...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Actions */}
      <QuickActions />

      {/* Input Bar */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        backgroundColor: '#FFFFFF',
      }}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask me anything about Solana transactions..."
          style={{
            flex: 1,
            backgroundColor: '#F2F2F7',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            marginRight: 12,
          }}
          multiline
          maxLength={500}
          onSubmitEditing={handleSendMessage}
          editable={!isLoading}
        />
        
        <TouchableOpacity
          onPress={handleSendMessage}
          disabled={!inputText.trim() || isLoading}
          style={{
            backgroundColor: (!inputText.trim() || isLoading) ? '#E5E5EA' : '#007AFF',
            borderRadius: 20,
            padding: 12,
          }}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={(!inputText.trim() || isLoading) ? '#8E8E93' : '#FFFFFF'} 
          />
        </TouchableOpacity>
      </View>

      {/* Floating Action Button for Node Creation */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 100,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#007AFF',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 5,
        }}
        onPress={() => handleCreateNode('person')}
      >
        <Ionicons name="person-add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Node Creation Modal */}
      <Modal
        visible={showCreateNodeModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateNodeModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
          {/* Modal Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#E5E5EA',
            backgroundColor: '#FFFFFF',
          }}>
            <TouchableOpacity onPress={() => setShowCreateNodeModal(false)}>
              <Text style={{ fontSize: 16, color: '#007AFF' }}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={{ fontSize: 18, fontWeight: '600' }}>
              Create {createNodeType === 'person' ? 'Contact' : createNodeType === 'community' ? 'Community' : 'Event'}
            </Text>
            
            <View style={{ width: 60 }} />
          </View>

          {/* Node Type Selector */}
          <View style={{
            flexDirection: 'row',
            marginHorizontal: 20,
            marginVertical: 16,
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            padding: 4,
          }}>
            {(['person', 'community', 'event'] as NodeType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: createNodeType === type ? '#007AFF' : 'transparent',
                }}
                onPress={() => setCreateNodeType(type)}
              >
                <Text style={{
                  textAlign: 'center',
                  color: createNodeType === type ? '#FFFFFF' : '#007AFF',
                  fontWeight: createNodeType === type ? '600' : '400',
                }}>
                  {type === 'person' ? 'Contact' : type === 'community' ? 'Community' : 'Event'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Node Form */}
          <View style={{ flex: 1, paddingHorizontal: 20 }}>
            {createNodeType === 'person' && (
              <PersonNodeForm onSave={handleNodeCreated} />
            )}
            {createNodeType === 'community' && (
              <CommunityNodeForm onSave={handleNodeCreated} />
            )}
            {createNodeType === 'event' && (
              <EventNodeForm onSave={handleNodeCreated} />
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
