import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  arrayUnion,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/contexts/AuthContext";
import { useUser } from "../../src/contexts/UserContext";
import { Pressable } from "react-native";

const db = getFirestore();
const storage = getStorage();

const CommunityScreen: React.FC = () => {
  const { firebaseUser } = useAuth();
  const { userData } = useUser();
  const [communityData, setCommunityData] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [newImage, setNewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [selectedPost, setSelectedPost] = useState<string | null>(null);

  const fetchCommunityData = async () => {
    setLoading(true);
    try {
      const communityRef = collection(db, "communityPosts");
      const communityQuery = query(communityRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(communityQuery);

      const fetchedData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
        user: doc.data().user || {
          id: "Unknown User",
          name: "Anonymous",
          avatar: "https://via.placeholder.com/50",
        },
      }));

      setCommunityData(fetchedData);
    } catch (error) {
      console.error("Error fetching community data:", error);
      Alert.alert("Error", "Failed to load community data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityData();
  }, []);

  const pickImage = async () => {
    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync();
      if (!pickerResult.canceled && pickerResult.assets.length > 0) {
        const localUri = pickerResult.assets[0].uri;

        const manipulatedImage = await ImageManipulator.manipulateAsync(
          localUri,
          [{ resize: { width: 500, height: 500 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        const filePath = `communityPosts/${Date.now()}.jpg`;
        const response = await fetch(manipulatedImage.uri);
        const blob = await response.blob();

        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, blob);
        const downloadUrl = await getDownloadURL(storageRef);

        setNewImage(downloadUrl);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to upload image.");
    }
  };

  const addNewPost = async () => {
    if (!firebaseUser || !userData) {
      Alert.alert("Error", "You must be logged in to create a post.");
      return;
    }

    if (newComment.trim() === "") {
      Alert.alert("Empty Post", "Please add text to your post before submitting.");
      return;
    }

    try {
      const communityRef = collection(db, "communityPosts");
      const newPost = {
        text: newComment,
        image: newImage || null,
        likes: 0,
        user: {
          id: userData.id,
          name: userData.name || "Anonymous",
          avatar: userData.avatar || "https://via.placeholder.com/50",
        },
        comments: [],
        createdAt: new Date(),
      };

      await addDoc(communityRef, newPost);
      fetchCommunityData();
      setNewComment("");
      setNewImage(null);
    } catch (error) {
      console.error("Error posting message:", error);
      Alert.alert("Error", "Failed to post your message.");
    }
  };

  const deletePost = async (postId: string, imageUrl?: string) => {
    try {
      const postRef = doc(db, "communityPosts", postId);
      await deleteDoc(postRef);

      if (imageUrl) {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      }

      fetchCommunityData();
    } catch (error) {
      console.error("Error deleting post:", error);
      Alert.alert("Error", "Failed to delete the post.");
    }
  };

  const likePost = async (postId: string) => {
    try {
      const postRef = doc(db, "communityPosts", postId);
      await updateDoc(postRef, {
        likes: 1,
      });
      fetchCommunityData();
    } catch (error) {
      console.error("Error liking post:", error);
      Alert.alert("Error", "Failed to like the post.");
    }
  };

  const addComment = async (postId: string) => {
    if (commentText.trim() === "") {
      Alert.alert("Error", "Comment cannot be empty.");
      return;
    }

    try {
      const postRef = doc(db, "communityPosts", postId);

      await updateDoc(postRef, {
        comments: arrayUnion({
          user: {
            id: userData?.id || "Anonymous",
            name: userData?.name || "Anonymous",
            avatar: userData?.avatar || "https://via.placeholder.com/50",
          },
          text: commentText,
          createdAt: new Date(),
        }),
      });

      setCommentText("");
      fetchCommunityData();
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Failed to add the comment.");
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Write something..."
        placeholderTextColor="#ccc"
        value={newComment}
        onChangeText={setNewComment}
      />
      <View style={styles.actions}>
        <Pressable
          onPress={pickImage}
          style={({ pressed }) => [
            styles.imageButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>Upload Image</Text>
        </Pressable>
        <Pressable
          onPress={addNewPost}
          style={({ pressed }) => [
            styles.postButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>Post</Text>
        </Pressable>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : (
        <FlatList
          data={communityData}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.userInfo}>
                  <Image source={{ uri: item.user.avatar }} style={styles.userAvatar} />
                  <Text style={styles.userName}>{item.user.name}</Text>
                </View>
                {item.user.id === userData?.id && (
                  <Pressable
                    onPress={() => deletePost(item.id, item.image)}
                    style={({ pressed }) => pressed && { opacity: 0.5 }}
                  >
                    <Ionicons name="close-circle" size={24} color="#ff4444" />
                  </Pressable>
                )}
              </View>
              <Text style={styles.cardText}>{item.text}</Text>
              {item.image && <Image source={{ uri: item.image }} style={styles.cardImage} />}
              <View style={styles.postActions}>
                <Pressable
                  onPress={() => likePost(item.id)}
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.actionButtonText}>❤️ Like ({item.likes})</Text>
                </Pressable>
                <Pressable
                  onPress={() => setSelectedPost(item.id)}
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={styles.actionButtonText}>💬 Comment</Text>
                </Pressable>
              </View>
              {selectedPost === item.id && (
                <View style={styles.commentSection}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Add a comment..."
                    placeholderTextColor="#ccc"
                    value={commentText}
                    onChangeText={setCommentText}
                  />
                  <Pressable
                    onPress={() => addComment(item.id)}
                    style={({ pressed }) => [
                      styles.postButton,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={styles.buttonText}>Submit</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", padding: 20 },
  input: { color: "#fff", marginBottom: 10, backgroundColor: "#333", padding: 10, borderRadius: 5 },
  actions: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  imageButton: { backgroundColor: "#444", padding: 10, borderRadius: 5, flex: 1, marginRight: 5 },
  postButton: { backgroundColor: "#007BFF", padding: 10, borderRadius: 5, flex: 1 },
  buttonPressed: { opacity: 0.7 },
  buttonText: { color: "#fff", fontWeight: "bold", textAlign: "center" },
  card: { backgroundColor: "#1c1c1c", margin: 10, padding: 15, borderRadius: 10 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  userInfo: { flexDirection: "row", alignItems: "center" },
  userAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  userName: { color: "#fff", fontWeight: "bold" },
  cardText: { color: "#fff", marginTop: 10 },
  cardImage: { width: "100%", height: 200, borderRadius: 10, marginTop: 10 },
  postActions: { flexDirection: "row", justifyContent: "center", marginTop: 10 },
  actionButton: { flex: 1, alignItems: "center", padding: 10, marginHorizontal: 5, backgroundColor: "#333", borderRadius: 5 },
  actionButtonText: { color: "#fff" },
  commentSection: { marginTop: 10, padding: 10, backgroundColor: "#2c2c2c", borderRadius: 5 },
  commentInput: { backgroundColor: "#333", color: "#fff", padding: 10, borderRadius: 5, marginBottom: 10 },
});

export default CommunityScreen;
