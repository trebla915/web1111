import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

interface ReportPostModalProps {
  onSubmit: (reason: string, details: string) => Promise<void>;
  onCancel: () => void;
}

const ReportPostModal: React.FC<ReportPostModalProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState("");

  const reasons = ["Nudity", "Spam", "Harassment", "Hate Speech", "Other"];

  const handleReasonSelect = (reason: string) => {
    setSelectedReason(reason);
  };

  const handleSubmit = () => {
    if (!selectedReason) {
      alert("Please select a reason for the report.");
      return;
    }
    onSubmit(selectedReason, details || ""); // Ensure `details` defaults to an empty string
  };

  return (
    <Modal visible={true} animationType="slide" transparent={true}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalContent}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.title}>Report Post</Text>

            <Text style={styles.subtitle}>Select a reason:</Text>
            {reasons.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonButton,
                  selectedReason === reason && styles.selectedReason,
                ]}
                onPress={() => handleReasonSelect(reason)}
              >
                <Text
                  style={[
                    styles.reasonText,
                    selectedReason === reason && styles.selectedReasonText,
                  ]}
                >
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.subtitle}>Additional details (optional):</Text>
            <TextInput
              placeholder="Enter additional details here..."
              style={styles.input}
              value={details}
              onChangeText={setDetails}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.buttonsContainer}>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "90%",
    maxHeight: "80%",
  },
  scrollContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 10,
    textAlign: "left",
    width: "100%",
  },
  reasonButton: {
    backgroundColor: "#f5f5f5",
    borderRadius: 5,
    padding: 10,
    marginVertical: 5,
    width: "100%",
    alignItems: "center",
  },
  selectedReason: {
    backgroundColor: "#007bff",
  },
  reasonText: {
    fontSize: 16,
    color: "#333",
  },
  selectedReasonText: {
    color: "#fff",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
    width: "100%",
    height: 80,
    textAlignVertical: "top",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#ccc",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default ReportPostModal;