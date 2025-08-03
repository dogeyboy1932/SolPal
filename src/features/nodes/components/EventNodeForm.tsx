import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { EventNode, CreateEventNodeData, UpdateEventNodeData } from '../../types/nodes';
import { useNodes } from '../../contexts/NodeContext';

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
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        <Text style={styles.title}>
          {isEditing ? 'Edit Event' : 'Create Event'}
        </Text>

        {/* Name Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Event Name *</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Enter event name"
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
            placeholder="Event description"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Event Type Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Event Type</Text>
          <View style={styles.typeContainer}>
            {eventTypeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.typeButton,
                  formData.eventType === option.value && styles.typeButtonActive
                ]}
                onPress={() => setFormData(prev => ({ ...prev, eventType: option.value }))}
              >
                <Text style={[
                  styles.typeButtonText,
                  formData.eventType === option.value && styles.typeButtonTextActive
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Start Date & Time *</Text>
          <TextInput
            style={styles.input}
            value={dateString}
            onChangeText={handleDateChange}
            placeholder="YYYY-MM-DDTHH:mm"
            placeholderTextColor="#999"
          />
        </View>

        {/* End Date Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>End Date & Time</Text>
          <TextInput
            style={styles.input}
            value={endDateString}
            onChangeText={handleEndDateChange}
            placeholder="YYYY-MM-DDTHH:mm (optional)"
            placeholderTextColor="#999"
          />
        </View>

        {/* Location Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={formData.location}
            onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
            placeholder="Event location"
            placeholderTextColor="#999"
          />
        </View>

        {/* Organizer Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Organizer</Text>
          <TextInput
            style={styles.input}
            value={formData.organizer}
            onChangeText={(text) => setFormData(prev => ({ ...prev, organizer: text }))}
            placeholder="Event organizer"
            placeholderTextColor="#999"
          />
        </View>

        {/* Ticket Price Field */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Ticket Price (SOL)</Text>
          <TextInput
            style={styles.input}
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
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Max Attendees</Text>
          <TextInput
            style={styles.input}
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
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Requirements</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.requirements}
            onChangeText={(text) => setFormData(prev => ({ ...prev, requirements: text }))}
            placeholder="Any special requirements"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
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
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#333',
  },
  typeButtonTextActive: {
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
    backgroundColor: '#28a745',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});
