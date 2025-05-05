import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';

interface ThemedTextProps extends TextProps {
  type?: 'title' | 'subtitle' | 'body';
}

export const ThemedText: React.FC<ThemedTextProps> = ({ style, type = 'body', ...props }) => {
  return <Text style={[styles[type], style]} {...props} />;
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
  },
}); 