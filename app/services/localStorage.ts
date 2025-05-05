import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FriendInventory {
  friendName: string;
  inventoryStatus: string;
}

export interface FragranceNote {
  thoughts: string;
  remindsOf?: string | null;
  season: string;
  pricePoint: string;
  friendInventories: FriendInventory[];
  inventoryStatus: string | null;
  rating: string | null;
  longevityHours: string | null;
  sillageRating: string | null;
  favourite: boolean | null;
}

const STORAGE_KEY_PREFIX = 'fragrance_note_';

export const saveFragranceNote = async (fragranceId: string, note: FragranceNote): Promise<void> => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${fragranceId}`;
    await AsyncStorage.setItem(key, JSON.stringify(note));
  } catch (error) {
    console.error('Error saving fragrance note:', error);
  }
};

export const loadFragranceNote = async (fragranceId: string): Promise<FragranceNote | null> => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${fragranceId}`;
    const note = await AsyncStorage.getItem(key);
    return note ? JSON.parse(note) : null;
  } catch (error) {
    console.error('Error loading fragrance note:', error);
    return null;
  }
};

// Function to load all fragrance notes from AsyncStorage
export const loadAllFragranceNotes = async (): Promise<Record<string, FragranceNote>> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const fragranceNoteKeys = keys.filter(key => key.startsWith(STORAGE_KEY_PREFIX));
    const results: Record<string, FragranceNote> = {};
    
    await Promise.all(
      fragranceNoteKeys.map(async (key) => {
        const note = await AsyncStorage.getItem(key);
        if (note) {
          const fragranceId = key.replace(STORAGE_KEY_PREFIX, '');
          results[fragranceId] = JSON.parse(note);
        }
      })
    );
    
    return results;
  } catch (error) {
    console.error('Error loading all fragrance notes:', error);
    return {};
  }
}; 