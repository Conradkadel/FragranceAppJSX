import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FriendInventory {
  friendName: string;
  inventoryStatus: string;
}

// Create FragranceNote Interface, data class
export interface FragranceNote {
  thoughts: string;
  remindsOf?: string | null;
  season: string;
  pricePoint: string;
  friendInventories: FriendInventory[]; // create a seperate friendInventory data class
  inventoryStatus: string | null;
  rating: string | null;
  longevityHours: string | null;
  sillageRating: string | null;
  favourite: boolean | null;
}

const STORAGE_KEY_PREFIX = 'fragrance_note_';

// Saves a user’s note for a specific fragrance into ourlocal storage
export const saveFragranceNote = async (fragranceId: string, note: FragranceNote): Promise<void> => {
  try {
    // Build a unique storage key by appending the fragrance ID to our prefix
    const key = `${STORAGE_KEY_PREFIX}${fragranceId}`;

    // Convert the note object into a JSON string and store it under that key
    await AsyncStorage.setItem(key, JSON.stringify(note));
    
  } catch (error) {
    console.error('Error saving fragrance note:', error);
  }
};


// Loads a saved note for a specific fragrance from persistent storage
export const loadFragranceNote = async (
  fragranceId: string
): Promise<FragranceNote | null> => {
  try {
    // Construct the storage key using our prefix and the fragrance ID
    const key = `${STORAGE_KEY_PREFIX}${fragranceId}`;

    // Retrieve the stored JSON string (if any) for that key
    const note = await AsyncStorage.getItem(key);

    // If we got a string back, parse it into an object; otherwise return null
    return note ? JSON.parse(note) : null;

  } catch (error) {
    console.error('Error loading fragrance note:', error);
    return null;
  }
};


// Loads all saved fragrance notes from AsyncStorage and returns them in a lookup object
export const loadAllFragranceNotes = async (): Promise<Record<string, FragranceNote>> => {
  try {
    // Get every key stored in AsyncStorage
    const keys = await AsyncStorage.getAllKeys();

    // Narrow down to only the keys belonging to fragrance notes
    const fragranceNoteKeys = keys.filter(key => key.startsWith(STORAGE_KEY_PREFIX));

    // Prepare an object to accumulate parsed notes, keyed by fragrance ID
    const results: Record<string, FragranceNote> = {};

    // Fetch and parse all note entries in parallel
    await Promise.all(
      fragranceNoteKeys.map(async (key) => {
        
        // Retrieve the raw JSON string for this key
        const note = await AsyncStorage.getItem(key);
        
        if (note) {
          // Derive the fragrance ID by removing the storage prefix
          const fragranceId = key.replace(STORAGE_KEY_PREFIX, '');
          // Parse the JSON and store it in our results object
          results[fragranceId] = JSON.parse(note);
        }
      })
    );

    // Return the completed map of all fragrance notes
    return results;

  } catch (error) {
    // If anything goes wrong, log the error and return an empty record
    console.error('Error loading all fragrance notes:', error);
    return {};
  }
};
 