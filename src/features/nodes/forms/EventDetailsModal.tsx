import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EventNode } from '../../../types/nodes';

interface EventDetailsModalProps {
  event: EventNode | null;
  onClose: () => void;
}

export const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  event,
  onClose,
}) => {
  if (!event) {
    return null;
  }

  return (
    <Modal visible={!!event} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>{event.name}</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView style={styles.scrollView}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>
            {new Date(event.date).toLocaleDateString()}
          </Text>

          <Text style={styles.label}>Location:</Text>
          <Text style={styles.value}>{event.location}</Text>

          <Text style={styles.label}>Organizer:</Text>
          <Text style={styles.value}>{event.organizer}</Text>

          <Text style={styles.label}>Attendees:</Text>
          <Text style={styles.value}>
            {event.attendees?.length || 0} / {event.maxAttendees || '∞'}
          </Text>

          <Text style={styles.label}>Description:</Text>
          <Text style={styles.value}>{event.description}</Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  closeButton: {
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  scrollView: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    marginBottom: 10,
  },
});
