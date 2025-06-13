import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";

interface PrivacyModalProps {
  visible: boolean;
  onClose: () => void;
}

const PrivacyModal: React.FC<PrivacyModalProps> = ({ visible, onClose }) => {
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
            <Text style={styles.modalTitle}>Privacy Policy</Text>
            <Text style={styles.modalText}>
              Last updated December 08, 2024{"\n\n"}
              This Privacy Notice for 1111 Eptx LLC (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;),
              describes how and why we might access, collect, store, use, and/or
              share (&quot;process&quot;) your personal information when you use our
              services (&quot;Services&quot;), including when you:
              {"\n\n"}
              • Visit our website at{" "}
              <Text
                style={styles.link}
                onPress={() => Linking.openURL("https://1111eptx.com")}
              >
                1111eptx.com
              </Text>{" "}
              {"\n"}
              • Download and use our mobile application (Club 11:11){" "}
              {"\n"}
              • Engage with us in other related ways, including sales,
              marketing, or events
              {"\n\n"}
              Questions or concerns? Reading this Privacy Notice will help you
              understand your privacy rights and choices. If you have questions,
              contact us at{" "}
              <Text
                style={styles.link}
                onPress={() => Linking.openURL("mailto:privacy@1111eptx.com")}
              >
                privacy@1111eptx.com
              </Text>
              .
            </Text>
            <Text style={styles.sectionTitle}>SUMMARY OF KEY POINTS</Text>
            <Text style={styles.modalText}>
              Below is a summary of key points from our Privacy Notice.{" "}
              {"\n\n"}
              • **What personal information do we process?** We may process
              personal information depending on how you interact with our
              Services.{"\n\n"}
              • **How do we process your information?** We process your
              information to provide, improve, and administer our Services,
              communicate with you, and for security and fraud prevention.{"\n\n"}
              • **What are your rights?** Depending on your location, you may
              have rights regarding your personal information.{"\n\n"}
              • **How can you exercise your rights?** The easiest way to
              exercise your rights is by contacting us directly via{" "}
              <Text
                style={styles.link}
                onPress={() =>
                  Linking.openURL("https://1111eptx.com/delete-my-account.php")
                }
              >
                this page
              </Text>{" "}
              or at{" "}
              <Text
                style={styles.link}
                onPress={() => Linking.openURL("mailto:privacy@1111eptx.com")}
              >
                privacy@1111eptx.com
              </Text>
              .
            </Text>
            <Text style={styles.sectionTitle}>
              FULL PRIVACY NOTICE CONTENT
            </Text>
            <Text style={styles.modalText}>
              {/* Replace this section with the detailed privacy policy content you provided */}
              {/* Omitted here for brevity, but you can include the full policy */}
              {`
                1. WHAT INFORMATION DO WE COLLECT?
                Personal information you disclose to us...
                ...

                2. HOW DO WE PROCESS YOUR INFORMATION?
                We process your information to provide, improve, and administer our Services...
                ...

                3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?
                We may share information in specific situations...

                For the full details, refer to the document above.
              `}
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
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 5,
  },
  link: {
    color: "#007bff",
    textDecorationLine: "underline",
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

export default PrivacyModal;