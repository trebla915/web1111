import React, { useState, useEffect } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  RefreshControl,
  Text,
} from "react-native";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { useAuth } from "../../src/contexts/AuthContext";
import { useUser } from "../../src/contexts/UserContext";
import { useLoading } from "../../src/contexts/LoadingContext";
import PostCard from "../../src/components/PostCard";
import WritePostInput from "../../src/components/WritePostInput";
import ReportPostModal from "../../src/components/ReportModal";
import EditPostModal from "../../src/components/EditPostModal";
import { uploadImageToStorage } from "../../src/utils/uploadImageToStorage";

interface CommunityPost {
  id: string;
  text: string;
  image?: string;
  likes: string[];
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  comments: {
    user: {
      id: string;
      name: string;
      avatar: string;
    };
    text: string;
    createdAt: Date;
  }[];
  createdAt: Date;
  status: "public" | "reported" | "reviewing" | "deleted";
}

const db = getFirestore();

const CommunityScreen: React.FC = () => {
  const { firebaseUser } = useAuth();
  const { userData } = useUser();
  const { setLoading } = useLoading();
  const [communityData, setCommunityData] = useState<CommunityPost[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCommunityData = async () => {
    try {
      const communityRef = collection(db, "communityPosts");
      const communityQuery = query(communityRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(communityQuery);

      const userDoc = firebaseUser
        ? await getDoc(doc(db, "users", firebaseUser.uid))
        : null;
      const blockedUsers = userDoc?.exists() ? userDoc.data()?.blockedUsers || [] : [];

      const fetchedData: CommunityPost[] = querySnapshot.docs
        .map((doc) => {
          const data = doc.data() as Omit<CommunityPost, "id">;
          return {
            id: doc.id,
            ...data,
            user: {
              id: data.user?.id || "Unknown",
              name: data.user?.name || "Anonymous",
              avatar: data.user?.avatar || "https://via.placeholder.com/50",
            },
          };
        })
        .filter(
          (post) => post.status === "public" && !blockedUsers.includes(post.user.id)
        );

      setCommunityData(fetchedData);
    } catch (error) {
      console.error("Error fetching community data:", error);
      Alert.alert("Error", "Failed to load community data.");
    }
  };

  useEffect(() => {
    fetchCommunityData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCommunityData();
    setRefreshing(false);
  };

  const handleAddComment = async (postId: string, commentText: string) => {
    if (!firebaseUser) {
      Alert.alert("Restricted Action", "Please log in to comment.");
      return;
    }

    if (!commentText.trim()) {
      Alert.alert("Error", "Comment cannot be empty.");
      return;
    }

    try {
      const postRef = doc(db, "communityPosts", postId);
      const postSnapshot = await getDoc(postRef);

      if (!postSnapshot.exists()) {
        Alert.alert("Error", "The post does not exist.");
        return;
      }

      const post = postSnapshot.data() as CommunityPost;

      const newComment = {
        user: {
          id: userData!.id,
          name: userData!.name || "Anonymous",
          avatar: userData!.avatar || "https://via.placeholder.com/50",
        },
        text: commentText.trim(),
        createdAt: new Date(),
      };

      await updateDoc(postRef, { comments: [...post.comments, newComment] });

      fetchCommunityData();
      setSelectedPostId(null);
      Alert.alert("Success", "Your comment has been added.");
    } catch (error) {
      console.error("Error adding comment:", error);
      Alert.alert("Error", "Failed to add comment.");
    }
  };

  const handlePostSubmit = async (text: string, imageUri?: string) => {
    if (!firebaseUser) {
      Alert.alert("Restricted Action", "Please log in to create a post.");
      return;
    }

    if (!text.trim() && !imageUri) {
      Alert.alert("Error", "You must provide either text or an image.");
      return;
    }

    try {
      setLoading(true);

      const imageUrl = imageUri
        ? await uploadImageToStorage(imageUri, `communityPosts/${Date.now()}.jpg`)
        : undefined;

      const newPost: Omit<CommunityPost, "id"> = {
        text: text.trim(),
        ...(imageUrl && { image: imageUrl }),
        likes: [],
        user: {
          id: userData!.id,
          name: userData!.name || "Anonymous",
          avatar: userData!.avatar || "https://via.placeholder.com/50",
        },
        comments: [],
        createdAt: new Date(),
        status: "public",
      };

      const communityRef = collection(db, "communityPosts");
      await addDoc(communityRef, newPost);

      fetchCommunityData();
      Keyboard.dismiss();
      Alert.alert("Success", "Your post has been added.");
    } catch (error) {
      console.error("Error creating post:", error);
      Alert.alert("Error", "Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => setSelectedPostId(null)}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          data={communityData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onCommentPress={(postId) => {
                if (!firebaseUser) {
                  Alert.alert("Restricted Action", "Please log in to comment.");
                  return;
                }
                setSelectedPostId(postId);
              }}
              onLikePress={(postId) => {
                if (!firebaseUser) {
                  Alert.alert("Restricted Action", "Please log in to like posts.");
                  return;
                }
                Alert.alert(`Liked post: ${postId}`);
              }}
              onOptionsPress={(action, postId) => {
                if (!firebaseUser) {
                  Alert.alert("Restricted Action", "Please log in to perform actions.");
                  return;
                }
                Alert.alert(`Options for post: ${postId}`);
              }}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
        {!firebaseUser && (
          <View style={styles.readOnlyMessageContainer}>
            <Text style={styles.readOnlyText}>
              You are viewing the community in read-only mode. Log in to interact with posts.
            </Text>
          </View>
        )}
        {firebaseUser && (
          <WritePostInput
            onSubmit={
              selectedPostId
                ? (text) => handleAddComment(selectedPostId, text)
                : handlePostSubmit
            }
            placeholder={
              selectedPostId ? "Write a comment..." : "Write a new post..."
            }
            isCommentInput={!!selectedPostId}
          />
        )}
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 80,
    paddingTop: 20,
  },
  readOnlyMessageContainer: {
    padding: 10,
    backgroundColor: "#1c1c1c",
    borderRadius: 5,
    margin: 10,
    alignItems: "center",
  },
  readOnlyText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
});

export default CommunityScreen;