import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
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
    <ScrollView className="flex-1 bg-amber-50" keyboardShouldPersistTaps="handled">
      <View className="p-4">
        <Text className="text-2xl font-bold text-amber-900 mb-6 text-center">
          {isEditing ? 'Edit Person' : 'Create Person'}
        </Text>

        {/* Name Field */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-amber-800 mb-2">Name *</Text>
          <TextInput
            className="bg-white border border-amber-300 rounded-lg px-3 py-3 text-amber-900"
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Enter person's name"
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
            placeholder="Brief description"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Wallet Address Field */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-amber-800 mb-2">Wallet Address</Text>
          <TextInput
            className="bg-white border border-amber-300 rounded-lg px-3 py-3 text-amber-900"
            value={formData.walletAddress}
            onChangeText={(text) => setFormData(prev => ({ ...prev, walletAddress: text }))}
            placeholder="Solana wallet address"
            placeholderTextColor="#999"
            autoCapitalize="none"
          />
        </View>

        {/* Relationship Field */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-amber-800 mb-2">Relationship</Text>
          <View className="flex-row flex-wrap gap-2">
            {relationshipOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                className={`px-4 py-2 rounded-full border ${
                  formData.relationship === option.value
                    ? 'bg-orange-500 border-orange-600'
                    : 'bg-white border-amber-300'
                }`}
                onPress={() => setFormData(prev => ({ ...prev, relationship: option.value }))}
              >
                <Text className={`text-sm font-medium ${
                  formData.relationship === option.value
                    ? 'text-white'
                    : 'text-amber-800'
                }`}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Email Field */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-amber-800 mb-2">Email</Text>
          <TextInput
            className="bg-white border border-amber-300 rounded-lg px-3 py-3 text-amber-900"
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
            placeholder="email@example.com"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Phone Field */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-amber-800 mb-2">Phone</Text>
          <TextInput
            className="bg-white border border-amber-300 rounded-lg px-3 py-3 text-amber-900"
            value={formData.phone}
            onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
            placeholder="Phone number"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />
        </View>

        {/* Notes Field */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-amber-800 mb-2">Notes</Text>
          <TextInput
            className="bg-white border border-amber-300 rounded-lg px-3 py-3 text-amber-900 h-24"
            value={formData.notes}
            onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
            placeholder="Additional notes"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
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
