import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { EventNode, CreateEventNodeData, UpdateEventNodeData } from '../../../types/nodes';
import { useNodes } from '../../../contexts/NodeContext';

interface EventNodeFormProps {
  node?: EventNode;
  onSave?: (node: EventNode) => void;
  onCancel?: () => void;
  isEditing?: boolean;
}

const eventTypeOptions: Array<{ label: string; value: EventNode['eventType'] }> = [
  { label: 'Conference', value: 'conference' },
  { label: 'Meetup', value: 'meetup' },
  { label: 'Party', value: 'party' },
  { label: 'Business', value: 'business' },
  { label: 'Social', value: 'social' },
  { label: 'Other', value: 'other' },
];

const formatDateForInput = (date: Date): string => {
  return date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm format
};

const parseInputDate = (dateString: string): Date => {
  return new Date(dateString);
};

export const EventNodeForm: React.FC<EventNodeFormProps> = ({
  node,
  onSave,
  onCancel,
  isEditing = false
}) => {
  const { createEventNode, updateEventNode } = useNodes();
  
  const [formData, setFormData] = useState<CreateEventNodeData>({
    name: node?.name || '',
    description: node?.description || '',
    date: node?.date || new Date(),
    endDate: node?.endDate,
    location: node?.location || '',
    eventType: node?.eventType || 'meetup',
    organizer: node?.organizer || '',
    ticketPrice: node?.ticketPrice,
    maxAttendees: node?.maxAttendees,
    requirements: node?.requirements || '',
    tags: node?.tags || []
  });
  
  const [dateString, setDateString] = useState(
    formatDateForInput(formData.date)
  );
  const [endDateString, setEndDateString] = useState(
    formData.endDate ? formatDateForInput(formData.endDate) : ''
  );
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleDateChange = (dateStr: string) => {
    setDateString(dateStr);
    if (dateStr) {
      setFormData(prev => ({ ...prev, date: parseInputDate(dateStr) }));
    }
  };

  const handleEndDateChange = (dateStr: string) => {
    setEndDateString(dateStr);
    setFormData(prev => ({
      ...prev,
      endDate: dateStr ? parseInputDate(dateStr) : undefined
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Event name is required');
      return;
    }

    if (!dateString) {
      Alert.alert('Error', 'Event date is required');
      return;
    }

    try {
      setIsSaving(true);
      
      if (isEditing && node) {
        await updateEventNode(node.id, formData as UpdateEventNodeData);
        const updatedNode = { ...node, ...formData, updatedAt: new Date() };
        onSave?.(updatedNode as EventNode);
      } else {
        const newNode = await createEventNode(formData);
        onSave?.(newNode);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save event node');
      console.error('Error saving event node:', error);
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
          {isEditing ? 'Edit Event' : 'Create Event'}
        </Text>

        {/* Name Field */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-amber-800 mb-2">Event Name *</Text>
          <TextInput
            className="bg-white border border-amber-300 rounded-lg px-3 py-3 text-amber-900"
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Enter event name"
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
            placeholder="Event description"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Event Type Field */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-amber-800 mb-2">Event Type</Text>
          <View className="flex-row flex-wrap gap-2">
            {eventTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                className={`px-4 py-2 rounded-full border ${
                  formData.eventType === option.value
                    ? 'bg-orange-500 border-orange-600'
                    : 'bg-white border-amber-300'
                }`}
                onPress={() => setFormData(prev => ({ ...prev, eventType: option.value }))}
              >
                <Text className={`text-sm font-medium ${
                  formData.eventType === option.value
                    ? 'text-white'
                    : 'text-amber-800'
                }`}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date Field */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-amber-800 mb-2">Start Date & Time *</Text>
          <TextInput
            className="bg-white border border-amber-300 rounded-lg px-3 py-3 text-amber-900"
            value={dateString}
            onChangeText={handleDateChange}
            placeholder="YYYY-MM-DDTHH:mm"
            placeholderTextColor="#999"
          />
        </View>

        {/* End Date Field */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-amber-800 mb-2">End Date & Time</Text>
          <TextInput
            className="bg-white border border-amber-300 rounded-lg px-3 py-3 text-amber-900"
            value={endDateString}
            onChangeText={handleEndDateChange}
            placeholder="YYYY-MM-DDTHH:mm (optional)"
            placeholderTextColor="#999"
          />
        </View>

        {/* Location Field */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-amber-800 mb-2">Location</Text>
          <TextInput
            className="bg-white border border-amber-300 rounded-lg px-3 py-3 text-amber-900"
            value={formData.location}
            onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
            placeholder="Event location"
            placeholderTextColor="#999"
          />
        </View>

        {/* Organizer Field */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-amber-800 mb-2">Organizer</Text>
          <TextInput
            className="bg-white border border-amber-300 rounded-lg px-3 py-3 text-amber-900"
            value={formData.organizer}
            onChangeText={(text) => setFormData(prev => ({ ...prev, organizer: text }))}
            placeholder="Event organizer"
            placeholderTextColor="#999"
          />
        </View>

        {/* Ticket Price Field */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-amber-800 mb-2">Ticket Price (SOL)</Text>
          <TextInput
            className="bg-white border border-amber-300 rounded-lg px-3 py-3 text-amber-900"
            value={formData.ticketPrice?.toString() || ''}
            onChangeText={(text) => {
              const price = text ? parseFloat(text) : undefined;
              setFormData(prev => ({ ...prev, ticketPrice: price }));
            }}
            placeholder="0.00"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>

        {/* Max Attendees Field */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-amber-800 mb-2">Max Attendees</Text>
          <TextInput
            className="bg-white border border-amber-300 rounded-lg px-3 py-3 text-amber-900"
            value={formData.maxAttendees?.toString() || ''}
            onChangeText={(text) => {
              const count = text ? parseInt(text) : undefined;
              setFormData(prev => ({ ...prev, maxAttendees: count }));
            }}
            placeholder="Unlimited"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>

        {/* Requirements Field */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-amber-800 mb-2">Requirements</Text>
          <TextInput
            className="bg-white border border-amber-300 rounded-lg px-3 py-3 text-amber-900 h-20"
            value={formData.requirements}
            onChangeText={(text) => setFormData(prev => ({ ...prev, requirements: text }))}
            placeholder="Any special requirements"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
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
