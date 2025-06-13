import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";

interface EulaModalProps {
  visible: boolean;
  onClose: () => void;
}

const EulaModal: React.FC<EulaModalProps> = ({ visible, onClose }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>End User License Agreement (EULA)</Text>
            <Text style={styles.modalText}>
              <Text style={styles.sectionTitle}>Effective Date:</Text> [Date]{"\n\n"}
              <Text style={styles.sectionTitle}>PLEASE READ THIS AGREEMENT CAREFULLY BEFORE USING THE 11:11 EPTX APP.</Text>{"\n\n"}
              This End User License Agreement (&quot;Agreement&quot;) is a legal agreement between you (&quot;User&quot;) and **11:11 EPTX** (&quot;Company&quot;), with its principal business location in Texas and contact email at **app@1111eptx.com**, governing your use of the 11:11 EPTX mobile application (&quot;App&quot;). By downloading, installing, or using the App, you agree to abide by the terms and conditions of this Agreement. If you do not agree, you must not use the App.{"\n\n"}
              <Text style={styles.sectionTitle}>1. Overview of Services</Text>{"\n"}
              The **11:11 EPTX App** provides features that include but are not limited to:{"\n"}
              - Event creation, management, and reservations.{"\n"}
              - User interaction features, including event participation and community-building tools.{"\n"}
              - The ability for users to upload and manage content, including text and images.{"\n"}
              - Push notifications for event updates and important announcements.{"\n"}
              - Integration with user accounts for personalized experiences.{"\n\n"}
              This Agreement governs all use of these features.{"\n\n"}
              <Text style={styles.sectionTitle}>2. License Grant</Text>{"\n"}
              **11:11 EPTX** grants you a non-exclusive, non-transferable, revocable license to use the App for personal, non-commercial purposes in accordance with this Agreement.{"\n\n"}
              <Text style={styles.sectionTitle}>3. User-Generated Content</Text>{"\n"}
              You may submit or upload content, such as text, images, or other media (&quot;User Content&quot;). By submitting User Content, you agree to:{"\n"}
              - Ensure all User Content complies with this Agreement, applicable laws, and community guidelines.{"\n"}
              - Avoid posting objectionable content, including but not limited to:{"\n"}
                - Hateful, abusive, or defamatory content.{"\n"}
                - Pornographic, obscene, or violent material.{"\n"}
                - Content promoting discrimination, violence, or illegal activities.{"\n"}
              - Provide accurate and truthful information when posting content.{"\n\n"}
              The Company reserves the right to remove User Content that violates this Agreement or applicable laws.{"\n\n"}
              <Text style={styles.sectionTitle}>4. Prohibited Conduct</Text>{"\n"}
              You agree NOT to:{"\n"}
              - Use the App for any unlawful or harmful purposes.{"\n"}
              - Upload malicious code, viruses, or disruptive technologies.{"\n"}
              - Harass, stalk, or harm other users.{"\n"}
              - Reverse-engineer, disassemble, or tamper with the App.{"\n"}
              - Engage in any activity that disrupts the App&apos;s functionality or undermines user security.{"\n\n"}
              <Text style={styles.sectionTitle}>5. Safety and Moderation</Text>{"\n"}
              To ensure a safe environment:{"\n"}
              - **Terms Acceptance:** Users must accept this Agreement, which includes a no-tolerance policy for objectionable behavior.{"\n"}
              - **Content Filtering:** The Company employs automated and manual filtering to detect and block objectionable content.{"\n"}
              - **Reporting Mechanism:** Users can report objectionable content through an in-app flagging system.{"\n"}
              - **Abuse Management:** The Company investigates reports and takes action within 24 hours, including content removal and user account termination if necessary.{"\n"}
              - **User Blocking:** The App allows users to block other users from interacting with them.{"\n\n"}
              [Additional sections omitted for brevity due to length.]{"\n\n"}
              <Text style={styles.sectionTitle}>14. Acceptance of Terms</Text>{"\n"}
              By using the App, you acknowledge that you have read, understood, and agreed to this Agreement, including the prohibition of objectionable content and adherence to all outlined terms.
            </Text>
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  modalText: {
    fontSize: 14,
    color: "#000",
    textAlign: "justify",
  },
  sectionTitle: {
    fontWeight: "bold",
    marginTop: 10,
  },
  closeButton: {
    backgroundColor: "#000",
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default EulaModal;