import React, { useState } from "react";
import {
  View,
  Text,
  TextInput as NativeTextInput,
  StyleSheet,
  Alert,
  Image,
  Dimensions,
  Platform,
  TextInputProps as NativeTextInputProps,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { auth } from "../../src/config/firebase.native";
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { createUser } from "../../src/utils/users";
import { TouchableOpacity } from "react-native";

// Custom TextInput Wrapper
type WebInputProps = React.InputHTMLAttributes<HTMLInputElement>;
const TextInput: React.FC<NativeTextInputProps | WebInputProps> = (props) => {
  if (Platform.OS === "web") {
    const { style, ...webProps } = props as WebInputProps;
    return <input {...webProps} style={{ ...webInputStyles, ...style }} />;
  } else {
    return <NativeTextInput {...(props as NativeTextInputProps)} />;
  }
};

export default function Register() {
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const router = useRouter();

  const { width } = Dimensions.get("window");
  const logoSize = width * 0.5;

  const handleRegister = async () => {
    setError("");
  
    // Regular expression for basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    if (!fullName) {
      setError("Full Name is required!");
      return;
    }
  
    if (!email) {
      setError("Email is required!");
      return;
    }
  
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address!");
      return;
    }
  
    if (!password) {
      setError("Password is required!");
      return;
    }
  
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
  
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
  
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Create user in the backend
      await createUser({
        id: user.uid, // Firebase UID
        email,
        name: fullName,
        role: "user", // Default role
      });
  
      Alert.alert("Success", "Account Created Successfully!", [
        { text: "OK", onPress: () => router.push("/(auth)/Login") },
      ]);
    } catch (err: any) {
      console.error("Registration Error:", err);
  
      let errorMessage = "An unexpected error occurred. Please try again.";
      switch (err.code) {
        case "auth/email-already-in-use":
          errorMessage = "This email address is already in use. Please use a different email.";
          break;
        case "auth/invalid-email":
          errorMessage = "The email address is invalid. Please enter a valid email.";
          break;
        case "auth/weak-password":
          errorMessage = "The password is too weak. Please use a stronger password.";
          break;
        default:
          errorMessage = err.message || errorMessage;
          break;
      }
  
      Alert.alert("Registration Error", errorMessage);
      setError(errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../src/assets/logo.png")}
              style={[styles.logo, { width: logoSize, height: logoSize }]}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Register</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#ccc"
            value={fullName}
            onChangeText={setFullName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#ccc"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#ccc"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#ccc"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(auth)/Login")}>
            <Text style={styles.linkText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// Web-specific styles for TextInput
const webInputStyles: React.CSSProperties = {
  width: "100%",
  padding: "15px",
  marginBottom: "15px",
  borderRadius: "10px",
  border: "1px solid #fff",
  backgroundColor: "#1c1c1c",
  color: "#fff",
  fontSize: "16px",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {},
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#1c1c1c",
    color: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#fff",
  },
  button: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  linkText: {
    color: "#fff",
    textAlign: "center",
    marginTop: 20,
  },
  errorText: {
    color: "#ff4444",
    marginBottom: 10,
    textAlign: "center",
  },
});