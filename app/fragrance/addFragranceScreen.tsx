// screens/AddFragranceScreen.tsx
import React, { useState } from 'react';
import { StyleSheet, ScrollView, TextInput, Button, Alert } from 'react-native';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { loadFragranceNote, saveFragranceNote, FragranceNote, FriendInventory } from '../services/localStorage';

const SEASONS = ['N/A', 'Summer', 'Fall', 'Winter', 'Spring'] as const;
const PRICE_POINTS = ['N/A', '1 - 30', '31 - 70', '71 - 110', '111 - 150', '151 - 200', '201 - 250', '251 - 300'] as const;
const FRIEND_NAMES = ['Allen', 'Dino', 'Ben', 'Conrad'] as const;
const INVENTORY_STATUSES = ['30ML Bottle', '50ML Bottle', '75ML Bottle', '100ML Bottle', '2 ML Sample', '1.5 ML Sample', '1 ML Sample', 'Don\'t Have', 'Want', 'All'] as const;
const RATINGS = ['N/A', ...Array.from({ length: 10 }, (_, i) => (i + 1).toString())] as string[];
const LONGEVITY_HOURS = ['N/A', ...Array.from({ length: 24 }, (_, i) => (i + 1).toString())] as string[];
const SILLAGE_RATINGS = ['N/A', ...Array.from({ length: 5 }, (_, i) => (i + 1).toString())] as string[];

type Season = typeof SEASONS[number];
type PricePoint = typeof PRICE_POINTS[number];
type FriendName = typeof FRIEND_NAMES[number];
type InventoryStatus = typeof INVENTORY_STATUSES[number];
type Rating = string;
type LongevityHours = string;
type SillageRating = string;
type Favourite = boolean;

interface Note {
  thoughts: string;
  remindsOf: string;
  season: Season;
  pricePoint: PricePoint;
  inventoryStatus: InventoryStatus;
  friendInventories: FriendInventory[];
  rating: Rating;
  longevityHours: LongevityHours;
  sillageRating: SillageRating;
  favourite: Favourite;
}

export default function AddFragranceScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  
  const [note, setNote] = useState<Note>({
      thoughts: '',
      remindsOf: '',
      season: SEASONS[0],
      pricePoint: PRICE_POINTS[0],
      inventoryStatus: INVENTORY_STATUSES[0],
      friendInventories: [],
      rating: RATINGS[0],
      longevityHours: LONGEVITY_HOURS[0],
      sillageRating: SILLAGE_RATINGS[0],
      favourite: false,
    });
  const navigation = useNavigation();
  const { id } = useLocalSearchParams();

  const handleSave = async () => {
      if (typeof id === 'string') {
        try {
          await saveFragranceNote("fragrance_note_" + id, {
            ...note,
            remindsOf: note.remindsOf,
          });
          Alert.alert('Success', 'Your notes have been saved!');
          router.back();
        } catch (error) {
          Alert.alert('Error', 'Failed to save your notes. Please try again.');
        } finally {
          // setIsSaving(false);
        }
      }
    };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={styles.label}>Fragrance Name</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="e.g. Citrus Burst"
          value={name}
          onChangeText={setName}
        />

        <ThemedText style={styles.label}>Tasting Notes</ThemedText>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Describe the scent…"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
        />

        <Button title="Save" onPress={handleSave} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  label: {
    fontSize: 16,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    marginTop: 6,
  },
  multiline: {
    height: 100,
    textAlignVertical: 'top',
  },
});
