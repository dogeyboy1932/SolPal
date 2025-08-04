import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Node } from '../../types/nodes';
import { generateNodeSpecificPrompts, generateSmartSuggestions } from '../../services/chat-prompts';

interface SmartSuggestionsProps {
  activeNodes: Node[];
  onSuggestionPress: (suggestion: string) => void;
  visible?: boolean;
}

const CategoryColors = {
  transaction: '#007AFF',
  event: '#28a745',
  community: '#9c27b0',
  social: '#ff9500'
};

const CategoryIcons = {
  transaction: '💰',
  event: '📅',
  community: '🏛️',
  social: '👥'
};

export const SmartSuggestionsPanel: React.FC<SmartSuggestionsProps> = ({
  activeNodes,
  onSuggestionPress,
  visible = true
}) => {
  if (!visible || activeNodes.length === 0) {
    return null;
  }

  const suggestions = generateSmartSuggestions(activeNodes);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💡 Smart Suggestions</Text>
        <Text style={styles.subtitle}>Based on your active nodes</Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.suggestionsContainer}
      >
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.suggestionCard,
              { borderLeftColor: CategoryColors[suggestion.category] }
            ]}
            onPress={() => onSuggestionPress(suggestion.action)}
            activeOpacity={0.7}
          >
            <View style={styles.suggestionHeader}>
              <Text style={styles.suggestionIcon}>
                {CategoryIcons[suggestion.category]}
              </Text>
              <View style={[
                styles.categoryBadge,
                { backgroundColor: CategoryColors[suggestion.category] }
              ]}>
                <Text style={styles.categoryText}>
                  {suggestion.category}
                </Text>
              </View>
            </View>
            
            <Text style={styles.suggestionTitle} numberOfLines={2}>
              {suggestion.title}
            </Text>
            
            <Text style={styles.suggestionDescription} numberOfLines={2}>
              {suggestion.description}
            </Text>
            
            <View style={styles.actionPreview}>
              <Text style={styles.actionText} numberOfLines={1}>
                "{suggestion.action}"
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

interface QuickActionsProps {
  selectedNode?: Node;
  onActionPress: (action: string) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  selectedNode,
  onActionPress
}) => {
  if (!selectedNode) {
    return null;
  }

  const prompts = generateNodeSpecificPrompts(selectedNode);
  const quickPrompts = prompts.slice(0, 4); // Show only first 4 for quick actions

  return (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.quickActionsTitle}>
        Quick actions for {selectedNode.name}:
      </Text>
      
      <View style={styles.quickActionsGrid}>
        {quickPrompts.map((prompt, index) => (
          <TouchableOpacity
            key={index}
            style={styles.quickActionButton}
            onPress={() => onActionPress(prompt)}
          >
            <Text style={styles.quickActionText} numberOfLines={2}>
              {prompt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

interface ConversationSuggestionsProps {
  activeNodes: Node[];
  lastMessage?: string;
  onSuggestionPress: (suggestion: string) => void;
}

export const ConversationSuggestions: React.FC<ConversationSuggestionsProps> = ({
  activeNodes,
  lastMessage,
  onSuggestionPress
}) => {
  // Generate contextual follow-up suggestions based on the last message
  const generateFollowUpSuggestions = (): string[] => {
    if (!lastMessage) return [];

    const lowerMessage = lastMessage.toLowerCase();
    const suggestions: string[] = [];

    // Transaction-related follow-ups
    if (lowerMessage.includes('send') || lowerMessage.includes('transfer')) {
      suggestions.push('How much should I send?');
      suggestions.push('Check my wallet balance first');
      suggestions.push('What are the transaction fees?');
    }

    // Event-related follow-ups
    if (lowerMessage.includes('event') || lowerMessage.includes('meeting')) {
      suggestions.push('Who should I invite?');
      suggestions.push('Set a reminder for this event');
      suggestions.push('Check my calendar for conflicts');
    }

    // Community-related follow-ups
    if (lowerMessage.includes('community') || lowerMessage.includes('dao')) {
      suggestions.push('Show me recent proposals');
      suggestions.push('Check treasury balance');
      suggestions.push('Who are the active members?');
    }

    // General context-based suggestions
    if (activeNodes.length > 0) {
      suggestions.push('What else can I do with my active nodes?');
      suggestions.push('Show me more options');
    }

    return suggestions.slice(0, 3); // Limit to 3 suggestions
  };

  const suggestions = generateFollowUpSuggestions();

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <View style={styles.conversationSuggestionsContainer}>
      <Text style={styles.conversationSuggestionsTitle}>💬 Continue the conversation:</Text>
      
      {suggestions.map((suggestion, index) => (
        <TouchableOpacity
          key={index}
          style={styles.conversationSuggestionButton}
          onPress={() => onSuggestionPress(suggestion)}
        >
          <Text style={styles.conversationSuggestionText}>
            {suggestion}
          </Text>
          <Text style={styles.conversationSuggestionArrow}>→</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  suggestionsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  suggestionCard: {
    width: 180,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionIcon: {
    fontSize: 20,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },
  suggestionDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    lineHeight: 16,
  },
  actionPreview: {
    backgroundColor: '#f5f5f5',
    padding: 6,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 11,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  quickActionsContainer: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    lineHeight: 16,
  },
  conversationSuggestionsContainer: {
    padding: 16,
    backgroundColor: '#f0f8ff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  conversationSuggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  conversationSuggestionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  conversationSuggestionText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  conversationSuggestionArrow: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});
