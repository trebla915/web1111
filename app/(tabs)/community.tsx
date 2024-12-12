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

  const fetchCommunityData = async () => {
    try {
      const communityRef = collection(db, "communityPosts");
      const communityQuery = query(communityRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(communityQuery);

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
        .filter((post) => post.status === "public");

      setCommunityData(fetchedData);
    } catch (error) {
      console.error("Error fetching community data:", error);
      Alert.alert("Error", "Failed to load community data.");
    }
  };

  useEffect(() => {
    fetchCommunityData();
  }, []);

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

      await fetchCommunityData();
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

      await fetchCommunityData();
      Keyboard.dismiss();
      Alert.alert("Success", "Your post has been added.");
    } catch (error) {
      console.error("Error posting to the community:", error);
      Alert.alert("Error", "Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  const handlePostOptions = async (postId: string, action: "report" | "edit" | "delete") => {
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
      }
    } catch (error) {
      console.error("Error processing post action:", error);
      Alert.alert("Error", "An error occurred while processing your request.");
    }
  };

  const submitReport = async (reason: string, details: string) => {
    if (reportingPostId) {
      const postRef = doc(db, "communityPosts", reportingPostId);
      const postSnapshot = await getDoc(postRef);

      if (postSnapshot.exists()) {
        const post = postSnapshot.data() as CommunityPost;
        const reportedPostsRef = collection(db, "reportedPosts");

        await addDoc(reportedPostsRef, {
          ...post,
          status: "reported",
          reportDetails: { reason, details },
          reportedBy: {
            id: userData?.id,
            name: userData?.name,
          },
          reportedAt: new Date(),
        });

        await deleteDoc(postRef);
        setCommunityData((prevData) => prevData.filter((item) => item.id !== reportingPostId));
        Alert.alert("Report Submitted", "The post has been reported.");
      }
      setReportModalVisible(false);
      setReportingPostId(null);
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
      await fetchCommunityData();
      Alert.alert("Success", "The post has been updated.");
    } catch (error) {
      console.error("Error updating post:", error);
      Alert.alert("Error", "Failed to update the post.");
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
              onCommentPress={(postId) => setSelectedPostId(postId)}
              onLikePress={(postId) => Alert.alert(`Liked post: ${postId}`)}
              onOptionsPress={(action, postId) =>
                handlePostOptions(postId, action)
              }
            />
          )}
          contentContainerStyle={styles.listContent}
        />
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
});

export default CommunityScreen;