import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { PersonNode, CreatePersonNodeData, UpdatePersonNodeData } from '../../../types/nodes';
import { useNodes } from '../../../contexts/NodeContext';

interface PersonNodeFormProps {
  node?: PersonNode;
  onSave?: (node: PersonNode) => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

const relationshipOptions: Array<{ label: string; value: PersonNode['relationship'] }> = [
  { label: 'Friend', value: 'friend' },
  { label: 'Family', value: 'family' },
  { label: 'Colleague', value: 'colleague' },
  { label: 'Business', value: 'business' },
  { label: 'Other', value: 'other' },
];

export const PersonNodeForm: React.FC<PersonNodeFormProps> = ({
  node,
  onSave,
  onCancel,
  isEditing = false
}) => {
  const { createPersonNode, updatePersonNode } = useNodes();
  
  const [formData, setFormData] = useState<CreatePersonNodeData>({
    name: node?.name || '',
    description: node?.description || '',
    walletAddress: node?.walletAddress || '',
    relationship: node?.relationship || 'friend',
    email: node?.email || '',
    phone: node?.phone || '',
    notes: node?.notes || '',
    tags: node?.tags || []
  });
  
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    try {
      setIsSaving(true);
      
      if (isEditing && node) {
        await updatePersonNode(node.id, formData as UpdatePersonNodeData);
        const updatedNode = { ...node, ...formData, updatedAt: new Date() };
        onSave?.(updatedNode as PersonNode);
      } else {
        const newNode = await createPersonNode(formData);
        onSave?.(newNode);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save person node');
      console.error('Error saving person node:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        <Text style={styles.title}>
          {isEditing ? 'Edit Person' : 'Create Person'}
        </Text>

        {/* Name Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Enter person's name"
            placeholderTextColor="#999"
          />
        </View>

        {/* Description Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Brief description"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Wallet Address Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Wallet Address</Text>
          <TextInput
            style={styles.input}
            value={formData.walletAddress}
            onChangeText={(text) => setFormData(prev => ({ ...prev, walletAddress: text }))}
            placeholder="Solana wallet address"
            placeholderTextColor="#999"
            autoCapitalize="none"
          />
        </View>

        {/* Relationship Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Relationship</Text>
          <View style={styles.relationshipContainer}>
            {relationshipOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.relationshipButton,
                  formData.relationship === option.value && styles.relationshipButtonActive
                ]}
                onPress={() => setFormData(prev => ({ ...prev, relationship: option.value }))}
              >
                <Text style={[
                  styles.relationshipButtonText,
                  formData.relationship === option.value && styles.relationshipButtonTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Email Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            placeholder="email@example.com"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Phone Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
            placeholder="Phone number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />
        </View>

        {/* Notes Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
            placeholder="Additional notes"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Tags Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Tags</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={[styles.input, styles.tagInput]}
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Add tag"
              placeholderTextColor="#999"
              onSubmitEditing={addTag}
            />
            <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
              <Text style={styles.addTagButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.tagsContainer}>
            {formData.tags?.map((tag, index) => (
              <TouchableOpacity
                key={index}
                style={styles.tag}
                onPress={() => removeTag(tag)}
              >
                <Text style={styles.tagText}>{tag} ×</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  relationshipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationshipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  relationshipButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  relationshipButtonText: {
    fontSize: 14,
    color: '#333',
  },
  relationshipButtonTextActive: {
    color: '#fff',
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tagInput: {
    flex: 1,
  },
  addTagButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  addTagButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
