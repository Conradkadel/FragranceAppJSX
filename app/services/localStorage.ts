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

export interface UserCreatedFragrance {
  fragrance_name: string;
  notes: {
    top_notes: string[];
    middle_notes: string[];
    base_notes: string[];
  };
  description: string;
  imageUri?: string;
  season: string;
  pricePoint: string;
  inventoryStatus: string;
  longevityHours: string;
  rating: string;
  sillageRating: string;
  thoughts: string;
  remindsOf?: string;
  favourite: boolean;
  createdAt: number; // timestamp
}

const STORAGE_KEY_PREFIX = 'fragrance_note_';
const USER_FRAGRANCE_KEY_PREFIX = 'user_fragrance_';

// Saves a user's note for a specific fragrance into ourlocal storage
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

// Function to save a user-created fragrance
export const saveUserFragrance = async (fragrance: UserCreatedFragrance): Promise<void> => {
  try {
    const key = `${USER_FRAGRANCE_KEY_PREFIX}${fragrance.fragrance_name}`;
    console.log('Saving user fragrance with key:', key);
    console.log('Full fragrance data:', JSON.stringify(fragrance));
    await AsyncStorage.setItem(key, JSON.stringify(fragrance));
    console.log('Successfully saved fragrance with key:', key);
    
    // Verify it was saved correctly
    const saved = await AsyncStorage.getItem(key);
    if (saved) {
      console.log('Verified save - fragrance available with key:', key);
    } else {
      console.error('Save verification failed - fragrance not found with key:', key);
    }
  } catch (error) {
    console.error('Error saving user fragrance:', error);
  }
};

// Function to load all user-created fragrances
export const loadUserFragrances = async (): Promise<UserCreatedFragrance[]> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    console.log('All AsyncStorage keys:', keys);
    
    const userFragranceKeys = keys.filter(key => key.startsWith(USER_FRAGRANCE_KEY_PREFIX));
    console.log('User fragrance keys:', userFragranceKeys);
    
    const results: UserCreatedFragrance[] = [];
    
    await Promise.all(
      userFragranceKeys.map(async (key) => {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          console.log('Loaded user fragrance:', parsed.fragrance_name);
          results.push(parsed);
        }
      })
    );
    
    return results;
  } catch (error) {
    console.error('Error loading user fragrances:', error);
    return [];
  }
};

// Function to delete a user-created fragrance
export const deleteUserFragrance = async (fragranceName: string): Promise<void> => {
  try {
    const key = `${USER_FRAGRANCE_KEY_PREFIX}${fragranceName}`;
    await AsyncStorage.removeItem(key);
    console.log(`Successfully deleted fragrance with key: ${key}`);
  } catch (error) {
    console.error('Error deleting user fragrance:', error);
  }
}; 