import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { fetchFragranceById, Fragrance } from '../services/api';
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

export default function FragranceDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [fragrance, setFragrance] = useState<Fragrance | null>(null);
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
    favourite: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  // Track which friend entry is selected (string) and derive numeric index
  const [selectedFriendValue, setSelectedFriendValue] = useState<string>('');
  const selectedFriendIndex = parseInt(selectedFriendValue, 10);

  useEffect(() => {
    loadFragrance();
    loadSavedNote();
  }, [id]);

  const loadFragrance = async () => {
    if (typeof id === 'string') {
      const data = await fetchFragranceById(id);
      setFragrance(data);
    }
  };

  const loadSavedNote = async () => {
    if (typeof id === 'string') {
      const savedNote = await loadFragranceNote(id);
      if (savedNote) {
        setNote({
          thoughts: savedNote.thoughts,
          remindsOf: savedNote.remindsOf ?? '',
          season: savedNote.season as Season,
          pricePoint: savedNote.pricePoint as PricePoint,
          friendInventories: savedNote.friendInventories?.map(fi => ({
            friendName: fi.friendName as FriendName,
            inventoryStatus: fi.inventoryStatus as InventoryStatus,
          })) ?? [],
          inventoryStatus: (savedNote.inventoryStatus ?? INVENTORY_STATUSES[0]) as InventoryStatus,
          rating: savedNote.rating ?? RATINGS[0],
          longevityHours: savedNote.longevityHours ?? LONGEVITY_HOURS[0],
          sillageRating: savedNote.sillageRating ?? SILLAGE_RATINGS[0],
          favourite: false,
        });
      }
    }
  };

  const handleSave = async () => {
    if (typeof id === 'string') {
      try {
        setIsSaving(true);
        await saveFragranceNote(id, {
          ...note,
          remindsOf: note.remindsOf,
        });
        Alert.alert('Success', 'Your notes have been saved!');
        router.back();
      } catch (error) {
        Alert.alert('Error', 'Failed to save your notes. Please try again.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Helpers to manage dynamic friend inventories
  const addFriendInventory = () => {
    setNote(prev => ({
      ...prev,
      friendInventories: [
        ...prev.friendInventories,
        { friendName: FRIEND_NAMES[0], inventoryStatus: INVENTORY_STATUSES[0] },
      ],
    }));
  };

  const updateFriendInventory = <K extends keyof FriendInventory>(index: number, key: K, value: FriendInventory[K]) => {
    setNote(prev => {
      const arr = [...prev.friendInventories];
      arr[index] = { ...arr[index], [key]: value };
      return { ...prev, friendInventories: arr };
    });
  };

  const removeFriendInventory = (index: number) => {
    setNote(prev => ({
      ...prev,
      friendInventories: prev.friendInventories.filter((_, i) => i !== index),
    }));
  };

  if (!fragrance) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText style={{textAlign: 'center'}} type="title">{fragrance.fragrance_name}</ThemedText>
        <ThemedText style={styles.description}>{fragrance.description}</ThemedText>
        <ThemedText type="subtitle"style={styles.fragranceScentNotesTitle}>Top Notes:</ThemedText>
        <ThemedText type="subtitle"style={styles.fragranceScentNotes}>{fragrance.notes.top_notes?.join(', ') ?? 'N/A'}</ThemedText>
        <ThemedText type="subtitle" style={styles.fragranceScentNotesTitle}>Middle Notes:</ThemedText>
        <ThemedText type="subtitle" style={styles.fragranceScentNotes}>{fragrance.notes.middle_notes?.join(', ') ?? 'N/A'}</ThemedText>
        <ThemedText type="subtitle" style={styles.fragranceScentNotesTitle}>Base Notes:</ThemedText>
        <ThemedText type="subtitle" style={styles.fragranceScentNotes}>{fragrance.notes.base_notes?.join(', ') ?? 'N/A'}</ThemedText>


        <View style={styles.notesSection}>
          <ThemedText type="subtitle">Your Notes</ThemedText>
          
          <TextInput
            style={styles.textInput}
            value={note.thoughts}
            onChangeText={(text) => setNote({ ...note, thoughts: text })}
            placeholder="Write your thoughts about this fragrance..."
            multiline
            numberOfLines={4}
          />

          {/* New section: What this fragrance reminds the user of */}
          <ThemedText type="subtitle">This Fragrance Reminds Me Of</ThemedText>
          <TextInput
            style={styles.textInput}
            value={note.remindsOf}
            onChangeText={(text) => setNote({ ...note, remindsOf: text })}
            placeholder="Describe what this fragrance reminds you of..."
            multiline
            numberOfLines={2}
          />

          <View style={styles.pickerContainer}>
            <ThemedText>Season:</ThemedText>
            <Picker
              selectedValue={note.season}
              onValueChange={(value) => setNote({ ...note, season: value })}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {SEASONS.map((season) => (
                <Picker.Item key={season} label={season} value={season} />
              ))}
            </Picker>
          </View>

          <View style={styles.pickerContainer}>
            <ThemedText>Price Point:</ThemedText>
            <Picker
              selectedValue={note.pricePoint}
              onValueChange={(value) => setNote({ ...note, pricePoint: value })}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {PRICE_POINTS.map((price) => (
                <Picker.Item key={price} label={price} value={price} />
              ))}
            </Picker>
          </View>

          <View style={styles.pickerContainer}>
            <ThemedText>My Inventory Status:</ThemedText>
            <Picker
              selectedValue={note.inventoryStatus}
              onValueChange={(value) => setNote({ ...note, inventoryStatus: value })}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {INVENTORY_STATUSES.map((status) => (
                <Picker.Item key={status} label={status} value={status} />
              ))}
            </Picker>
          </View>

          {/* Summary dropdown of friend inventories */}
          {note.friendInventories.length > 0 && (
            <View style={styles.pickerContainer}>
              <ThemedText>Friend Inventories:</ThemedText>
              <Picker
                selectedValue={selectedFriendValue}
                onValueChange={(value) => setSelectedFriendValue(value)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="Select entry..." value="" />
                {note.friendInventories.map((fi, idx) => (
                  <Picker.Item key={idx} label={`${fi.friendName}: ${fi.inventoryStatus}`} value={`${idx}`} />
                ))}
              </Picker>
            </View>
          )}

          {/* Detail editing for selected entry */}
          {selectedFriendIndex >= 0 && selectedFriendValue !== '' && note.friendInventories[selectedFriendIndex] && (
            <View style={styles.friendRow} key={selectedFriendIndex}>
              <View style={styles.pickerContainer}>
                <ThemedText>Friend:</ThemedText>
                <Picker
                  selectedValue={note.friendInventories[selectedFriendIndex].friendName}
                  onValueChange={(value) => updateFriendInventory(selectedFriendIndex, 'friendName', value as FriendName)}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  {FRIEND_NAMES.map((friend) => (
                    <Picker.Item key={friend} label={friend} value={friend} />
                  ))}
                </Picker>
              </View>
              <View style={styles.pickerContainer}>
                <ThemedText>Bottle/Decant:</ThemedText>
                <Picker
                  selectedValue={note.friendInventories[selectedFriendIndex].inventoryStatus}
                  onValueChange={(value) => updateFriendInventory(selectedFriendIndex, 'inventoryStatus', value as InventoryStatus)}
                  style={styles.picker}
                  itemStyle={styles.pickerItem}
                >
                  {INVENTORY_STATUSES.map((status) => (
                    <Picker.Item key={status} label={status} value={status} />
                  ))}
                </Picker>
              </View>
              <TouchableOpacity onPress={() => { removeFriendInventory(selectedFriendIndex); setSelectedFriendValue(''); }} style={styles.removeButton}>
                <ThemedText>Remove</ThemedText>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity onPress={addFriendInventory} style={styles.addButton}>
            <ThemedText>+ Add Friend Inventory</ThemedText>
          </TouchableOpacity>

          <View style={styles.pickerContainer}>
            <ThemedText>Rating (1-10):</ThemedText>
            <Picker
              selectedValue={note.rating}
              onValueChange={(value) => setNote({ ...note, rating: value })}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {RATINGS.map(r => (
                <Picker.Item key={r} label={r} value={r} />
              ))}
            </Picker>
          </View>

          <View style={styles.pickerContainer}>
            <ThemedText>Longevity (Hours):</ThemedText>
            <Picker
              selectedValue={note.longevityHours}
              onValueChange={(value) => setNote({ ...note, longevityHours: value })}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {LONGEVITY_HOURS.map(h => (
                <Picker.Item key={h} label={h} value={h} />
              ))}
            </Picker>
          </View>

          <View style={styles.pickerContainer}>
            <ThemedText>Sillage (1-5):</ThemedText>
            <Picker
              selectedValue={note.sillageRating}
              onValueChange={(value) => setNote({ ...note, sillageRating: value })}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {SILLAGE_RATINGS.map(s => (
                <Picker.Item key={s} label={s} value={s} />
              ))}
            </Picker>
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={isSaving}
          >
            <ThemedText style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Notes'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fragranceScentNotes: {
    fontSize: 16,
    fontWeight: 'normal',
    textAlign: 'center',
    marginBottom: 16,
  },
  fragranceScentNotesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  description: {
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
  notesSection: {
    marginTop: 24,
    gap: 16,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    backgroundColor: '#f5f5f5',
  },
  pickerContainer: {
    marginVertical: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  picker: {
    width: '100%',
    height: 150,
  },
  pickerItem: {
    height: 44,
  },
  friendRow: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  removeButton: {
    alignSelf: 'flex-end',
    padding: 4,
  },
  addButton: {
    marginTop: 16,
    alignItems: 'center',
  },
}); 