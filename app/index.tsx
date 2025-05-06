import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Picker } from '@react-native-picker/picker';
import { createStackNavigator } from '@react-navigation/stack';
import { FragranceCard } from './components/FragranceCard';
import { fetchFragrances, Fragrance } from './services/api';
import { deleteUserFragrance, loadAllFragranceNotes, loadUserFragrances } from './services/localStorage';

// Add SOURCE_FILTERS constant
const SOURCE_FILTERS = ['All', 'My Collection', 'API'] as const;
const INVENTORY_STATUSES = [ 'All', '30ML Bottle', '50ML Bottle', '75ML Bottle', '100ML Bottle', '2 ML Sample', '1.5 ML Sample', '1 ML Sample', 'Don\'t Have', 'Want'] as const;
const SEASONS = ['All', 'Summer', 'Fall', 'Winter', 'Spring' ] as const;
const PRICE_POINTS = ['All', '1 - 30', '31 - 70', '71 - 110', '111 - 150', '151 - 200', '201 - 250', '251 - 300'] as const;
const LONGEVITY_RANGES = ['All', '1 - 3', '4 - 6', '7 - 12', '13+'] as const;
const FRIENDS = ['All', 'Allen', 'Dino', 'Ben', 'Conrad'] as const;

// Union type for each filter
// union type here is used because it represents a value that can be any one of those string literals, but nothing else.
// typeof SEASONS[number] the type of any element in the SEASONS array,
// it can be 'All' | 'Summer' | 'Fall' | 'Winter' | 'Spring'
// the [number] means the type is the same as the values in the array
type SeasonFilter = typeof SEASONS[number];
type InventoryStatus = typeof INVENTORY_STATUSES[number];
type PriceFilter = typeof PRICE_POINTS[number];
type LongevityFilter = typeof LONGEVITY_RANGES[number];
type FriendsFilter = typeof FRIENDS[number];
type SourceFilter = typeof SOURCE_FILTERS[number];


// Define the merged data structure that is extending fields from our Fragrance Data Interface
interface MergedFragrance extends Fragrance {
  inventoryStatus?: string | null;
  season?: string | null;
  friends?: string[] | null;
  price_point?: string | null;
  longevity?: string | null;
  isUserCreated?: boolean;
}

// Define the Stack Navigator
const Stack = createStackNavigator();

function HomeScreen() {
  const [fragrances, setFragrances] = useState<MergedFragrance[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InventoryStatus>('All');

  // seasonFilter is a state variable of type SeasonFilter 
  // (which is the union type 'All' | 'Summer' | 'Fall' | 'Winter' | 'Spring')
  // setSeasonFilter is the setter function that can only accept values of type SeasonFilter
  // 'All' is the initial value for this state
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>('All');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('All');
  const [longevityFilter, setLongevityFilter] = useState<LongevityFilter>('All');
  const [friendsFilter, setFriendsFilter] = useState<FriendsFilter>('All');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('All');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // router is used to navigate to the fragrance details screen
  const router = useRouter();

  // Load fragrances with user data when the component mounts/App first loads
  useEffect(() => {
    loadFragrancesWithUserData();
  }, []);

  // Refresh list our whenever HomeScreen regains focus
  // In our case this is when we return to the HomeScreen after saving a fragrance note
  useFocusEffect(
    React.useCallback(() => {
      loadFragrancesWithUserData();
    }, [])
  );

  const loadFragrancesWithUserData = async () => {
    // Fetch fragrances from API
    const fragranceData = await fetchFragrances();
    
    // Load user notes from AsyncStorage
    const userNotes = await loadAllFragranceNotes();
    
    // Load user-created fragrances
    const userCreatedFragrances = await loadUserFragrances();
    
    // DEBUG: inspect loaded user-created fragrances
    console.log(`Loaded ${userCreatedFragrances.length} user-created fragrances`);
    
    
    // Convert user-created fragrances to match the API format
    const userFragrancesFormatted = userCreatedFragrances.map(userFrag => ({
      fragrance_name: userFrag.fragrance_name,
      notes: userFrag.notes,
      description: userFrag.description,
      imageUrl: userFrag.imageUri || '', // Use imageUri as imageUrl
      // Include user data directly in the object
      inventoryStatus: userFrag.inventoryStatus,
      season: userFrag.season,
      price_point: userFrag.pricePoint,
      longevity: userFrag.longevityHours,
      // Convert friendInventories to just an array of friend names
      friends: [],
      // Flag to identify user-created fragrances
      isUserCreated: true
    }));
    
    // Merge API data with user data
    // Map takes in an array -> does an action to all elements in that array -> spits out a new array with the new actioned data
    const mergedData = fragranceData.map(fragrance => {

      const userNote = userNotes[fragrance.fragrance_name];
      
      // Support both new friendInventories and legacy friendName
      // type is array of strings and initial value = empty array
      let friendNames: string[] = [];
      
      // If the userNote even has a property called friendInventories & if there is actually something in the array
      // This and is needed because there could have been a friend in there cauing a friend inventory list to get created for that fragrance note
      // But that friend was deleted from that note and now there is an empty list
      if (userNote?.friendInventories && userNote.friendInventories.length > 0) {
        
        // The map function iterates over each friends name in the friend inventory list and saves all the friends names
        friendNames = userNote.friendInventories.map(fi => fi.friendName);

        // No idea what this does
      } else if ((userNote as any)?.friendName) {
        friendNames = [(userNote as any).friendName];
      }

      // Creates a new merged data object of a fragrance using the spread operator to create a copy of the existing data
      // Then data fields from the userNote object
      return {
        ...fragrance,
        inventoryStatus: userNote?.inventoryStatus || null,
        season: userNote?.season || null,
        price_point: userNote?.pricePoint || null,
        longevity: userNote?.longevityHours || null,
        friends: friendNames.length > 0 ? friendNames : null,
        isUserCreated: false
      };
    });
    
    // Combine API fragrances with user-created fragrances
    setFragrances([...mergedData, ...userFragrancesFormatted]);
  };

  // Apply both search and status filters
  // Lambda tries to figure out if our ui filter matches any of the fragrances that are stored
  const filteredFragrances = fragrances.filter(fragrance => {
    const matchesSearch = fragrance.fragrance_name.toLowerCase().includes(searchQuery.toLowerCase()); // Checks if query string is contained anywhere in the fragrance name
    const matchesMyInventory = statusFilter === 'All' || fragrance.inventoryStatus === statusFilter; // Returns True if statusFilter is set to ALL || Returns true if inventory status of current fragrance matches the value of the current ui status filter
    
    // Same for season, matchesPrice,
    const matchesSeason = seasonFilter === 'All' || fragrance.season === seasonFilter;
    const matchesPrice = priceFilter === 'All' || fragrance.price_point === priceFilter;
    const matchesLongevity = (() => {
      if (longevityFilter === 'All') return true;
      if (!fragrance.longevity || fragrance.longevity === 'N/A') return false;
      
      return fragrance.longevity === longevityFilter;
    })();
    const matchesFriend = friendsFilter === 'All' || (fragrance.friends ?? []).includes(friendsFilter); // If fragrance.friends is null make it an empty list instead, and check if the list inludes the ui filter of a friend

    
    // Add source filter logic
    const matchesSource = (() => {
      if (sourceFilter === 'All') return true;
      if (sourceFilter === 'My Collection') return fragrance.isUserCreated === true;
      if (sourceFilter === 'API') return fragrance.isUserCreated === false;
      return true;
    })();

    // Return all the search results back
    return matchesSearch && matchesMyInventory && matchesSeason && matchesPrice && matchesLongevity && matchesFriend && matchesSource;
  });

  const handleFragrancePress = (id: string) => {
    // send id param to fragrance page
    router.push(`/fragrance/${id}`);
  };

  const handleFragranceDelete = async (fragranceName: string) => {
    // Delete the fragrance from local storage
    await deleteUserFragrance(fragranceName);
    
    // Refresh the list
    loadFragrancesWithUserData();
  };

  const handleFilterPress = () => {
    setShowFilterModal(true);
  };

  const closeFilterModal = () => {
    setShowFilterModal(false);
    // Refresh merged list to include any newly saved notes
    loadFragrancesWithUserData();
  };

  return (
    <View style={styles.container}>
      {/* Search header with label and filter button */}
      <View style={styles.searchContainer}>
        <View style={styles.searchHeader}>
          <Text style={styles.searchLabel}>Search Fragrances</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.filterButton} onPress={handleFilterPress}>
              <Text style={styles.filterButtonText}>Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Type to search..."
          placeholderTextColor="#777777"
        />
      </View>
      
      {/* Active filters display */}
      {(statusFilter !== 'All' || seasonFilter !== 'All' || priceFilter !== 'All' || longevityFilter !== 'All' || friendsFilter !== 'All' || sourceFilter !== 'All') && (
        <View style={styles.activeFilterContainer}>
          {statusFilter !== 'All' && (
            <TouchableOpacity onPress={() => setStatusFilter('All')}>
              <Text style={styles.clearFilter}>Status: {statusFilter}</Text>
            </TouchableOpacity>
          )}
          {seasonFilter !== 'All' && (
            <TouchableOpacity onPress={() => setSeasonFilter('All')}>
              <Text style={styles.clearFilter}>Season: {seasonFilter}</Text>
            </TouchableOpacity>
          )}
          {priceFilter !== 'All' && (
            <TouchableOpacity onPress={() => setPriceFilter('All')}>
              <Text style={styles.clearFilter}>Price: {priceFilter}</Text>
            </TouchableOpacity>
          )}
          {longevityFilter !== 'All' && (
            <TouchableOpacity onPress={() => setLongevityFilter('All')}>
              <Text style={styles.clearFilter}>Longevity: {longevityFilter}</Text>
            </TouchableOpacity>
          )}
          {friendsFilter !== 'All' && (
            <TouchableOpacity onPress={() => setFriendsFilter('All')}>
              <Text style={styles.clearFilter}>Friends: {friendsFilter}</Text>
            </TouchableOpacity>
          )}
          {sourceFilter !== 'All' && (
            <TouchableOpacity onPress={() => setSourceFilter('All')}>
              <Text style={styles.clearFilter}>Source: {sourceFilter}</Text>
            </TouchableOpacity>
          )}  
        </View>
      )
      /* End of AI Code */
      }
      
      <FlatList
        data={filteredFragrances} // Our data that will get rendered

        // For each item pass it to be made as a fragrance card component
        // Give it a callback fn to be pressed when clicked
        renderItem={({ item }) => (
          <FragranceCard 
            fragrance={item} 
            onPress={handleFragrancePress}
          />
        )}
        keyExtractor={item => item.fragrance_name}
        numColumns={2}
        contentContainerStyle={styles.list}
      />
      
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeFilterModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={styles.modalScrollContent} nestedScrollEnabled={true}>
              <Text style={styles.modalTitle}>Filter Options</Text>
              
              {/* Source filter - add this first */}
              <Text style={styles.modalSubtitle}>Source</Text>
              <Picker
                selectedValue={sourceFilter}
                onValueChange={(value) => setSourceFilter(value as SourceFilter)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {SOURCE_FILTERS.map((source) => (
                  <Picker.Item key={source} label={source} value={source} />
                ))}
              </Picker>
              
              {/* Inventory Status */}
              <Text style={styles.modalSubtitle}>Inventory Status</Text>
              <Picker
                selectedValue={statusFilter} 
                onValueChange={(value) => setStatusFilter(value as InventoryStatus)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {INVENTORY_STATUSES.map((status) => (
                  <Picker.Item key={status} label={status} value={status} />
                ))}
              </Picker>
              
              {/* Season */}
              <Text style={styles.modalSubtitle}>Season</Text>
              <Picker
                selectedValue={seasonFilter}
                onValueChange={(value) => setSeasonFilter(value as SeasonFilter)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {SEASONS.map((season) => (
                  <Picker.Item key={season} label={season} value={season} />
                ))}
              </Picker>
              
              {/* Price */}
              <Text style={styles.modalSubtitle}>Price</Text>
              <Picker
                selectedValue={priceFilter}
                onValueChange={(value) => setPriceFilter(value as PriceFilter)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {PRICE_POINTS.map((price) => (
                  <Picker.Item key={price} label={price} value={price} />
                ))}
              </Picker>
              
              {/* Longevity */}
              <Text style={styles.modalSubtitle}>Longevity</Text>
              <Picker
                selectedValue={longevityFilter}
                onValueChange={(value) => setLongevityFilter(value as LongevityFilter)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {LONGEVITY_RANGES.map((range) => (
                  <Picker.Item key={range} label={range} value={range} />
                ))}
              </Picker>
              
              {/* Friends */}
              <Text style={styles.modalSubtitle}>Friends</Text>
              <Picker
                selectedValue={friendsFilter}
                onValueChange={(value) => setFriendsFilter(value as FriendsFilter)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {FRIENDS.map((friend) => (
                  <Picker.Item key={friend} label={friend} value={friend} />
                ))}
              </Picker>
              <TouchableOpacity style={styles.applyButton} onPress={closeFilterModal}>
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Remove the Stack Navigator and App function
export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#777777', // Dark grey background color
  },
  searchContainer: {
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#777777', // Slightly lighter grey for the search bar
    zIndex: 1,
    width: '100%',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    width: '100%',
  },
  searchLabel: {
    color: '#ffffff', // White text for better contrast
    fontWeight: 'bold',
    paddingBottom: 2,
  },
  filterButton: {
    padding: 0,
    paddingEnd: 16,
    paddingStart: 16,
    backgroundColor: '#d4bb77',
    borderRadius: 10,
    opacity: 0.75,
  },
  filterButtonText: {
    color: '#000000', // Black text for contrast against the yellow button
    fontSize: 16, // Increase font size
  },
  searchInput: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#555555',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#222222', // Dark input field
    color: '#ffffff', // White text
  },
  activeFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#444444', // Matching the search container
  },
  clearFilter: {
    color: '#4fc3f7', // Light blue for better visibility on dark
    fontWeight: 'bold',
  },
  list: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    maxHeight: '80%',
    backgroundColor: '#333333', // Dark grey modal
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#555555',
  },
  modalTitle: {
    marginBottom: 10,
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  modalSubtitle: {
    marginTop: 8,
    marginBottom: 0,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  picker: {
    width: '100%',
    height: 120,
    color: '#ffffff',
    marginBottom: 0,
    marginTop: 0,
  },
  pickerItem: {
    color: '#ffffff',
    height: 44,
  },
  applyButton: {
    marginTop: 12,
    backgroundColor: '#4fc3f7', // Light blue button
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalScrollContent: {
    paddingVertical: 5,
    paddingHorizontal: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

