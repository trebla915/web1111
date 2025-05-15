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
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { auth } from "../../src/config/firebase.native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { createUser } from "../../src/utils/users";
import CheckBox from "@react-native-community/checkbox"; // community checkbox
import EulaModal from "../../src/components/EulaModal"; // Import the EULA modal

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
  const [modalVisible, setModalVisible] = useState<boolean>(false); // EULA Modal visibility
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false); // Checkbox state
  const router = useRouter();

  const { width } = Dimensions.get("window");
  const logoSize = width * 0.5;

  const handleRegister = async () => {
    setError("");

    if (!agreedToTerms) {
      Alert.alert("Error", "You must agree to the Terms and Conditions to register.");
      return;
    }

    // Validation logic
    if (!fullName || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Invalid email format.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await createUser({
        id: user.uid,
        email,
        name: fullName,
        role: "user",
      });

      Alert.alert("Success", "Account Created Successfully!", [
        { text: "OK", onPress: () => router.push("/(auth)/Login") },
      ]);
    } catch (err: any) {
      console.error("Registration Error:", err);
      let errorMessage = "An unexpected error occurred.";
      switch (err.code) {
        case "auth/email-already-in-use":
          errorMessage = "This email is already in use.";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address.";
          break;
        case "auth/weak-password":
          errorMessage = "Password must contain at least 6 characters.";
          break;
        default:
          errorMessage = err.message || errorMessage;
          break;
      }
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
          <View style={styles.termsContainer}>
            <CheckBox
              value={agreedToTerms}
              onValueChange={setAgreedToTerms}
              color={agreedToTerms ? "#fff" : "#fff"} // White tick
              style={styles.checkbox}
            />
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.termsLink}>Terms and Conditions</Text>
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: agreedToTerms ? "#fff" : "#ccc" }]}
            onPress={handleRegister}
            disabled={!agreedToTerms}
          >
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(auth)/Login")}>
            <Text style={styles.linkText}>Already have an account? Login</Text>
          </TouchableOpacity>

          {/* Modal for EULA */}
          <EulaModal visible={modalVisible} onClose={() => setModalVisible(false)} />
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
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: "#000", // Black background
    borderColor: "#fff",
    borderWidth: 1,
  },
  termsText: {
    color: "#fff",
    marginLeft: 10,
  },
  termsLink: {
    textDecorationLine: "underline",
  },
});