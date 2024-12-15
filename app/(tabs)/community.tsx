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

// Interface for community posts, defining their structure
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

  // Check if the user is logged in, read-only mode if not
  const isReadOnly = !firebaseUser;

  const fetchCommunityData = async () => {
    try {
      const communityRef = collection(db, "communityPosts");
      const communityQuery = query(communityRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(communityQuery);

      const userDoc = firebaseUser?.uid
        ? await getDoc(doc(db, "users", firebaseUser.uid))
        : null;
      const blockedUsers = userDoc?.exists()
        ? userDoc.data()?.blockedUsers || []
        : [];

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
    if (!userData) {
      Alert.alert("Error", "You must be logged in to comment.");
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
          id: userData.id,
          name: userData.name || "Anonymous",
          avatar: userData.avatar || "https://via.placeholder.com/50",
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
    if (!userData) {
      Alert.alert("Error", "You must be logged in to post.");
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
          id: userData.id,
          name: userData.name || "Anonymous",
          avatar: userData.avatar || "https://via.placeholder.com/50",
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

  const submitReport = async (reason: string, details: string) => {
    if (!reportingPostId) return;

    try {
      const postRef = doc(db, "communityPosts", reportingPostId);
      const postSnapshot = await getDoc(postRef);

      if (!postSnapshot.exists()) {
        Alert.alert("Error", "The post does not exist.");
        return;
      }

      const post = postSnapshot.data() as CommunityPost;
      const reportedPostsRef = collection(db, "reportedPosts");

      await addDoc(reportedPostsRef, {
        ...post,
        status: "reported",
        reportDetails: { reason, details },
        reportedBy: {
          id: userData?.id || "unknown",
          name: userData?.name || "Anonymous",
        },
        reportedAt: new Date(),
      });

      await deleteDoc(postRef);
      setCommunityData((prev) => prev.filter((item) => item.id !== reportingPostId));
      Alert.alert("Success", "Report submitted.");
      setReportingPostId(null);
      setReportModalVisible(false);
    } catch (error) {
      console.error("Error submitting report:", error);
      Alert.alert("Error", "Failed to submit report.");
    }
  };

  const handleEditSubmit = async (text: string, imageUri?: string) => {
    if (!editingPostId) return;

    try {
      setLoading(true);
      const postRef = doc(db, "communityPosts", editingPostId);

      const updates: Partial<CommunityPost> = {};
      if (text) updates.text = text.trim();
      if (imageUri) {
        updates.image = await uploadImageToStorage(
          imageUri,
          `communityPosts/${Date.now()}.jpg`
        );
      }

      await updateDoc(postRef, updates);
      setEditingPostId(null);
      setEditModalVisible(false);
      fetchCommunityData();
      Alert.alert("Success", "Post updated.");
    } catch (error) {
      console.error("Error editing post:", error);
      Alert.alert("Error", "Failed to update the post.");
    } finally {
      setLoading(false);
    }
  };

  const handlePostOptions = async (
    postId: string,
    action: "report" | "edit" | "delete" | "block",
    userId?: string
  ) => {
    try {
      const postRef = doc(db, "communityPosts", postId);
      const postSnapshot = await getDoc(postRef);

      if (!postSnapshot.exists()) {
        Alert.alert("Error", "The post does not exist.");
        return;
      }

      const post = postSnapshot.data() as CommunityPost;

      if (action === "delete") {
        if (post.user.id !== userData?.id) {
          Alert.alert("Error", "You can only delete your own posts.");
          return;
        }
        await updateDoc(postRef, { status: "deleted" });
        setCommunityData((prev) => prev.filter((p) => p.id !== postId));
        Alert.alert("Success", "Post deleted successfully.");
      } else if (action === "report") {
        setReportingPostId(postId);
        setReportModalVisible(true);
      } else if (action === "edit") {
        if (post.user.id !== userData?.id) {
          Alert.alert("Error", "You can only edit your own posts.");
          return;
        }
        setEditingPostId(postId);
        setEditModalVisible(true);
      } else if (action === "block" && userId) {
        const userDocRef = doc(db, "users", firebaseUser?.uid || "");
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const currentBlockedUsers = userDoc.data()?.blockedUsers || [];
          await updateDoc(userDocRef, {
            blockedUsers: [...currentBlockedUsers, userId],
          });

          Alert.alert("Success", "User has been blocked.");
          fetchCommunityData();
        }
      }
    } catch (error) {
      console.error("Error processing post action:", error);
      Alert.alert("Error", "An error occurred while processing your request.");
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const postRef = doc(db, "communityPosts", postId);
      const postSnapshot = await getDoc(postRef);

      if (!postSnapshot.exists()) {
        Alert.alert("Error", "The post does not exist.");
        return;
      }

      const post = postSnapshot.data() as CommunityPost;
      const likes = post.likes;

      if (likes.includes(firebaseUser?.uid || "")) {
        // If user already liked, remove their like
        await updateDoc(postRef, { likes: likes.filter((id) => id !== firebaseUser?.uid) });
      } else {
        // Add user's like
        await updateDoc(postRef, { likes: [...likes, firebaseUser?.uid || ""] });
      }

      fetchCommunityData();
    } catch (error) {
      console.error("Error handling like:", error);
      Alert.alert("Error", "An error occurred while liking the post.");
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
              onCommentPress={isReadOnly ? () => {} : (postId) => setSelectedPostId(postId)}
              onLikePress={isReadOnly ? () => {} : (postId) => handleLikePost(postId)} // Disable like button if read-only
              onOptionsPress={isReadOnly ? () => {} : (action, postId) => handlePostOptions(postId, action, item.user.id)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
        {isReadOnly && (
          <View style={styles.readOnlyMessage}>
            <Text style={styles.readOnlyText}>You must log in to interact with posts.</Text>
          </View>
        )}
        {!isReadOnly && (
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
        {reportModalVisible && (
          <ReportPostModal
            onSubmit={submitReport}
            onCancel={() => setReportModalVisible(false)}
          />
        )}
        {editModalVisible && (
          <EditPostModal
            visible={editModalVisible}
            onSubmit={(text, imageUri) => handleEditSubmit(text, imageUri)}
            onCancel={() => setEditModalVisible(false)}
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
  readOnlyMessage: {
    alignItems: "center",
    marginVertical: 10,
  },
  readOnlyText: {
    color: "#fff",
    fontSize: 16,
    fontStyle: "italic",
  },
});

export default CommunityScreen;