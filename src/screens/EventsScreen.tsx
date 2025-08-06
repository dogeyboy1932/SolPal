import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNodes } from '../contexts/NodeContext';
import { useWallet } from '../contexts/WalletContext';
import { EventNode } from '../types/nodes';
import { nodeService } from '../services/nodeService';
import { EventDetailsModal } from '../features/nodes/forms/EventDetailsModal';

interface EventsScreenProps {
  onBack: () => void;
}

export const EventsScreen: React.FC<EventsScreenProps> = ({ onBack }) => {
  const { nodes, updateEventNode, updatePersonNode } = useNodes();
  const { publicKey } = useWallet();
  const [selectedEvent, setSelectedEvent] = useState<EventNode | null>(null);

  const availableEvents = useMemo(() => {
    if (!publicKey) {
      return [];
    }
    const myPublicKey = publicKey;
    return nodes.filter(node => {
      if (node.type !== 'event') {
        return false;
      }
      const event = node as EventNode;
      const isOrganizer = event.organizerPublicKey === myPublicKey;
      const alreadySignedUp = event.attendees?.includes(myPublicKey);
      const isFull =
        event.attendees &&
        event.maxAttendees &&
        event.attendees.length >= event.maxAttendees;

      return !isOrganizer && !alreadySignedUp && !isFull;
    }) as EventNode[];
  }, [nodes, publicKey]);

  const handleSignUp = async (event: EventNode) => {
    console.log(publicKey)
    if (!publicKey) {
      Alert.alert('Error', 'Please connect your wallet to sign up for events.');
      return;
    }
    const personNode = nodeService.getPersonNodeByPublicKey(publicKey);
    console.log("Person Node:", personNode);

    if (!personNode) {
      Alert.alert(
        'Error',
        'Could not find a person node associated with your public key.'
      );
      return;
    }

    console.log("HERE")

    const {
      success,
      event: updatedEvent,
      person: updatedPerson,
    } = await nodeService.signUpForEvent(event.id, personNode.id);
    console.log("Sign Up Result:", success, updatedEvent, updatedPerson);
    if (success && updatedEvent && updatedPerson) {
      console.log('Sign up successful:', updatedEvent, updatedPerson);
      await updateEventNode(updatedEvent.id, updatedEvent);
      await updatePersonNode(updatedPerson.id, updatedPerson);
      Alert.alert(
        'Success',
        `You have successfully signed up for ${event.name}.`
      );
    } else {
      Alert.alert('Error', `Could not sign up for ${event.name}.`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Available Events</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.scrollView}>
        {availableEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No available events found.</Text>
          </View>
        ) : (
          availableEvents.map(event => (
            <TouchableOpacity
              key={event.id}
              style={styles.eventCard}
              onPress={() => setSelectedEvent(event)}
            >
              <Text style={styles.eventName}>{event.name}</Text>
              <Text style={styles.eventDate}>
                {new Date(event.date).toLocaleDateString()}
              </Text>
              <Text style={styles.eventAttendees}>
                Attendees: {event.attendees?.length || 0} /{' '}
                {event.maxAttendees || '∞'}
              </Text>
              {(() => {
                const isSignedUp = event.attendees?.includes(publicKey!);
                console.log(event.attendees)
                console.log('Event:', event.name);
                console.log('Public Key:', publicKey);
                console.log('Is Signed Up:', isSignedUp);
                return isSignedUp ? null : (
                  <TouchableOpacity
                    style={styles.signUpButton}
                    onPress={() => handleSignUp(event)}
                  >
                    <Text style={styles.signUpButtonText}>Sign Up</Text>
                  </TouchableOpacity>
                );
              })()}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      <EventDetailsModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </SafeAreaView>
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
  backButton: {
    padding: 5,
  },
  scrollView: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  eventAttendees: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  signUpButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  signUpButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
