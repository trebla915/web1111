// File: CommunityScreen.tsx
// Summary: Handles community posts functionality including creation, editing, liking, and deleting posts.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  TouchableOpacity,
  Modal,
  Button,
} from 'react-native';
import { db, storage } from '../../src/config/firebase.native';
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  increment,
  updateDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';

// Community Screen Component
const CommunityScreen: React.FC = () => {
  const { firebaseUser } = useAuth(); // Fetch current authenticated user
  const [communityData, setCommunityData] = useState<
    Array<{
      id: string;
      text: string;
      image?: string;
      likes: number;
      user: { id: string; name: string; avatar: string };
      comments: any[];
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newImage, setNewImage] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<any>(null); // For editing the post
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Fetch posts from Firestore
  const fetchCommunityData = async () => {
    setLoading(true);
    try {
      const communityRef = collection(db, 'communityPosts');
      const communityQuery = query(communityRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(communityQuery);

      const fetchedData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
        user: doc.data().user || { id: '', name: 'Anonymous', avatar: 'https://via.placeholder.com/50' }, // Default user info
      }));

      setCommunityData(fetchedData);
    } catch (error) {
      console.error('Error fetching community data:', error);
      Alert.alert('Error', 'Failed to load community data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityData();
  }, []);

  // Image Picker and Compression
  const pickImage = async () => {
    try {
      const pickerResult = await ImagePicker.launchImageLibraryAsync();
      if (!pickerResult.canceled && pickerResult.assets.length > 0) {
        const localUri = pickerResult.assets[0].uri;

        // Compress and resize the image
        const manipulatedImage = await ImageManipulator.manipulateAsync(localUri, [{ resize: { width: 500, height: 500 } }], {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        });

        // Upload image to Firebase Storage
        const filePath = `communityPosts/${Date.now()}.jpg`;
        const response = await fetch(manipulatedImage.uri);
        const blob = await response.blob();

        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, blob);
        const downloadUrl = await getDownloadURL(storageRef);

        setNewImage(downloadUrl);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image.');
    }
  };

  // Add new post
  const addNewPost = async () => {
    if (!firebaseUser) {
      Alert.alert('Error', 'You must be logged in to create a post.');
      return;
    }

    if (newComment.trim() === '') {
      Alert.alert('Empty Post', 'Please add text to your post before submitting.');
      return;
    }

    try {
      const communityRef = collection(db, 'communityPosts');
      const newPost = {
        text: newComment,
        image: newImage || null,
        likes: 0,
        user: {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Anonymous',
          avatar: firebaseUser.photoURL || 'https://via.placeholder.com/50',
        },
        comments: [],
        createdAt: new Date(),
      };

      await addDoc(communityRef, newPost);
      fetchCommunityData();
      setNewComment('');
      setNewImage(null);
    } catch (error) {
      console.error('Error posting message:', error);
      Alert.alert('Error', 'Failed to post your message.');
    }
  };

  // Like Post
  const likePost = async (postId: string) => {
    try {
      const postRef = doc(db, 'communityPosts', postId);
      await updateDoc(postRef, {
        likes: increment(1),
      });
      fetchCommunityData();
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to like the post.');
    }
  };

  // Delete Post
  const deletePost = async (postId: string) => {
    try {
      const postRef = doc(db, 'communityPosts', postId);
      await deleteDoc(postRef);
      fetchCommunityData();
    } catch (error) {
      console.error('Error deleting post:', error);
      Alert.alert('Error', 'Failed to delete the post.');
    }
  };

  // Render UI
  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#fff" style={styles.loadingIndicator} />
      ) : (
        <FlatList
          data={communityData}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text>{item.text}</Text>
              {item.image && <Image source={{ uri: item.image }} style={styles.cardImage} />}
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 20 },
  loadingIndicator: { justifyContent: 'center', alignItems: 'center' },
  postContainer: { backgroundColor: '#1c1c1c', padding: 15, borderRadius: 10, marginBottom: 20 },
  input: { backgroundColor: '#2c2c2c', color: '#fff', borderRadius: 5, padding: 10, marginBottom: 10 },
  newImagePreview: { width: 100, height: 100, borderRadius: 10, marginBottom: 10 },
  postButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  imageButton: { backgroundColor: '#444', padding: 10, borderRadius: 5 },
  postButton: { backgroundColor: '#444', padding: 10, borderRadius: 5 },
  buttonText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  card: { backgroundColor: '#1c1c1c', padding: 15, borderRadius: 10, marginBottom: 15 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  userAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  userName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardText: { color: '#fff', fontSize: 16, marginBottom: 10 },
  cardImage: { width: '100%', height: 150, borderRadius: 10, marginBottom: 10 },
  likesText: { color: '#fff', marginBottom: 10 },
  modalContainer: { flex: 1, backgroundColor: '#000', padding: 20 },
});

export default CommunityScreen;