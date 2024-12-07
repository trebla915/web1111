import React from 'react';
import { Text, TextProps } from 'react-native';

type ThemedTextProps = TextProps & {
  type: 'title' | 'link' | 'body';
};

const ThemedText: React.FC<ThemedTextProps> = ({ type, children, ...props }) => {
  let style = {};

  switch(type) {
    case 'title':
      style = { fontSize: 24, fontWeight: 'bold' };
      break;
    case 'link':
      style = { color: '#007AFF', textDecorationLine: 'underline' };
      break;
    default:
      style = { fontSize: 16 };
  }

  return <Text style={style} {...props}>{children}</Text>;
};

export default ThemedText;
