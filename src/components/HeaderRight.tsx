// File: HeaderRight.tsx
// Summary: Reusable "header right" component for the home navigation button.

import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

const HeaderRight: React.FC = () => {
  const router = useRouter();

  return (
    <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
      <View style={styles.container}>
        <Icon name="home" size={24} color="#ffffff" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
  },
});

export default HeaderRight;
