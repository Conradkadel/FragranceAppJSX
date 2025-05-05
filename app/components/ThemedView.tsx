import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';

export type ThemedViewProps = ViewProps;

export const ThemedView: React.FC<ThemedViewProps> = ({ style, ...otherProps }) => {
  return (
    <View
      style={[
        styles.base,
        style,
      ]}
      {...otherProps}
    />
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#fff',
  },
});

export default ThemedView;