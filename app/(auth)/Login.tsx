import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  TextInput as NativeTextInput,
  TextInputProps as NativeTextInputProps,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import CustomButton from "../../src/components/CustomButton";
import logo from "../../src/assets/logo.png";

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

// Web-specific styles for TextInput
const webInputStyles: React.CSSProperties = {
  width: "100%",
  borderWidth: "1px",
  borderColor: "#ffffff",
  padding: "12px",
  marginBottom: "15px",
  borderRadius: "10px",
  backgroundColor: "#1e1e1e",
  color: "#ffffff",
  fontSize: "16px",
};

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const { height, width } = useWindowDimensions();
  const router = useRouter();
  const { signIn, isLoading } = useAuth();

  const handleLogin = async () => {
    if (!email || !isValidEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    if (!password) {
      Alert.alert("Invalid Password", "Please enter your password.");
      return;
    }
    try {
      await signIn(email, password);
      setEmail("");
      setPassword("");
      router.push("/"); // Redirect to home screen
    } catch (error: any) {
      console.error("Login Failed:", error);
      Alert.alert("Login Failed", getErrorMessage(error.code));
    }
  };

  const isValidEmail = (email: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case "auth/user-not-found":
        return "No account found with this email. Please sign up first.";
      case "auth/wrong-password":
        return "Incorrect password. Please try again.";
      case "auth/invalid-email":
        return "Invalid email format. Please check and try again.";
      case "auth/network-request-failed":
        return "Network error. Please check your connection and try again.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo Section */}
      <View style={styles.logoContainer}>
        <Image
          source={logo}
          style={[
            styles.logo,
            { width: width * 0.8, height: height * 0.25 },
          ]}
        />
      </View>
      {isLoading ? (
        <ActivityIndicator size="large" color="#ffffff" />
      ) : (
        <View style={styles.form}>
          {/* Email Input */}
          <TextInput
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholderTextColor="#888"
          />
          {/* Password Input */}
          <TextInput
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            autoComplete="password"
            placeholderTextColor="#888"
          />
          {/* Login Button */}
          <CustomButton
            title="Login"
            onPress={handleLogin}
            outlined={true}
            disabled={isLoading}
            buttonStyle={{
              paddingVertical: 15,
              width: "100%",
              borderRadius: 10,
              marginBottom: 15,
              alignItems: "center",
              borderColor: "#fff",
              borderWidth: 1,
              backgroundColor: "transparent",
            }}
            textStyle={{
              color: "#ffffff",
              fontSize: 18,
              textAlign: "center",
              fontWeight: "bold",
            }}
          />
          {/* Sign Up Button */}
          <CustomButton
            title="Sign Up"
            onPress={() => router.push("/(auth)/Register")}
            outlined={false}
            buttonStyle={{
              paddingVertical: 15,
              width: "100%",
              borderRadius: 10,
              marginBottom: 15,
              alignItems: "center",
              backgroundColor: "#ffffff",
            }}
            textStyle={{
              color: "#000000",
              fontSize: 18,
              textAlign: "center",
              fontWeight: "bold",
            }}
          />
          <View style={styles.additionalTextContainer}>
            <Text style={styles.infoText}>
              By clicking Log in, you agree to the{" "}
              <Text style={styles.linkText}>Terms of Use</Text> and{" "}
              <Text style={styles.linkText}>Privacy Policy</Text>.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#121212",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    resizeMode: "contain",
    alignSelf: "center",
  },
  form: {
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ffffff",
    padding: 12,
    marginBottom: 15,
    borderRadius: 10,
    backgroundColor: "#1e1e1e",
    color: "#ffffff",
    fontSize: 16,
  },
  additionalTextContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  infoText: {
    fontSize: 12,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 5,
  },
  linkText: {
    color: "#ffffff",
    textDecorationLine: "underline",
  },
});

export default LoginScreen;