import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { CommunityNode, CreateCommunityNodeData, UpdateCommunityNodeData } from '../../types/nodes';
import { useNodes } from '../../contexts/NodeContext';

interface CommunityNodeFormProps {
  node?: CommunityNode;
  onSave?: (node: CommunityNode) => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

const communityTypeOptions: Array<{ label: string; value: CommunityNode['communityType'] }> = [
  { label: 'DAO', value: 'dao' },
  { label: 'NFT', value: 'nft' },
  { label: 'Social', value: 'social' },
  { label: 'Gaming', value: 'gaming' },
  { label: 'DeFi', value: 'defi' },
  { label: 'Business', value: 'business' },
  { label: 'Other', value: 'other' },
];

export const CommunityNodeForm: React.FC<CommunityNodeFormProps> = ({
  node,
  onSave,
  onCancel,
  isEditing = false
}) => {
  const { createCommunityNode, updateCommunityNode } = useNodes();
  
  const [formData, setFormData] = useState<CreateCommunityNodeData>({
    name: node?.name || '',
    description: node?.description || '',
    communityType: node?.communityType || 'social',
    isPublic: node?.isPublic ?? true,
    joinRequirements: node?.joinRequirements || '',
    governanceToken: node?.governanceToken || '',
    nftCollection: node?.nftCollection || '',
    website: node?.website || '',
    discord: node?.discord || '',
    twitter: node?.twitter || '',
    tags: node?.tags || []
  });
  
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Community name is required');
      return;
    }

    try {
      setIsSaving(true);
      
      if (isEditing && node) {
        await updateCommunityNode(node.id, formData as UpdateCommunityNodeData);
        const updatedNode = { ...node, ...formData, updatedAt: new Date() };
        onSave?.(updatedNode as CommunityNode);
      } else {
        const newNode = await createCommunityNode(formData);
        onSave?.(newNode);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save community node');
      console.error('Error saving community node:', error);
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
          {isEditing ? 'Edit Community' : 'Create Community'}
        </Text>

        {/* Name Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Community Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Enter community name"
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
            placeholder="Community description"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Community Type Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Community Type</Text>
          <View style={styles.typeContainer}>
            {communityTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.typeButton,
                  formData.communityType === option.value && styles.typeButtonActive
                ]}
                onPress={() => setFormData(prev => ({ ...prev, communityType: option.value }))}
              >
                <Text style={[
                  styles.typeButtonText,
                  formData.communityType === option.value && styles.typeButtonTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Public/Private Toggle */}
        <View style={styles.fieldContainer}>
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Public Community</Text>
            <Switch
              value={formData.isPublic}
              onValueChange={(value) => setFormData(prev => ({ ...prev, isPublic: value }))}
              trackColor={{ false: '#ddd', true: '#007AFF' }}
              thumbColor={formData.isPublic ? '#fff' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.helpText}>
            {formData.isPublic ? 'Anyone can join this community' : 'Invite-only community'}
          </Text>
        </View>

        {/* Join Requirements Field */}
        {!formData.isPublic && (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Join Requirements</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.joinRequirements}
              onChangeText={(text) => setFormData(prev => ({ ...prev, joinRequirements: text }))}
              placeholder="Requirements to join this community"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>
        )}

        {/* Governance Token Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Governance Token</Text>
          <TextInput
            style={styles.input}
            value={formData.governanceToken}
            onChangeText={(text) => setFormData(prev => ({ ...prev, governanceToken: text }))}
            placeholder="Token mint address"
            placeholderTextColor="#999"
            autoCapitalize="none"
          />
        </View>

        {/* NFT Collection Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>NFT Collection</Text>
          <TextInput
            style={styles.input}
            value={formData.nftCollection}
            onChangeText={(text) => setFormData(prev => ({ ...prev, nftCollection: text }))}
            placeholder="NFT collection address"
            placeholderTextColor="#999"
            autoCapitalize="none"
          />
        </View>

        {/* Website Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Website</Text>
          <TextInput
            style={styles.input}
            value={formData.website}
            onChangeText={(text) => setFormData(prev => ({ ...prev, website: text }))}
            placeholder="https://example.com"
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        {/* Discord Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Discord</Text>
          <TextInput
            style={styles.input}
            value={formData.discord}
            onChangeText={(text) => setFormData(prev => ({ ...prev, discord: text }))}
            placeholder="Discord server invite or URL"
            placeholderTextColor="#999"
            autoCapitalize="none"
          />
        </View>

        {/* Twitter Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Twitter</Text>
          <TextInput
            style={styles.input}
            value={formData.twitter}
            onChangeText={(text) => setFormData(prev => ({ ...prev, twitter: text }))}
            placeholder="@username or URL"
            placeholderTextColor="#999"
            autoCapitalize="none"
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
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    backgroundColor: '#9c27b0',
    borderColor: '#9c27b0',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#333',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
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
    backgroundColor: '#9c27b0',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
