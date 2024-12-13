import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { Menu, Divider } from "react-native-paper";
import { CommunityPost } from "../utils/types";

interface PostCardProps {
  post: CommunityPost;
  onCommentPress: (postId: string) => void;
  onLikePress: (postId: string) => void;
  onOptionsPress: (action: "report" | "edit" | "delete" | "block", postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onCommentPress,
  onLikePress,
  onOptionsPress,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const handleMenuPress = (action: "report" | "edit" | "delete" | "block") => {
    closeMenu();
    onOptionsPress(action, post.id);
  };

  const displayedComments = showAllComments
    ? post.comments
    : post.comments.slice(0, 3);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={{ uri: post.user.avatar }} style={styles.avatar} />
          <Text style={styles.userName}>{post.user.name}</Text>
        </View>
        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={
            <Pressable onPress={openMenu}>
              <Text style={styles.optionsIcon}>⋯</Text>
            </Pressable>
          }
        >
          <Menu.Item onPress={() => handleMenuPress("report")} title="Report" />
          <Divider />
          <Menu.Item onPress={() => handleMenuPress("edit")} title="Edit" />
          <Divider />
          <Menu.Item onPress={() => handleMenuPress("delete")} title="Delete" />
          <Divider />
          <Menu.Item onPress={() => handleMenuPress("block")} title="Block" />
        </Menu>
      </View>
      {post.text && <Text style={styles.text}>{post.text}</Text>}
      {post.image && <Image source={{ uri: post.image }} style={styles.image} />}
      <View style={styles.actions}>
        <Pressable onPress={() => onLikePress(post.id)}>
          <Text style={styles.actionText}>❤️ {post.likes.length}</Text>
        </Pressable>
        <Pressable onPress={() => onCommentPress(post.id)}>
          <Text style={styles.actionText}>💬 Comment</Text>
        </Pressable>
      </View>
      <View style={styles.commentsSection}>
        {displayedComments.map((comment, index) => (
          <View key={index} style={styles.comment}>
            <Image source={{ uri: comment.user.avatar }} style={styles.commentAvatar} />
            <Text style={styles.commentText}>
              <Text style={styles.commentUser}>{comment.user.name}:</Text> {comment.text}
            </Text>
          </View>
        ))}
        {post.comments.length > 3 && (
          <TouchableOpacity onPress={() => setShowAllComments(!showAllComments)}>
            <Text style={styles.showMoreText}>
              {showAllComments ? "Show Less" : "Show More Comments"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginVertical: 10,
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  userName: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  optionsIcon: {
    color: "#888",
    fontSize: 24,
    transform: [{ rotate: "90deg" }],
  },
  text: {
    color: "#fff",
    marginVertical: 10,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 15,
    marginVertical: 10,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionText: {
    color: "#fff",
    fontWeight: "bold",
  },
  commentsSection: {
    marginTop: 10,
  },
  comment: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  commentText: {
    color: "#ccc",
  },
  commentUser: {
    fontWeight: "bold",
    color: "#fff",
  },
  showMoreText: {
    color: "#00f",
    marginTop: 5,
    fontWeight: "bold",
  },
});

export default PostCard;