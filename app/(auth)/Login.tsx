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
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../src/config/firebase.native";
import EulaModal from "../../src/components/EulaModal"; // Import the EULA modal
import PrivacyModal from "../../src/components/PrivacyModal"; // Import the Privacy Policy modal

// Custom TextInput Wrapper for cross-platform compatibility
type WebInputProps = React.InputHTMLAttributes<HTMLInputElement>;
const TextInput: React.FC<NativeTextInputProps | WebInputProps> = (props) => {
  if (Platform.OS === "web") {
    const { style, ...webProps } = props as WebInputProps;
    return <input {...webProps} style={{ ...webInputStyles, ...style }} />;
  } else {
    return <NativeTextInput {...(props as NativeTextInputProps)} />;
  }
};

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [eulaModalVisible, setEulaModalVisible] = useState<boolean>(false); // EULA modal state
  const [privacyModalVisible, setPrivacyModalVisible] = useState<boolean>(false); // Privacy modal state
  const router = useRouter();

  const { width } = Dimensions.get("window");
  const logoSize = width * 0.5;

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/");
    } catch (err: any) {
      console.error("Login Error:", err);

      let errorMessage = "An unexpected error occurred. Please try again.";
      switch (err.code) {
        case "auth/user-not-found":
          errorMessage = "No account found with this email.";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password. Please try again.";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email format.";
          break;
        default:
          errorMessage = err.message || errorMessage;
          break;
      }

      Alert.alert("Login Error", errorMessage);
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
              source={require("../../src/assets/logo.png")} // Correct relative path to the image
              style={[styles.logo, { width: logoSize, height: logoSize }]}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Login</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <TouchableOpacity onPress={() => router.push("/(auth)/Register")}>
              <Text style={styles.registerText}>
                Don't have an account?{" "}
                <Text style={styles.registerLink}>Register</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By logging in, you agree to our{" "}
              <Text
                style={styles.linkText}
                onPress={() => setEulaModalVisible(true)}
              >
                Terms of Service
              </Text>{" "}
              and acknowledge our{" "}
              <Text
                style={styles.linkText}
                onPress={() => setPrivacyModalVisible(true)}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      {/* Modals for Terms of Service and Privacy Policy */}
      <EulaModal visible={eulaModalVisible} onClose={() => setEulaModalVisible(false)} />
      <PrivacyModal
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
      />
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
    textDecorationLine: "underline",
  },
  errorText: {
    color: "#ff4444",
    marginBottom: 10,
    textAlign: "center",
  },
  registerContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  registerText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
  },
  registerLink: {
    color: "#fff",
    textDecorationLine: "underline",
    fontWeight: "bold",
  },
  termsContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  termsText: {
    color: "#fff",
    textAlign: "center",
  },
});