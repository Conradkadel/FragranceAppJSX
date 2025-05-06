import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Fragrance } from '../services/api';

interface FragranceCardProps {
  fragrance: Fragrance;
  onPress: (id: string) => void;
}

export function FragranceCard({ fragrance, onPress }: FragranceCardProps) {
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
        <Text style={styles.title} numberOfLines={1}>
          {fragrance.fragrance_name}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {(fragrance.notes?.top_notes ?? []).join(', ')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
