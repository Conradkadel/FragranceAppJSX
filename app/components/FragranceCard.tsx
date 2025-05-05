import React from 'react';
import {
  TouchableOpacity,
  Image,
  View,
  StyleSheet,
} from 'react-native';
import { ThemedText } from './ThemedText';

export interface FragranceCardProps {
  fragrance: {
    fragrance_name: string;
    imageUrl: string;
    notes: { top_notes: string[] };
  };
  onPress: (name: string) => void;
}

export const FragranceCard: React.FC<FragranceCardProps> = ({ fragrance, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(fragrance.fragrance_name)}
    >
      <Image
        source={{ uri: fragrance.imageUrl }}
        style={styles.image}
        resizeMode="contain"
      />
      <View style={styles.content}>
        <ThemedText type="subtitle" numberOfLines={1}>
          {fragrance.fragrance_name}
        </ThemedText>
        <ThemedText numberOfLines={2}>
          {(fragrance.notes?.top_notes ?? []).join(', ')}
        </ThemedText>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 150,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 120,
  },
  content: {
    padding: 12,
  },
});
