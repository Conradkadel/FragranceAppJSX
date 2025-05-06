// screens/AddFragranceScreen.tsx
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { FriendInventory, saveFragranceNote, saveUserFragrance, UserCreatedFragrance } from './services/localStorage';

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
  imageUri?: string;
}

export default function AddFragranceScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [topNotes, setTopNotes] = useState('');
  const [middleNotes, setMiddleNotes] = useState('');
  const [baseNotes, setBaseNotes] = useState('');
  const [isNewFragrance, setIsNewFragrance] = useState(true);
  const [imageUri, setImageUri] = useState<string | undefined>();
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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    console.log('Save button pressed');
    
    if (isNewFragrance) {
      if (!name) {
        Alert.alert('Error', 'Please enter a fragrance name');
        return;
      }
      
      // Create a new user fragrance
      try {
        const userFragrance: UserCreatedFragrance = {
          fragrance_name: name,
          notes: {
            top_notes: topNotes.split(',').map(note => note.trim()).filter(Boolean),
            middle_notes: middleNotes.split(',').map(note => note.trim()).filter(Boolean),
            base_notes: baseNotes.split(',').map(note => note.trim()).filter(Boolean),
          },
          description: description,
          imageUri: imageUri,
          season: note.season,
          pricePoint: note.pricePoint,
          inventoryStatus: note.inventoryStatus,
          longevityHours: note.longevityHours,
          rating: note.rating,
          sillageRating: note.sillageRating,
          thoughts: note.thoughts,
          remindsOf: note.remindsOf,
          favourite: note.favourite,
          createdAt: Date.now(),
        };
        
        console.log('Saving new fragrance with exact name:', JSON.stringify(name));
        console.log('Saving new fragrance:', JSON.stringify(userFragrance));
        await saveUserFragrance(userFragrance);
        
        // Also save the note data
        await saveFragranceNote("fragrance_note_" + name, note);
        
        Alert.alert(
          'Success', 
          'Your new fragrance has been created!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } catch (error) {
        console.error('Failed to save new fragrance:', error);
        Alert.alert('Error', 'Failed to create new fragrance. Please try again.');
      }
    } else {
      // Adding a note to an existing fragrance
      if (!name) {
        console.error('No fragrance ID provided');
        Alert.alert('Error', 'Missing fragrance ID. Cannot save.');
        return;
      }
      
      console.log('Saving note for fragrance ID:', name);
      
      try {
        const noteId = name;
        const newNote: Note = {
          ...note,
          imageUri,
        };
        
        console.log('Saving note with data:', JSON.stringify(newNote));
        await saveFragranceNote("fragrance_note_" + noteId, newNote);
        
        console.log('Successfully saved notes for fragrance:', noteId);
        Alert.alert(
          'Success', 
          'Your notes have been saved!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } catch (error) {
        console.error('Failed to save notes:', error);
        Alert.alert('Error', 'Failed to save your notes. Please try again.');
      }
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Fragrance Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Citrus Burst"
          placeholderTextColor="#777777"
          value={name}
          onChangeText={setName}
        />

        {isNewFragrance && (
          <>
            <Text style={styles.sectionTitle}>Description</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Describe the fragrance..."
              placeholderTextColor="#777777"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.sectionTitle}>Top Notes</Text>
            <TextInput
              style={styles.input}
              placeholder="Comma separated (e.g. Lemon, Bergamot, Lime)"
              placeholderTextColor="#777777"
              value={topNotes}
              onChangeText={setTopNotes}
            />

            <Text style={styles.sectionTitle}>Middle Notes</Text>
            <TextInput
              style={styles.input}
              placeholder="Comma separated (e.g. Lavender, Rose)"
              placeholderTextColor="#777777"
              value={middleNotes}
              onChangeText={setMiddleNotes}
            />

            <Text style={styles.sectionTitle}>Base Notes</Text>
            <TextInput
              style={styles.input}
              placeholder="Comma separated (e.g. Vanilla, Musk, Amber)"
              placeholderTextColor="#777777"
              value={baseNotes}
              onChangeText={setBaseNotes}
            />
          </>
        )}

        <Text style={styles.sectionTitle}>Fragrance Image</Text>
        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <Text style={styles.imageButtonText}>Pick an image</Text>
        </TouchableOpacity>
        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        )}

        <Text style={styles.sectionTitle}>Your Thoughts</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Describe the scent..."
          placeholderTextColor="#777777"
          value={note.thoughts}
          onChangeText={(text) => setNote({ ...note, thoughts: text })}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.sectionTitle}>This Fragrance Reminds Me Of</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="What does this fragrance remind you of?"
          placeholderTextColor="#777777"
          value={note.remindsOf}
          onChangeText={(text) => setNote({ ...note, remindsOf: text })}
          multiline
          numberOfLines={2}
        />

        <Text style={styles.sectionTitle}>Season</Text>
        <Picker
          selectedValue={note.season}
          onValueChange={(value) => setNote({ ...note, season: value as Season })}
          style={styles.picker}
        >
          {SEASONS.map((season) => (
            <Picker.Item key={season} label={season} value={season} />
          ))}
        </Picker>

        <Text style={styles.sectionTitle}>Price Point</Text>
        <Picker
          selectedValue={note.pricePoint}
          onValueChange={(value) => setNote({ ...note, pricePoint: value as PricePoint })}
          style={styles.picker}
        >
          {PRICE_POINTS.map((price) => (
            <Picker.Item key={price} label={price} value={price} />
          ))}
        </Picker>

        <Text style={styles.sectionTitle}>Inventory Status</Text>
        <Picker
          selectedValue={note.inventoryStatus}
          onValueChange={(value) => setNote({ ...note, inventoryStatus: value as InventoryStatus })}
          style={styles.picker}
        >
          {INVENTORY_STATUSES.map((status) => (
            <Picker.Item key={status} label={status} value={status} />
          ))}
        </Picker>

        <Text style={styles.sectionTitle}>Rating (1-10)</Text>
        <Picker
          selectedValue={note.rating}
          onValueChange={(value) => setNote({ ...note, rating: value })}
          style={styles.picker}
        >
          {RATINGS.map((rating) => (
            <Picker.Item key={rating} label={rating} value={rating} />
          ))}
        </Picker>

        <Text style={styles.sectionTitle}>Longevity (Hours)</Text>
        <Picker
          selectedValue={note.longevityHours}
          onValueChange={(value) => setNote({ ...note, longevityHours: value })}
          style={styles.picker}
        >
          {LONGEVITY_HOURS.map((hours) => (
            <Picker.Item key={hours} label={hours} value={hours} />
          ))}
        </Picker>

        <Text style={styles.sectionTitle}>Sillage (1-5)</Text>
        <Picker
          selectedValue={note.sillageRating}
          onValueChange={(value) => setNote({ ...note, sillageRating: value })}
          style={styles.picker}
        >
          {SILLAGE_RATINGS.map((rating) => (
            <Picker.Item key={rating} label={rating} value={rating} />
          ))}
        </Picker>

        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>{isNewFragrance ? 'Create Fragrance' : 'Save'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#777777',
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 6,
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#555555',
    borderRadius: 6,
    padding: 8,
    marginBottom: 16,
    backgroundColor: 'rgba(34, 34, 34, 0.7)',
    color: '#FFFFFF',
  },
  multiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  picker: {
    marginBottom: 16,
  },
  imageButton: {
    backgroundColor: '#555555',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 16,
  },
  imageButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 6,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#163314',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
