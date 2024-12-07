import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert, Platform, TextInput as NativeTextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { FAB } from 'react-native-paper';

// Custom TextInput Wrapper
type WebInputProps = React.InputHTMLAttributes<HTMLInputElement>;
type NativeInputProps = React.ComponentProps<typeof NativeTextInput>;
const TextInput: React.FC<WebInputProps | NativeInputProps> = (props) => {
  if (Platform.OS === 'web') {
    const { style, ...webProps } = props as WebInputProps;
    return <input {...webProps} style={{ ...webInputStyles, ...style }} />;
  } else {
    return <NativeTextInput {...(props as NativeInputProps)} />;
  }
};

// Web-specific styles for TextInput
const webInputStyles: React.CSSProperties = {
  width: '100%',
  height: 50,
  borderColor: '#ddd',
  borderWidth: 1,
  marginBottom: 15,
  paddingLeft: 10,
  borderRadius: 5,
  fontSize: 16,
};

const CreateReservation = () => {
  const router = useRouter();
  const [guestName, setGuestName] = useState('');
  const [eventType, setEventType] = useState('');
  const [reservationDate, setReservationDate] = useState('');
  const [status, setStatus] = useState('Pending');

  const handleSubmit = () => {
    if (!guestName || !eventType || !reservationDate) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    const newReservation = {
      guestName,
      eventType,
      reservationDate,
      status,
    };

    console.log('New Reservation:', newReservation);
    router.push('/(admin)/ManageReservations'); // Adjust this to the correct route
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Reservation</Text>

      {/* Guest Name */}
      <TextInput
        style={styles.input}
        placeholder="Guest Name"
        value={guestName}
        onChangeText={(text: string) => setGuestName(text)} // Explicit typing for web compatibility
      />

      {/* Event Type */}
      <TextInput
        style={styles.input}
        placeholder="Event Type"
        value={eventType}
        onChangeText={(text: string) => setEventType(text)}
      />

      {/* Reservation Date */}
      <TextInput
        style={styles.input}
        placeholder="Reservation Date"
        value={reservationDate}
        onChangeText={(text: string) => setReservationDate(text)}
      />

      {/* Status */}
      <TextInput
        style={styles.input}
        placeholder="Status"
        value={status}
        onChangeText={(text: string) => setStatus(text)}
      />

      {/* Submit Button */}
      <Button title="Create Reservation" onPress={handleSubmit} color="#6200ea" />

      {/* Optionally add a FAB button for additional actions */}
      <FAB
        style={styles.fab}
        small
        icon="check"
        label="Create"
        onPress={handleSubmit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 15,
    paddingLeft: 10,
    borderRadius: 5,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#6200ea',
  },
});

export default CreateReservation;