import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useLayoutEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { fetchFragranceById, Fragrance } from '../services/api';
import { deleteUserFragrance, FriendInventory, loadFragranceNote, loadUserFragrances, saveFragranceNote } from '../services/localStorage';

const SEASONS = ['N/A', 'Summer', 'Fall', 'Winter', 'Spring'] as const;
const PRICE_POINTS = ['N/A', '1 - 30', '31 - 70', '71 - 110', '111 - 150', '151 - 200', '201 - 250', '251 - 300'] as const;
const FRIEND_NAMES = ['Allen', 'Dino', 'Ben', 'Conrad'] as const;
const INVENTORY_STATUSES = ['30ML Bottle', '50ML Bottle', '75ML Bottle', '100ML Bottle', '2 ML Sample', '1.5 ML Sample', '1 ML Sample', 'Don\'t Have', 'Want', 'All'] as const;
const RATINGS = ['N/A', ...Array.from({ length: 10 }, (_, i) => (i + 1).toString())] as string[];
const LONGEVITY_RANGES = ['N/A', '1 - 3', '4 - 6', '7 - 12', '13+'] as const;
const SILLAGE_RATINGS = ['N/A', ...Array.from({ length: 5 }, (_, i) => (i + 1).toString())] as string[];

type Season = typeof SEASONS[number];
type PricePoint = typeof PRICE_POINTS[number];
type FriendName = typeof FRIEND_NAMES[number];
type InventoryStatus = typeof INVENTORY_STATUSES[number];
type Rating = string;
type LongevityRange = typeof LONGEVITY_RANGES[number];
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
  longevityHours: LongevityRange;
  sillageRating: SillageRating;
  favourite: Favourite;
}

export default function FragranceDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const [fragrance, setFragrance] = useState<Fragrance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUserCreatedFragrance, setIsUserCreatedFragrance] = useState(false);
  const [isNotesOnly, setIsNotesOnly] = useState(false);
  const [note, setNote] = useState<Note>({
    thoughts: '',
    remindsOf: '',
    season: SEASONS[0],
    pricePoint: PRICE_POINTS[0],
    inventoryStatus: INVENTORY_STATUSES[0],
    friendInventories: [],
    rating: RATINGS[0],
    longevityHours: LONGEVITY_RANGES[0],
    sillageRating: SILLAGE_RATINGS[0],
    favourite: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  // Track which friend entry is selected (string) and derive numeric index
  const [selectedFriendValue, setSelectedFriendValue] = useState<string>('');
  const selectedFriendIndex = parseInt(selectedFriendValue, 10);

  useLayoutEffect(() => {
    if (fragrance) {
      navigation.setOptions({
        title: fragrance.fragrance_name,
      });
    }
  }, [navigation, fragrance]);

  useEffect(() => {
    console.log('FragranceDetailsScreen mounted with id:', id);
    loadFragrance();
  }, [id]);

  const loadFragrance = async () => {
    setLoading(true);
    setError(null);
    
    if (typeof id === 'string') {
      try {
        console.log('Fetching fragrance with id:', id);
        
        // First check if it's a user-created fragrance
        const userFragrances = await loadUserFragrances();
        console.log('All user fragrances:', userFragrances.map(f => f.fragrance_name));
        
        const userFragrance = userFragrances.find(f => f.fragrance_name === id);
        
        if (userFragrance) {
          console.log('Found user-created fragrance:', userFragrance);
          setIsUserCreatedFragrance(true);
          
          // Convert to Fragrance format and set
          const fragranceData = {
            fragrance_name: userFragrance.fragrance_name,
            notes: userFragrance.notes,
            description: userFragrance.description,
            imageUrl: userFragrance.imageUri || '',
          };
          
          setFragrance(fragranceData);
          
          // Also load the user fragrance data into the note
          setNote({
            thoughts: userFragrance.thoughts || '',
            remindsOf: userFragrance.remindsOf || '',
            season: (userFragrance.season || SEASONS[0]) as Season,
            pricePoint: (userFragrance.pricePoint || PRICE_POINTS[0]) as PricePoint,
            inventoryStatus: (userFragrance.inventoryStatus || INVENTORY_STATUSES[0]) as InventoryStatus,
            friendInventories: [],
            rating: userFragrance.rating || RATINGS[0],
            longevityHours: (userFragrance.longevityHours || LONGEVITY_RANGES[0]) as LongevityRange,
            sillageRating: userFragrance.sillageRating || SILLAGE_RATINGS[0],
            favourite: userFragrance.favourite || false,
          });
        } else {
          // Not a user fragrance, check the API
          console.log('Fetching from API for id:', id);
          const data = await fetchFragranceById(id);
          console.log('Fetched API fragrance data:', data);
          
          if (data) {
            setFragrance(data);
            setIsUserCreatedFragrance(false);
            await loadSavedNote(id);
          } else {
            console.error('No fragrance found with id:', id);
            setError('Fragrance not found');
          }
        }
      } catch (err) {
        console.error('Error loading fragrance:', err);
        setError('Failed to load fragrance');
      } finally {
        setLoading(false);
      }
    } else {
      console.error('Invalid id parameter:', id);
      setError('Invalid fragrance ID');
      setLoading(false);
    }
  };

  const loadSavedNote = async (fragranceId: string) => {
    const savedNote = await loadFragranceNote(fragranceId);
    if (savedNote) {
      // Don't overwrite the fragrance data we already loaded from the API
      // Just load the user's notes
      
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
        longevityHours: (savedNote.longevityHours || LONGEVITY_RANGES[0]) as LongevityRange,
        sillageRating: savedNote.sillageRating ?? SILLAGE_RATINGS[0],
        favourite: false,
      });
      
      // Don't set isNotesOnly to true since we want to keep displaying
      // the original fragrance details (image, description, notes)
      setIsUserCreatedFragrance(false);
      setIsNotesOnly(false);
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

  const handleDelete = async () => {
    if (typeof id === 'string' && isUserCreatedFragrance) {
      Alert.alert(
        "Delete Fragrance",
        `Are you sure you want to delete "${fragrance?.fragrance_name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Delete", 
            style: "destructive",
            onPress: async () => {
              try {
                await deleteUserFragrance(id);
                Alert.alert('Success', 'Fragrance deleted successfully');
                router.back();
              } catch (error) {
                Alert.alert('Error', 'Failed to delete fragrance');
              }
            }
          }
        ]
      );
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

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!fragrance) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Fragrance not found</Text>
        <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
          <Text style={styles.goBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.title, {textAlign: 'center'}]}>{fragrance.fragrance_name}</Text>
        
        {fragrance.imageUrl ? (
          <Image 
            source={{ uri: fragrance.imageUrl }} 
            style={styles.fragranceImage}
            resizeMode="contain"
          />
        ) : null}
        
        {isUserCreatedFragrance ? (
          <>
            <View style={styles.userCreatedBadge}>
              <Text style={styles.userCreatedText}>Your Custom Fragrance</Text>
            </View>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Ionicons name="trash" size={20} color="white" style={styles.deleteIcon} />
              <Text style={styles.deleteButtonText}>Delete Fragrance</Text>
            </TouchableOpacity>
          </>
        ) : isNotesOnly ? (
          <View style={styles.notesOnlyBadge}>
            <Text style={styles.userCreatedText}>Your Notes Only</Text>
          </View>
        ) : null}

        {!isNotesOnly && (
          <>
            <Text style={styles.description}>{fragrance.description}</Text>
            <Text style={styles.fragranceScentNotesTitle}>Top Notes:</Text>
            <Text style={styles.fragranceScentNotes}>{fragrance.notes.top_notes?.join(', ') ?? 'N/A'}</Text>
            <Text style={styles.fragranceScentNotesTitle}>Middle Notes:</Text>
            <Text style={styles.fragranceScentNotes}>{fragrance.notes.middle_notes?.join(', ') ?? 'N/A'}</Text>
            <Text style={styles.fragranceScentNotesTitle}>Base Notes:</Text>
            <Text style={styles.fragranceScentNotes}>{fragrance.notes.base_notes?.join(', ') ?? 'N/A'}</Text>
          </>
        )}

        <View style={styles.notesSection}>
          <Text style={styles.subtitle}>Your Notes</Text>
          
          <TextInput
            style={styles.textInput}
            value={note.thoughts}
            onChangeText={(text) => setNote({ ...note, thoughts: text })}
            placeholder="Write your thoughts about this fragrance..."
            placeholderTextColor="#777777"
            multiline
            numberOfLines={4}
          />

          <Text style={styles.subtitle}>This Fragrance Reminds Me Of</Text>
          <TextInput
            style={styles.textInput}
            value={note.remindsOf}
            onChangeText={(text) => setNote({ ...note, remindsOf: text })}
            placeholder="Describe what this fragrance reminds you of..."
            placeholderTextColor="#777777"
            multiline
            numberOfLines={2}
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.labelText}>Season:</Text>
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
            <Text style={styles.labelText}>Price Point:</Text>
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
            <Text style={styles.labelText}>My Inventory Status:</Text>
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

          {note.friendInventories.length > 0 && (
            <View style={styles.pickerContainer}>
              <Text style={styles.labelText}>Friend Inventories:</Text>
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

          {selectedFriendIndex >= 0 && selectedFriendValue !== '' && note.friendInventories[selectedFriendIndex] && (
            <View style={styles.friendRow} key={selectedFriendIndex}>
              <View style={styles.pickerContainer}>
                <Text style={styles.labelText}>Friend:</Text>
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
                <Text style={styles.labelText}>Bottle/Decant:</Text>
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
                <Text style={styles.buttonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity onPress={addFriendInventory} style={styles.addButton}>
            <Text style={styles.buttonText}>+ Add Friend Inventory</Text>
          </TouchableOpacity>

          <View style={styles.pickerContainer}>
            <Text style={styles.labelText}>Rating (1-10):</Text>
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
            <Text style={styles.labelText}>Longevity (Hours):</Text>
            <Picker
              selectedValue={note.longevityHours}
              onValueChange={(value) => setNote({ ...note, longevityHours: value })}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {LONGEVITY_RANGES.map(range => (
                <Picker.Item key={range} label={range} value={range} />
              ))}
            </Picker>
          </View>

          <View style={styles.pickerContainer}>
            <Text style={styles.labelText}>Sillage (1-5):</Text>
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
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Notes'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#777777', // Dark grey background
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#FFFFFF', // White text
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: '#FFFFFF', // White text
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
    color: '#FFFFFF', // White text
  },
  fragranceScentNotes: {
    fontSize: 16,
    fontWeight: 'normal',
    textAlign: 'center',
    marginBottom: 16,
    color: '#FFFFFF', // White text
  },
  fragranceScentNotesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FFFFFF', // White text
  },
  notesSection: {
    marginTop: 24,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#555555', // Darker border
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: 'rgba(34, 34, 34, 0.7)', // Dark input field
    color: '#FFFFFF', // White text
  },
  pickerContainer: {
    marginBottom: 16,
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#FFFFFF', // White text
    
  },
  pickerItem: {
    height: 50,
    color: '#FFFFFF', // White text
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  removeButton: {
    padding: 8,
    backgroundColor: '#ff4444',
    borderRadius: 4,
    marginLeft: 8,
  },
  addButton: {
    padding: 12,
    backgroundColor: '#163314',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#142d33',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  goBackButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginHorizontal: 40,
  },
  goBackButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  fragranceImage: {
    width: '100%',
    height: 200,
    marginBottom: 16,
    borderRadius: 8,
  },
  userCreatedBadge: {
    backgroundColor: '#777771',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  userCreatedText: {
    color: 'white',
    fontWeight: 'bold',
  },
  notesOnlyBadge: {
    backgroundColor: '#FF9800',  // Orange color for notes-only
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: '#3d211d',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  deleteIcon: {
    marginRight: 8,
  },
  labelText: {
    color: '#FFFFFF',
    marginBottom: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
}); 