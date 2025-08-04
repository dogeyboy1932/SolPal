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
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useWallet } from '../../contexts/WalletContext';
import { useNodes } from '../../contexts/NodeContext';
import { useGemini } from './GeminiContext';
import { VoiceControls } from '../voice/VoiceControls';

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
    stopListening
  } = useGemini();
  
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showApiKeySection, setShowApiKeySection] = useState(!liveConnected);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Show API key section when not connected
  useEffect(() => {
    setShowApiKeySection(!liveConnected);
  }, [liveConnected]);

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

  const MessageBubble = ({ message, isUser }: { message: any; isUser: boolean }) => (
    <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
      {!isUser && (
        <View style={styles.aiAvatar}>
          <Ionicons name="sparkles" size={16} color="#007AFF" />
        </View>
      )}
      <View style={[styles.messageContent, isUser ? styles.userContent : styles.aiContent]}>
        <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
          {message.content}
        </Text>
        <Text style={[styles.messageTime, isUser ? styles.userTime : styles.aiTime]}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  const SuggestionChip = ({ text, onPress }: { text: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.suggestionChip} onPress={onPress}>
      <Text style={styles.suggestionText}>{text}</Text>
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
    <View style={styles.container}>
      {/* Header with Connection Status and Controls */}
      <LinearGradient
        colors={['#FFFFFF', '#F8F9FA']}
        style={styles.header}
      >
        <View style={styles.connectionStatus}>
          {/* Wallet Status */}
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <View style={styles.statusIndicator}>
                <View style={[styles.statusDot, connected ? styles.connectedDot : styles.disconnectedDot]} />
                <Text style={styles.statusLabel}>Wallet</Text>
              </View>
              {connected && publicKey && (
                <Text style={styles.walletAddress}>
                  {`${publicKey.toString().slice(0, 8)}...${publicKey.toString().slice(-8)}`}
                </Text>
              )}
            </View>
            {connected && (
              <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnectWallet}>
                <Ionicons name="power" size={16} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>

          {/* AI Status */}
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <View style={styles.statusIndicator}>
                <View style={[styles.statusDot, liveConnected ? styles.connectedDot : styles.disconnectedDot]} />
                <Text style={styles.statusLabel}>AI Assistant</Text>
              </View>
            </View>
            {liveConnected && (
              <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnectAI}>
                <Ionicons name="power" size={16} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* API Key Section - Show when not connected */}
        {showApiKeySection && (
          <View style={styles.apiKeySection}>
            <Text style={styles.apiKeyTitle}>Connect AI Assistant</Text>
            <Text style={styles.apiKeySubtitle}>Enter your Gemini API key to enable AI features</Text>
            
            <View style={styles.apiKeyInputContainer}>
              <TextInput
                style={styles.apiKeyInput}
                value={apiKeyInput}
                onChangeText={setApiKeyInput}
                placeholder="Enter your API key"
                placeholderTextColor="#C7C7CC"
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={false}
              />
              
              <TouchableOpacity
                style={[
                  styles.connectButton,
                  !apiKeyInput.trim() && styles.connectButtonDisabled
                ]}
                onPress={handleConnectToAI}
                disabled={!apiKeyInput.trim()}
              >
                <LinearGradient
                  colors={
                    apiKeyInput.trim()
                      ? ['#007AFF', '#0056CC']
                      : ['#C7C7CC', '#A8A8A8']
                  }
                  style={styles.connectGradient}
                >
                  <Ionicons name="sparkles" size={16} color="white" />
                  <Text style={styles.connectButtonText}>Connect</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Main Chat Interface */}
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.length === 0 ? (
            <View style={styles.welcomeContainer}>
              <View style={styles.welcomeIcon}>
                <Ionicons name="sparkles" size={32} color="#007AFF" />
              </View>
              <Text style={styles.welcomeTitle}>AI Solana Assistant</Text>
              <Text style={styles.welcomeMessage}>
                I can help you manage your Solana wallet, send transactions, check balances, and more!
              </Text>
              
              {/* Suggestion Chips */}
              {liveConnected && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>Try asking:</Text>
                  <View style={styles.suggestionsGrid}>
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
            <View style={styles.thinkingContainer}>
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={16} color="#007AFF" />
              </View>
              <Animated.View style={[styles.thinkingBubble, { opacity: pulseAnim }]}>
                <View style={styles.thinkingDots}>
                  <View style={styles.thinkingDot} />
                  <View style={styles.thinkingDot} />
                  <View style={styles.thinkingDot} />
                </View>
              </Animated.View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        {liveConnected && (
          <View style={styles.inputArea}>
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.textInput}
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
                style={[
                  styles.sendButton,
                  (!inputText.trim() || !liveConnected || isLoading) && styles.sendButtonDisabled
                ]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  connectionStatus: {
    gap: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  connectedDot: {
    backgroundColor: '#34C759',
  },
  disconnectedDot: {
    backgroundColor: '#FF3B30',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  walletAddress: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'monospace',
  },
  disconnectButton: {
    padding: 8,
  },
  apiKeySection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  apiKeyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  apiKeySubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  apiKeyInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  apiKeyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#F2F2F7',
  },
  apiKeyInputError: {
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  apiKeyError: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
  },
  connectButton: {
    borderRadius: 8,
  },
  connectButtonDisabled: {
    opacity: 0.5,
  },
  connectGradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  connectButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  welcomeMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  suggestionsContainer: {
    alignSelf: 'stretch',
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 16,
    textAlign: 'center',
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  suggestionText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  messageBubble: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 4,
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  aiBubble: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageContent: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userContent: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  aiContent: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: 'white',
  },
  aiText: {
    color: '#1C1C1E',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  userTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  aiTime: {
    color: '#8E8E93',
  },
  thinkingContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 4,
  },
  thinkingBubble: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  thinkingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  thinkingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C7C7CC',
  },
  inputArea: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#F2F2F7',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
});
