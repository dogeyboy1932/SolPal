import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useGemini } from '../ai/GeminiContext';

export const ChatScreen: React.FC = () => {
  const [message, setMessage] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);
  
  const {
    liveConnected,
    liveConnect,
    liveDisconnect,
    sendMessage,
    setApiKey: setGeminiApiKey,
    messages,
  } = useGemini();

  const handleSetApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter a valid API key');
      return;
    }
    
    setGeminiApiKey(apiKey);
    setShowApiKeyInput(false);
    
    // Attempt to connect
    const connected = await liveConnect();
    if (!connected) {
      Alert.alert('Error', 'Failed to connect to Gemini Live');
      setShowApiKeyInput(true);
    }
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    sendMessage(message);
    setMessage('');
  };

  const handleDisconnect = async () => {
    await liveDisconnect();
    setShowApiKeyInput(true);
    setApiKey('');
  };

  if (showApiKeyInput) {
    return (
      <View style={styles.container}>
        <View style={styles.apiKeyContainer}>
          <Text style={styles.title}>AI Chat Setup</Text>
          <Text style={styles.subtitle}>Enter your Google Gemini API Key</Text>
          
          <TextInput
            style={styles.apiKeyInput}
            placeholder="Enter API Key (AIza...)"
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          <TouchableOpacity style={styles.connectButton} onPress={handleSetApiKey}>
            <Text style={styles.connectButtonText}>Connect to AI</Text>
          </TouchableOpacity>
          
          <Text style={styles.helpText}>
            Get your API key from Google AI Studio:{'\n'}
            https://aistudio.google.com/app/apikey
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Chat</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: liveConnected ? '#4CAF50' : '#F44336' }]} />
          <Text style={styles.statusText}>
            {liveConnected ? 'Connected' : 'Disconnected'}
          </Text>
          {liveConnected && (
            <TouchableOpacity onPress={handleDisconnect} style={styles.disconnectButton}>
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.messagesContainer}>
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageContainer,
              msg.role === 'user' ? styles.userMessage : styles.assistantMessage,
            ]}
          >
            <Text style={styles.messageRole}>{msg.role === 'user' ? 'You' : 'AI'}</Text>
            <Text style={styles.messageText}>{msg.content}</Text>
            <Text style={styles.messageTime}>
              {msg.timestamp.toLocaleTimeString()}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder="Type your message..."
          value={message}
          onChangeText={setMessage}
          multiline
          onSubmitEditing={handleSendMessage}
          editable={liveConnected}
        />
        <TouchableOpacity
          style={[styles.sendButton, !liveConnected && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={!liveConnected}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  apiKeyContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  apiKeyInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  connectButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpText: {
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
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
  },
  disconnectButton: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 4,
  },
  disconnectButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    backgroundColor: '#F0F0F0',
    alignSelf: 'flex-start',
  },
  messageRole: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    color: '#666',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
