import React, { useState } from 'react';
import {
  View,
  Text,
  Alert,
  StyleSheet,
  Modal,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  TextInput as NativeTextInput,
  TouchableOpacity,
  Dimensions,
  Image,
  Switch,
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { uploadImageToStorage } from '../../src/utils/uploadImageToStorage';
import CustomButton from '../../src/components/CustomButton';
import { createEvent } from '../../src/utils/events';

const screenWidth = Dimensions.get('window').width;

const CreateEvent: React.FC = () => {
  const { firebaseUser, token } = useAuth();
  const [eventName, setEventName] = useState('');
  const [flyerUri, setFlyerUri] = useState<string | null>(null);
  const [ticketLink, setTicketLink] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reservationsEnabled, setReservationsEnabled] = useState(true);

  const validateForm = () => {
    if (!eventName.trim()) {
      Alert.alert('Validation Error', 'Event name is required.');
      return false;
    }
    if (!selectedDate) {
      Alert.alert('Validation Error', 'Event date is required.');
      return false;
    }
    return true;
  };

  const pickFlyerImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
      });
      if (!result.canceled) {
        setFlyerUri(result.assets?.[0]?.uri || null);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image.');
    }
  };

  const handleCreateEvent = async () => {
    if (!firebaseUser || !token) {
      Alert.alert('Error', 'You must be logged in to create an event.');
      return;
    }

    if (!validateForm()) return;

    setLoading(true);
    try {
      let flyerUrl = '';

      if (flyerUri) {
        const filePath = `flyers/${firebaseUser.uid}/${Date.now()}_${eventName.trim()}.jpg`;
        flyerUrl = await uploadImageToStorage(flyerUri, filePath);
      }

      const eventData = {
        title: eventName.trim(),
        date: selectedDate?.toISOString(),
        ticketLink: ticketLink.trim(),
        flyerUrl,
        userId: firebaseUser.uid,
        imageUrl: '', // Placeholder for compatibility
        reservationsEnabled,
      };

      await createEvent(eventData);

      Alert.alert('Success', 'Event created successfully!');

      // Clear form fields after success
      setEventName('');
      setFlyerUri(null);
      setTicketLink('');
      setSelectedDate(null);
      setReservationsEnabled(true);
    } catch (error) {
      console.error('[handleCreateEvent] Error creating event:', error);
      Alert.alert('Error', 'Failed to create event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Event Name */}
        <Text style={styles.label}>Event Name *</Text>
        <NativeTextInput
          style={styles.input}
          placeholder="Enter event name"
          placeholderTextColor="#bbb"
          value={eventName}
          autoCapitalize="none"
          onChangeText={(text: string) => setEventName(text)}
        />

        {/* Event Date */}
        <Text style={styles.label}>Event Date *</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.datePickerText}>
            {selectedDate ? selectedDate.toDateString() : 'Select a date'}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate || new Date()}
            mode="date"
            display="spinner"
            textColor="white"
            onChange={(event, date) => {
              setShowDatePicker(false); // Close the picker
              if (date) setSelectedDate(date); // Update the selected date
            }}
          />
        )}

        {/* Ticket Link */}
        <Text style={styles.label}>Ticket Link (Optional)</Text>
        <NativeTextInput
          style={styles.input}
          placeholder="Enter ticket link"
          placeholderTextColor="#bbb"
          value={ticketLink}
          autoCapitalize="none"
          onChangeText={(text: string) => setTicketLink(text)}
        />

        {/* Upload Flyer */}
        <Text style={styles.label}>Upload Flyer (Optional)</Text>
        <CustomButton title={flyerUri ? 'Change Flyer' : 'Upload Flyer'} onPress={pickFlyerImage} />
        {flyerUri && (
          <View style={styles.flyerContainer}>
            <Image source={{ uri: flyerUri }} style={styles.imagePreview} />
            <CustomButton title="Remove Flyer" onPress={() => setFlyerUri(null)} outlined />
          </View>
        )}

        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>Enable Reservations</Text>
          <Switch
            value={reservationsEnabled}
            onValueChange={setReservationsEnabled}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={reservationsEnabled ? '#6200ea' : '#f4f3f4'}
          />
        </View>

        {/* Create Event Button */}
        <CustomButton title="Create Event" onPress={handleCreateEvent} disabled={loading} />

        {/* Loading Modal */}
        {loading && (
          <Modal transparent>
            <View style={styles.loadingModal}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          </Modal>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContainer: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
    color: '#fff',
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#1c1c1c',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#fff',
  },
  datePickerButton: {
    width: '100%',
    backgroundColor: '#1c1c1c',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  datePickerText: {
    color: '#bbb',
    fontSize: 16,
  },
  flyerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePreview: {
    width: screenWidth - 32,
    height: (screenWidth - 32) * 0.75,
    borderRadius: 8,
    marginBottom: 8,
  },
  loadingModal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  switchLabel: {
    color: '#fff',
    fontSize: 16,
  },
});

export default CreateEvent;