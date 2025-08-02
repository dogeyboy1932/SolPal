import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useNodes } from '../../contexts/NodeContext';
import { NodeType, PersonNode, EventNode, CommunityNode } from '../../types/nodes';
import { AICommand } from '../../lib/ai-command-parser';

interface AINodeAssistantProps {
  command?: AICommand;
  onComplete: () => void;
  onCancel: () => void;
}

export const AINodeAssistant: React.FC<AINodeAssistantProps> = ({
  command,
  onComplete,
  onCancel
}) => {
  const { 
    createPersonNode, 
    createEventNode, 
    createCommunityNode,
    updatePersonNode,
    updateEventNode,
    updateCommunityNode,
    nodes 
  } = useNodes();
  
  const [nodeType, setNodeType] = useState<NodeType>(command?.nodeType || 'person');
  const [name, setName] = useState(command?.nodeName || '');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCreateNode = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please provide a name for the node');
      return;
    }

    setIsProcessing(true);

    try {
      if (nodeType === 'person') {
        await createPersonNode({
          name: name.trim(),
          notes: additionalInfo || '',
          tags: []
        });
      } else if (nodeType === 'event') {
        await createEventNode({
          name: name.trim(),
          description: additionalInfo || '',
          date: new Date(),
          eventType: 'other',
          tags: []
        });
      } else if (nodeType === 'community') {
        await createCommunityNode({
          name: name.trim(),
          description: additionalInfo || '',
          communityType: 'other',
          isPublic: true
        });
      }

      Alert.alert(
        'Success', 
        `${nodeType.charAt(0).toUpperCase() + nodeType.slice(1)} "${name}" has been created!`,
        [{ text: 'OK', onPress: onComplete }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create node. Please try again.');
      console.error('Error creating node:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditNode = async () => {
    if (!command?.nodeId) return;

    setIsProcessing(true);

    try {
      if (!command?.nodeId) return;

      // Use the appropriate update method based on node type
      if (command.nodeType === 'person') {
        await updatePersonNode(command.nodeId, {
          name: name.trim(),
          notes: additionalInfo.trim() || undefined
        });
      } else if (command.nodeType === 'event') {
        await updateEventNode(command.nodeId, {
          name: name.trim(),
          description: additionalInfo.trim() || undefined
        });
      } else if (command.nodeType === 'community') {
        await updateCommunityNode(command.nodeId, {
          name: name.trim(),
          description: additionalInfo.trim() || undefined
        });
      }

      Alert.alert(
        'Success', 
        `${(command.nodeType || 'Node').charAt(0).toUpperCase() + (command.nodeType || 'node').slice(1)} has been updated!`,
        [{ text: 'OK', onPress: onComplete }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update node. Please try again.');
      console.error('Error updating node:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlaceholder = () => {
    switch (nodeType) {
      case 'person':
        return 'Tell me about this person (bio, role, interests...)';
      case 'event':
        return 'Describe this event (purpose, details, agenda...)';
      case 'community':
        return 'Describe this community (mission, purpose, focus...)';
      default:
        return 'Additional information...';
    }
  };

  const isEditing = command?.type === 'edit_node';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          🤖 AI {isEditing ? 'Edit' : 'Create'} Assistant
        </Text>
        <Text style={styles.subtitle}>
          {isEditing 
            ? `Editing ${command?.nodeName}`
            : `Let me help you create a new ${nodeType}`
          }
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!isEditing && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Type of Node</Text>
            <View style={styles.nodeTypeSelector}>
              {(['person', 'event', 'community'] as NodeType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.nodeTypeButton,
                    nodeType === type && styles.nodeTypeButtonActive
                  ]}
                  onPress={() => setNodeType(type)}
                >
                  <Text style={styles.nodeTypeIcon}>
                    {type === 'person' ? '👤' : type === 'event' ? '📅' : '🏛️'}
                  </Text>
                  <Text style={[
                    styles.nodeTypeText,
                    nodeType === type && styles.nodeTypeTextActive
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={`Enter ${nodeType} name`}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Details</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={additionalInfo}
            onChangeText={setAdditionalInfo}
            placeholder={getPlaceholder()}
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.aiTips}>
          <Text style={styles.aiTipsTitle}>💡 AI Tips</Text>
          <Text style={styles.aiTipsText}>
            {isEditing
              ? `I'll update the existing ${command?.nodeType} with any new information you provide. Leave fields empty to keep current values.`
              : `I'll create a new ${nodeType} with the information you provide. You can always edit more details later using the full form.`
            }
          </Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isProcessing}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.createButton,
            (!name.trim() || isProcessing) && styles.createButtonDisabled
          ]}
          onPress={isEditing ? handleEditNode : handleCreateNode}
          disabled={!name.trim() || isProcessing}
        >
          <Text style={styles.createButtonText}>
            {isProcessing 
              ? '⏳ Processing...' 
              : isEditing 
                ? '✏️ Update' 
                : '✨ Create'
            }
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  nodeTypeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  nodeTypeButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  nodeTypeButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  nodeTypeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  nodeTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  nodeTypeTextActive: {
    color: '#007AFF',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  aiTips: {
    backgroundColor: '#e8f4f8',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  aiTipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  aiTipsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  createButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#ccc',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
