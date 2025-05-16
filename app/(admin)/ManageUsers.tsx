import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { createUser, updateUserById, getUserById,} from "../../src/utils/users";
import { getAuth } from 'firebase/auth';
import { auth } from '../../src/config/firebase';

const ManageUsers = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<any | null>(null);

  const handleAddUser = async () => {
    if (!name || !email || !role) {
      Alert.alert("Error", "All fields are required.");
      return;
    }
  
    const currentUser = auth.currentUser;
    const currentUserEmail = currentUser?.email;
    const currentUserPassword = ""; // Prompt the current user for their password, or use a secure mechanism to retrieve it.
  
    if (!currentUser || !currentUserEmail || !currentUserPassword) {
      Alert.alert("Error", "Unable to verify your session. Please sign in again.");
      return;
    }
  
    try {
      // Step 1: Log out the current user before creating the new user
      const { signOut, createUserWithEmailAndPassword, sendPasswordResetEmail } = await import('firebase/auth');
      await signOut(auth);
  
      // Step 2: Create the new user
      const tempPassword = Math.random().toString(36).slice(-8);
      const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
      const firebaseUser = userCredential.user;
  
      // Send password reset email
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Password Setup", "User will receive an email to set their password.");
  
      // Add the user details and role to the backend
      await createUser({
        id: firebaseUser.uid,
        email,
        name,
        role,
      });
  
      Alert.alert("Success", "User added successfully!");
      setName("");
      setEmail("");
      setRole(null);
  
      // Step 3: Reauthenticate the original user
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      await signInWithEmailAndPassword(auth, currentUserEmail, currentUserPassword);
    } catch (error: any) {
      console.error("Error adding user:", error);
      if (error.code === "auth/email-already-in-use") {
        Alert.alert("Error", "The email address is already in use.");
      } else {
        Alert.alert("Error", "Failed to add user.");
      }
  
      // Attempt to reauthenticate the original user in case of failure
      try {
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        await signInWithEmailAndPassword(auth, currentUserEmail, currentUserPassword);
      } catch (reauthError: any) {
        console.error("Error reauthenticating the original user:", reauthError);
      }
    }
  };

  const handleSearchUser = async () => {
    if (!searchEmail) {
      Alert.alert("Error", "Please enter an email to search.");
      return;
    }

    try {
      const user = await getUserById(searchEmail); // Assuming email is used for search
      setSearchResults(user);
    } catch (error) {
      console.error("Error searching user:", error);
      Alert.alert("Error", "User not found.");
    }
  };

  const handleUpdateUser = async () => {
    if (!searchResults) {
      Alert.alert("Error", "No user selected to update.");
      return;
    }

    try {
      await updateUserById(searchResults.id, {
        name: searchResults.name,
        email: searchResults.email,
        role: searchResults.role,
      });
      Alert.alert("Success", "User updated successfully!");
    } catch (error) {
      console.error("Error updating user:", error);
      Alert.alert("Error", "Failed to update user.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add User</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        placeholderTextColor="#aaa"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
      />
      <DropDownPicker
        open={roleDropdownOpen}
        value={role}
        items={[
          { label: "Admin", value: "admin" },
          { label: "Promoter", value: "promoter" },
          { label: "User", value: "user" },
        ]}
        setOpen={setRoleDropdownOpen}
        setValue={setRole}
        placeholder="Select Role"
        style={styles.dropdown}
        textStyle={styles.dropdownText}
        dropDownContainerStyle={styles.dropdownContainer}
      />
      <TouchableOpacity style={styles.button} onPress={handleAddUser}>
        <Text style={styles.buttonText}>Add User</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Search User</Text>
      <TextInput
        style={styles.input}
        placeholder="Search by Email"
        placeholderTextColor="#aaa"
        value={searchEmail}
        onChangeText={setSearchEmail}
      />
      <TouchableOpacity style={styles.button} onPress={handleSearchUser}>
        <Text style={styles.buttonText}>Search</Text>
      </TouchableOpacity>

      {searchResults && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>Name: {searchResults.name}</Text>
          <Text style={styles.resultText}>Email: {searchResults.email}</Text>
          <Text style={styles.resultText}>Role: {searchResults.role}</Text>
          <TouchableOpacity style={styles.button} onPress={handleUpdateUser}>
            <Text style={styles.buttonText}>Update User</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#222",
    color: "#fff",
    borderWidth: 1,
    borderColor: "#555",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  dropdown: {
    backgroundColor: "#222",
    borderColor: "#555",
  },
  dropdownText: {
    color: "#fff",
  },
  dropdownContainer: {
    backgroundColor: "#333",
    borderColor: "#555",
  },
  button: {
    backgroundColor: "#444",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  resultContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#101010",
    borderRadius: 8,
  },
  resultText: {
    color: "#fff",
    marginBottom: 10,
  },
});

export default ManageUsers;