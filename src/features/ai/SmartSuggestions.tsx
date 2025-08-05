import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
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
    <View className="bg-amber-50 py-3 border-t border-amber-200">
      <View className="px-4 mb-3">
        <Text className="text-base font-semibold text-amber-900 mb-1">💡 Smart Suggestions</Text>
        <Text className="text-xs text-amber-700">Based on your active nodes</Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            className="w-45 bg-white rounded-xl p-3 shadow-sm border-l-4"
            style={{ borderLeftColor: CategoryColors[suggestion.category] }}
            onPress={() => onSuggestionPress(suggestion.action)}
            activeOpacity={0.7}
          >
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-lg">
                {CategoryIcons[suggestion.category]}
              </Text>
              <View 
                className="px-1.5 py-0.5 rounded-lg"
                style={{ backgroundColor: CategoryColors[suggestion.category] }}
              >
                <Text className="text-xs text-white font-semibold uppercase">
                  {suggestion.category}
                </Text>
              </View>
            </View>
            
            <Text className="text-sm font-semibold text-amber-900 mb-1 leading-4" numberOfLines={2}>
              {suggestion.title}
            </Text>
            
            <Text className="text-xs text-amber-700 mb-2 leading-4" numberOfLines={2}>
              {suggestion.description}
            </Text>
            
            <View className="bg-amber-100 p-1.5 rounded">
              <Text className="text-xs text-orange-600 italic" numberOfLines={1}>
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
    <View className="p-4 bg-amber-50 border-t border-amber-200">
      <Text className="text-sm font-semibold text-amber-900 mb-3">
        Quick actions for {selectedNode.name}:
      </Text>
      
      <View className="flex-row flex-wrap gap-2">
        {quickPrompts.map((prompt, index) => (
          <TouchableOpacity
            key={index}
            className="flex-1 min-w-48% bg-white p-3 rounded-lg border border-amber-200"
            onPress={() => onActionPress(prompt)}
          >
            <Text className="text-xs text-amber-900 text-center leading-4" numberOfLines={2}>
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
    <View className="p-4 bg-blue-50 border-t border-blue-200">
      <Text className="text-sm font-semibold text-amber-900 mb-3">💬 Continue the conversation:</Text>
      
      {suggestions.map((suggestion, index) => (
        <TouchableOpacity
          key={index}
          className="flex-row justify-between items-center bg-white p-3 rounded-lg mb-2 border-l-3 border-orange-500"
          onPress={() => onSuggestionPress(suggestion)}
        >
          <Text className="flex-1 text-sm text-amber-900">
            {suggestion}
          </Text>
          <Text className="text-sm text-orange-500 font-bold">→</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
