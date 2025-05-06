import { loadUserFragrances } from './localStorage';

// Define the Fragrance interface, with its data fields
export interface Fragrance {
  fragrance_name: string;
  notes: {
    top_notes: string[];
    middle_notes: string[];
    base_notes: string[];
  };
  description: string;
  imageUrl: string;
}

// Our server url
const API_BASE_URL = 'https://fragranceapi-aa634fd3f236.herokuapp.com';

// lambda of type promise<which returns list of frags>
export async function fetchFragrances(): Promise<Fragrance[]> {
  try {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch fragrances');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching fragrances:', error);
    return [];
  }
}

export async function fetchFragranceById(id: string): Promise<Fragrance | null> {
  try {
    // Since we're now handling user fragrances in the FragranceDetailsScreen component,
    // we only need to fetch from the API here
    const response = await fetch(API_BASE_URL);

    if (!response.ok) {
      throw new Error('Failed to fetch fragrance');
    }

    const data: Fragrance[] = await response.json();

    // Search through the array for a fragrance whose name matches the given id
    const fragrance = data.find((f: Fragrance) => f.fragrance_name === id);

    // Return the found object, or null if none matched
    return fragrance || null;

  } catch (error) {
    console.error('Error fetching fragrance:', error);
    return null;
  }
}
