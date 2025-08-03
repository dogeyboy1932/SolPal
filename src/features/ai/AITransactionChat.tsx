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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '../../contexts/WalletContext';
import { useNodes } from '../../contexts/NodeContext';
import { useGemini } from './GeminiContext';
import { WalletConnectButton } from '../wallet/WalletConnectButton';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
}

export default function AITransactionChat() {
  const { connected, publicKey } = useWallet();
  const { sendMessage, messages, liveConnected, tools, setApiKey, liveConnect, liveDisconnect } = useGemini();
  
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [toolExecutionStatus, setToolExecutionStatus] = useState<string>('');
  const [lastError, setLastError] = useState<string>('');
  const [lastSuccess, setLastSuccess] = useState<string>('');
  
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Validate Gemini API key format
  const isValidApiKey = (key: string): boolean => {
    return key.length === 39 && key.startsWith('AIzaSy');
  };

  // Set API key in Gemini context
  const handleSetApiKey = async () => {
    if (!isValidApiKey(apiKeyInput.trim())) {
      showAlert('Invalid API Key', 'Please enter a valid Gemini API key. It should start with "AIzaSy" and be 39 characters long.', [{ text: 'OK' }]);
      return;
    }

    try {
      setApiKey(apiKeyInput.trim());
      setIsApiKeySet(true);
      console.log('✅ API key set successfully');
    } catch (error) {
      console.error('❌ Failed to set API key:', error);
      showAlert('Error', 'Failed to set API key. Please try again.', [{ text: 'OK' }]);
    }
  };

  // Cross-platform alert function
  const showAlert = (title: string, message: string, buttons: Array<{text: string, onPress?: () => void, style?: 'default' | 'cancel' | 'destructive'}>) => {
    if (Platform.OS === 'web') {
      // Web implementation using window.confirm
      const confirmMessage = `${title}\n\n${message}`;
      const result = window.confirm(confirmMessage);
      
      // Find the appropriate button to execute
      if (result) {
        // User clicked OK - execute the non-cancel button
        const actionButton = buttons.find(btn => btn.style !== 'cancel');
        if (actionButton && actionButton.onPress) {
          actionButton.onPress();
        }
      } else {
        // User clicked Cancel - execute cancel button if exists
        const cancelButton = buttons.find(btn => btn.style === 'cancel');
        if (cancelButton && cancelButton.onPress) {
          cancelButton.onPress();
        }
      }
    } else {
      // Mobile implementation using Alert.alert
      Alert.alert(title, message, buttons);
    }
  };

  // Connect to Gemini Live when user clicks connect button
  const handleConnectWithApiKey = async () => {
    if (!isApiKeySet) {
      return; // Silent fail - button should be disabled anyway
    }

    setIsLoading(true);
    try {
      // Connect to Gemini Live (API key should already be set)
      const success = await liveConnect();
      if (success) {
        console.log('✅ Connected to Gemini Live');
      } else {
        console.log('⚠️ Failed to connect to Gemini Live');
        showAlert('Connection Failed', 'Could not connect to Gemini. Please check your internet connection and try again.', [{ text: 'OK' }]);
      }
    } catch (error) {
      console.error('❌ Connection error:', error);
      showAlert('Connection Error', 'An error occurred while connecting. Please try again.', [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
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
    if (!inputText.trim()) return;

    // Clear previous status messages
    setLastError('');
    setLastSuccess('');
    setToolExecutionStatus('');
    
    setIsLoading(true);
    try {
      // Show tool execution status
      setToolExecutionStatus('Processing message...');
      
      await sendMessage(inputText.trim());
      setInputText('');
      
      // Show success
      setLastSuccess('Message sent successfully');
      setToolExecutionStatus('');
      
      // Auto-clear success message
      setTimeout(() => setLastSuccess(''), 3000);
      
      // Focus back to input and scroll to bottom
      setTimeout(() => {
        inputRef.current?.focus();
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message. Please try again.';
      setLastError(errorMessage);
      setToolExecutionStatus('');
      
      // Auto-clear error message
      setTimeout(() => setLastError(''), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine placeholder text based on connection status
  const getPlaceholderText = () => {
    return connected ? "Ask me anything about Solana..." : "Connect wallet to enable transactions";
  };

  // Always show main chat interface
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
          
          {/* Status Indicators */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Connection Status */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
              {liveConnected ? (
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              ) : (
                <Ionicons name="time" size={20} color="#FFA726" />
              )}
            </View>
            
            {/* Tools Indicator */}
            <View style={{ 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              borderRadius: 12, 
              paddingHorizontal: 8, 
              paddingVertical: 4,
              marginRight: 8
            }}>
              <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>
                {tools.length} tools
              </Text>
            </View>
            
            {/* Disconnect Button */}
            {liveConnected && (
              <TouchableOpacity
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  borderRadius: 12,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                }}
                onPress={() => {
                  showAlert(
                    'Disconnect AI',
                    'Are you sure you want to disconnect from Gemini AI?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Disconnect', style: 'destructive', onPress: async () => {
                        try {
                          await liveDisconnect();
                        } catch (error) {
                          console.error('Error disconnecting AI:', error);
                          showAlert('Error', 'Failed to disconnect from AI', [{ text: 'OK' }]);
                        }
                      }}
                    ]
                  );
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '500' }}>
                  Disconnect
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* API Key Input Section */}
      <View style={{ 
        backgroundColor: '#2A2A2A', 
        padding: 16, 
        marginHorizontal: 12,
        marginVertical: 8,
        borderRadius: 8 
      }}>
        <Text style={{ color: 'white', marginBottom: 8, fontSize: 14, fontWeight: '500' }}>
          Gemini API Key
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            style={{
              flex: 1,
              backgroundColor: '#1A1A1A',
              color: 'white',
              padding: 12,
              borderRadius: 6,
              marginRight: 8,
              fontSize: 14
            }}
            placeholder="Enter your Gemini API key"
            placeholderTextColor="#666"
            value={apiKeyInput}
            onChangeText={(text) => {
              setApiKeyInput(text);
              // Reset API key set status when user changes the input
              if (isApiKeySet) {
                setIsApiKeySet(false);
              }
            }}
            secureTextEntry={true}
            editable={!liveConnected}
          />
          
          {/* Set API Key Button */}
          {!isApiKeySet && (
            <TouchableOpacity
              style={{
                backgroundColor: isValidApiKey(apiKeyInput) ? '#2196F3' : '#666',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 6,
                marginRight: 8,
                opacity: isValidApiKey(apiKeyInput) ? 1 : 0.5
              }}
              onPress={handleSetApiKey}
              disabled={!isValidApiKey(apiKeyInput) || liveConnected}
            >
              <Text style={{ color: 'white', fontWeight: '500' }}>
                Set
              </Text>
            </TouchableOpacity>
          )}

          {/* API Key Set Status */}
          {isApiKeySet && !liveConnected && (
            <View style={{
              backgroundColor: '#388E3C',
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 6,
              marginRight: 8,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <Ionicons name="checkmark-circle" size={16} color="white" style={{ marginRight: 4 }} />
              <Text style={{ color: 'white', fontWeight: '500', fontSize: 12 }}>
                Key Set
              </Text>
            </View>
          )}

          {/* Connect Button */}
          <TouchableOpacity
            style={{
              backgroundColor: (isApiKeySet && !liveConnected) ? '#4CAF50' : '#666',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 6,
              opacity: (isApiKeySet && !liveConnected) ? 1 : 0.5
            }}
            onPress={handleConnectWithApiKey}
            disabled={!isApiKeySet || liveConnected || isLoading}
          >
            {liveConnected ? (
              <Text style={{ color: 'white', fontWeight: '500' }}>
                Connected
              </Text>
            ) : (
              <Text style={{ color: 'white', fontWeight: '500' }}>
                {isLoading ? 'Connecting...' : 'Connect'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Connection Status */}
        {liveConnected && (
          <View style={{
            backgroundColor: '#1B5E20',
            padding: 8,
            borderRadius: 6,
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 8
          }}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" style={{ marginRight: 8 }} />
            <Text style={{ color: '#4CAF50', fontWeight: '500', fontSize: 12 }}>
              Connected to Gemini Live with {tools.length} tools
            </Text>
          </View>
        )}
      </View>

      {/* Messages */}
      <ScrollView 
        ref={scrollViewRef}
        style={{ flex: 1, backgroundColor: '#F2F2F7' }}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={{
              alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: message.role === 'user' ? '#007AFF' : '#FFFFFF',
              borderRadius: 18,
              paddingHorizontal: 16,
              paddingVertical: 12,
              marginVertical: 4,
              maxWidth: '85%',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <Text
              style={{
                color: message.role === 'user' ? '#FFFFFF' : '#1C1C1E',
                fontSize: 16,
                lineHeight: 22,
              }}
            >
              {message.content}
            </Text>
            <Text
              style={{
                color: message.role === 'user' ? 'rgba(255,255,255,0.7)' : '#8E8E93',
                fontSize: 12,
                marginTop: 4,
              }}
            >
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ))}
        
        {/* AI Thinking Indicator */}
        {isLoading && (
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: '#FFFFFF',
              borderRadius: 18,
              paddingHorizontal: 16,
              paddingVertical: 12,
              marginVertical: 4,
              maxWidth: '85%',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#007AFF" style={{ marginRight: 8 }} />
              <Text style={{ color: '#8E8E93', fontSize: 16 }}>
                {toolExecutionStatus || 'AI is thinking...'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>




      {/* Status Messages */}
      {(!!lastError || !!lastSuccess || (!!toolExecutionStatus && !isLoading)) && (
        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          {lastError && (
            <View style={{ 
              backgroundColor: '#FFEBEE', 
              borderColor: '#FFCDD2', 
              borderWidth: 1, 
              borderRadius: 8,
              padding: 12,
              marginBottom: 4
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="alert-circle" size={20} color="#D32F2F" />
                <Text style={{ color: '#C62828', fontSize: 14, marginLeft: 8, flex: 1 }}>
                  {lastError}
                </Text>
              </View>
            </View>
          )}
          
          {lastSuccess && (
            <View style={{ 
              backgroundColor: '#E8F5E8', 
              borderColor: '#C8E6C9', 
              borderWidth: 1, 
              borderRadius: 8,
              padding: 12,
              marginBottom: 4
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="checkmark-circle" size={20} color="#388E3C" />
                <Text style={{ color: '#2E7D32', fontSize: 14, marginLeft: 8, flex: 1 }}>
                  {lastSuccess}
                </Text>
              </View>
            </View>
          )}
          
          {toolExecutionStatus && !isLoading && (
            <View style={{ 
              backgroundColor: '#E3F2FD', 
              borderColor: '#BBDEFB', 
              borderWidth: 1, 
              borderRadius: 8,
              padding: 12,
              marginBottom: 4
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#1976D2" style={{ marginRight: 8 }} />
                <Text style={{ color: '#1565C0', fontSize: 14, flex: 1 }}>
                  {toolExecutionStatus}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Connection Status Banner */}
      {!connected && (
        <View style={{ 
          backgroundColor: '#FFF3CD', 
          borderColor: '#FFEAA7', 
          borderWidth: 1, 
          padding: 12, 
          marginHorizontal: 16 
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="warning" size={20} color="#B86100" />
            <Text style={{ color: '#856404', fontSize: 14, marginLeft: 8, flex: 1 }}>
              Wallet not connected. Connect wallet to access transaction tools.
            </Text>
          </View>
        </View>
      )}

      {/* Input Area */}
      <View style={{ 
        backgroundColor: '#FFFFFF', 
        borderTopWidth: 1, 
        borderTopColor: '#E5E5EA',
        paddingTop: 12,
        paddingBottom: 12,
        paddingHorizontal: 16
      }}>
        {/* Text Input */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <TextInput
            ref={inputRef}
            style={{
              flex: 1,
              backgroundColor: '#F2F2F7',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 12,
              fontSize: 16,
              maxHeight: 100,
              marginRight: 8,
              borderWidth: 2,
              borderColor: '#E5E5EA',
            }}
            placeholder={getPlaceholderText()}
            placeholderTextColor="#8E8E93"
            value={inputText}
            onChangeText={(text) => {
              setInputText(text);
              // Clear error when user starts typing
              if (lastError) setLastError('');
            }}
            multiline
            onSubmitEditing={(event) => {
              // For multiline inputs, onSubmitEditing is triggered by Enter key
              // But we want to send on Enter, not create new line
              if (inputText.trim()) {
                handleSendMessage();
              }
            }}
            blurOnSubmit={false}
            returnKeyType="send"
            enablesReturnKeyAutomatically={true}
            editable={!isLoading}
            onFocus={() => {
              // Clear status messages when focusing input
              setLastError('');
              setLastSuccess('');
            }}
          />
          
          <TouchableOpacity
            style={{
              backgroundColor: inputText.trim() ? '#007AFF' : '#E5E5EA',
              borderRadius: 20,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={handleSendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={inputText.trim() ? '#FFFFFF' : '#8E8E93'} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}