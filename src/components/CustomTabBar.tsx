import React from 'react';
import { RollingBallTab } from 'react-native-floating-tab'; // Import RollingBallTab

const tabs = [
  { name: 'Home', icon: 'home' },
  { name: 'Events', icon: 'calendar' },
  { name: 'Book', icon: 'book' },
  { name: 'Community', icon: 'people' },
  { name: 'Account', icon: 'user' },
];

export default function CustomTabBar(props: any) {
  return (
    <RollingBallTab
      {...props}
      tabs={tabs}
      ballBackgroundColor="#000" // Set the rolling ball background to black
      activeColor="#fff" // Active icon color inside the black ball (white for contrast)
      inactiveColor="#bbb" // Inactive icon color for other tabs
      backgroundColor="#fff" // Tab bar container background color
    />
  );
}