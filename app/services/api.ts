
// Define the Fragrance interface
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

// API base URL - replace with your actual API endpoint
const API_BASE_URL = 'https://fragranceapi-aa634fd3f236.herokuapp.com';

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
    const response = await fetch(API_BASE_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch fragrance');
    }
    const data = await response.json();
    const fragrance = data.find((f: Fragrance) => f.fragrance_name === id);
    return fragrance || null;
  } catch (error) {
    console.error('Error fetching fragrance:', error);
    return null;
  }
} 
