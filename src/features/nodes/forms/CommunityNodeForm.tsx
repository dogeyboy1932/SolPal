import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { CommunityNode, CreateCommunityNodeData, UpdateCommunityNodeData } from '../../../types/nodes';
import { useNodes } from '../../../contexts/NodeContext';

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
    <ScrollView className="flex-1 bg-amber-50" keyboardShouldPersistTaps="handled">
      <View className="p-4">
        <Text className="text-2xl font-bold text-amber-900 mb-6 text-center">
          {isEditing ? 'Edit Community' : 'Create Community'}
        </Text>

        {/* Name Field */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-amber-800 mb-2">Community Name *</Text>
          <TextInput
            className="bg-white border border-amber-300 rounded-lg px-3 py-3 text-amber-900"
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Enter community name"
            placeholderTextColor="#999"
          />
        </View>

        {/* Description Field */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-amber-800 mb-2">Description</Text>
          <TextInput
            className="bg-white border border-amber-300 rounded-lg px-3 py-3 text-amber-900 h-20"
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Community description"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Community Type Field */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-amber-800 mb-2">Community Type</Text>
          <View className="flex-row flex-wrap gap-2">
            {communityTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                className={`px-4 py-2 rounded-full border ${
                  formData.communityType === option.value
                    ? 'bg-orange-500 border-orange-600'
                    : 'bg-white border-amber-300'
                }`}
                onPress={() => setFormData(prev => ({ ...prev, communityType: option.value }))}
              >
                <Text className={`text-sm font-medium ${
                  formData.communityType === option.value
                    ? 'text-white'
                    : 'text-amber-800'
                }`}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Public/Private Toggle */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-base font-semibold text-amber-800">Public Community</Text>
            <Switch
              value={formData.isPublic}
              onValueChange={(value) => setFormData(prev => ({ ...prev, isPublic: value }))}
              trackColor={{ false: '#ddd', true: '#E49B3F' }}
              thumbColor={formData.isPublic ? '#fff' : '#f4f3f4'}
            />
          </View>
          <Text className="text-sm text-amber-600">
            {formData.isPublic ? 'Anyone can join this community' : 'Invite-only community'}
          </Text>
        </View>

        {/* Join Requirements Field */}
        {!formData.isPublic && (
          <View className="mb-4">
            <Text className="text-base font-semibold text-amber-800 mb-2">Join Requirements</Text>
            <TextInput
              className="bg-white border border-amber-300 rounded-lg px-3 py-3 text-amber-900 h-20"
              value={formData.joinRequirements}
              onChangeText={(text) => setFormData(prev => ({ ...prev, joinRequirements: text }))}
              placeholder="Requirements to join this community"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        )}

        {/* Governance Token Field */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-amber-800 mb-2">Governance Token</Text>
          <TextInput
            className="bg-white border border-amber-300 rounded-lg px-3 py-3 text-amber-900"
            value={formData.governanceToken}
            onChangeText={(text) => setFormData(prev => ({ ...prev, governanceToken: text }))}
            placeholder="Token mint address"
            placeholderTextColor="#999"
            autoCapitalize="none"
          />
        </View>

        {/* NFT Collection Field */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-amber-800 mb-2">NFT Collection</Text>
          <TextInput
            className="bg-white border border-amber-300 rounded-lg px-3 py-3 text-amber-900"
            value={formData.nftCollection}
            onChangeText={(text) => setFormData(prev => ({ ...prev, nftCollection: text }))}
            placeholder="NFT collection address"
            placeholderTextColor="#999"
            autoCapitalize="none"
          />
        </View>

        {/* Website Field */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-amber-800 mb-2">Website</Text>
          <TextInput
            className="bg-white border border-amber-300 rounded-lg px-3 py-3 text-amber-900"
            value={formData.website}
            onChangeText={(text) => setFormData(prev => ({ ...prev, website: text }))}
            placeholder="https://example.com"
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        {/* Discord Field */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-amber-800 mb-2">Discord</Text>
          <TextInput
            className="bg-white border border-amber-300 rounded-lg px-3 py-3 text-amber-900"
            value={formData.discord}
            onChangeText={(text) => setFormData(prev => ({ ...prev, discord: text }))}
            placeholder="Discord server invite or URL"
            placeholderTextColor="#999"
            autoCapitalize="none"
          />
        </View>

        {/* Twitter Field */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-amber-800 mb-2">Twitter</Text>
          <TextInput
            className="bg-white border border-amber-300 rounded-lg px-3 py-3 text-amber-900"
            value={formData.twitter}
            onChangeText={(text) => setFormData(prev => ({ ...prev, twitter: text }))}
            placeholder="@username or URL"
            placeholderTextColor="#999"
            autoCapitalize="none"
          />
        </View>

        {/* Tags Field */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-amber-800 mb-2">Tags</Text>
          <View className="flex-row gap-2 mb-2">
            <TextInput
              className="flex-1 bg-white border border-amber-300 rounded-lg px-3 py-2 text-amber-900"
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Add tag"
              placeholderTextColor="#999"
              onSubmitEditing={addTag}
            />
            <TouchableOpacity 
              className="bg-orange-500 px-4 py-2 rounded-lg justify-center" 
              onPress={addTag}
            >
              <Text className="text-white font-medium">Add</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {formData.tags?.map((tag, index) => (
              <TouchableOpacity
                key={index}
                className="bg-amber-100 border border-amber-300 rounded-full px-3 py-1"
                onPress={() => removeTag(tag)}
              >
                <Text className="text-amber-800 text-sm">{tag} ×</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 mt-6">
          <TouchableOpacity
            className="flex-1 bg-gray-100 border border-gray-300 rounded-lg py-3 items-center"
            onPress={onCancel}
          >
            <Text className="text-gray-700 font-semibold text-base">Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className={`flex-1 rounded-lg py-3 items-center ${
              isSaving ? 'bg-orange-300' : 'bg-orange-500'
            }`}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text className="text-white font-semibold text-base">
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};
