import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { FragranceCard } from './components/FragranceCard';
import { ThemedText } from './components/ThemedText';
import { ThemedView } from './components/ThemedView';
import { fetchFragrances, Fragrance } from './services/api';
import { loadAllFragranceNotes } from './services/localStorage';

// Make constant inventory options read only - thats what the as as const is doing
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


// Define the merged data structure that is extending fields from our Fragrance Data Interface
interface MergedFragrance extends Fragrance {
  inventoryStatus?: string | null;
  season?: string | null;
  friends?: string[] | null;
  price_point?: string | null;
  longevity?: string | null;
}

export default function HomeScreen() {
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
      };
    });
    
    setFragrances(mergedData);
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
      
      // calculation for hours
      const hours = parseInt(fragrance.longevity, 10); // base 10 decimal
      if (isNaN(hours)) return false; 
      
      //  return the number of hours that is a string with cases that correlates to the int version of it.
      switch (longevityFilter) {
        case '1 - 3': return hours >= 1 && hours <= 3;
        case '4 - 6': return hours >= 4 && hours <= 6;
        case '7 - 12': return hours >= 7 && hours <= 12;
        case '13+': return hours >= 13;
        default: return false;
      }
    })();


    const matchesFriend = friendsFilter === 'All' || (fragrance.friends ?? []).includes(friendsFilter); // If fragrance.friends is null make it an empty list instead, and check if the list inludes the ui filter of a friend

    // Return all the search results back
    return matchesSearch && matchesMyInventory && matchesSeason && matchesPrice && matchesLongevity && matchesFriend;
  });

  const handleFragrancePress = (id: string) => {

    // send id param to fragrance page
    router.push(`/fragrance/${id}`);
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
    <ThemedView style={styles.container}>
      {/* Search header with label and filter button */}
      <View style={styles.searchContainer}>
        <View style={styles.searchHeader}>
          <ThemedText type="subtitle" style={styles.searchLabel}>Search Fragrances</ThemedText>
          <TouchableOpacity style={styles.filterButton} onPress={handleFilterPress}>
            <ThemedText>Filter</ThemedText>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Type to search..."
          placeholderTextColor="#6664"
        />
      </View>
      
     
     
      {
        /*This code provides a way for users to manage active filters. 
        Users can easily reset individual filters by tapping on them
        This entire container is hidden if no filters are active*/

         /*Checks if any of the filters are active (if any one of them is not the default all)
         When at least one filter is active, it renders a <View>
        
        
        Tried to figure out how we could show a reset button for the filter only if our filter was active.
        I tried to implement on my own and got stuck in my approach. Turned to Claude 3.7 coding assistant for help taking advice with boolean logic*/
        
        // Start of AI Code
        (statusFilter !== 'All' || seasonFilter !== 'All' || priceFilter !== 'All' || longevityFilter !== 'All' || friendsFilter !== 'All') && (
        <View style={styles.activeFilterContainer}>
          {statusFilter !== 'All' && (
            <TouchableOpacity onPress={() => setStatusFilter('All')}>
              <ThemedText style={styles.clearFilter}>Status: {statusFilter}</ThemedText>
            </TouchableOpacity>
          )}
          {seasonFilter !== 'All' && (
            <TouchableOpacity onPress={() => setSeasonFilter('All')}>
              <ThemedText style={styles.clearFilter}>Season: {seasonFilter}</ThemedText>
            </TouchableOpacity>
          )}
          {priceFilter !== 'All' && (
            <TouchableOpacity onPress={() => setPriceFilter('All')}>
              <ThemedText style={styles.clearFilter}>Price: {priceFilter}</ThemedText>
            </TouchableOpacity>
          )}
          {longevityFilter !== 'All' && (
            <TouchableOpacity onPress={() => setLongevityFilter('All')}>
              <ThemedText style={styles.clearFilter}>Longevity: {longevityFilter}</ThemedText>
            </TouchableOpacity>
          )}
          {friendsFilter !== 'All' && (
            <TouchableOpacity onPress={() => setFriendsFilter('All')}>
              <ThemedText style={styles.clearFilter}>Friends: {friendsFilter}</ThemedText>
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

              <ThemedText type="title" style={styles.modalTitle}>Filter Options</ThemedText>

              <ThemedText type="subtitle" style={styles.modalSubtitle}>Filter by Inventory Status</ThemedText>
              
              {/* Pickers for each filter inside the modal - On our IOS its a spinning wheel*/}
              <Picker
                selectedValue={statusFilter} // Which value is appeared as selected - '50ML'
                onValueChange={(value) => setStatusFilter(value as InventoryStatus)} // When user picks a new item, the setter updates the new state variable, 
                // the as tells complier we know that one of the types we are assignig will match one the types of InvetoryStatus
                
                
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {INVENTORY_STATUSES.map((status) => (
                  <Picker.Item key={status} label={status} value={status} />
                  // for every status in the array, it returns one <Picker.Item>
                  // a unique key on lists so it can track items efficiently when the list changes
                  // label is the human‑readable text you see in the dropdown.
                  // value is the actual data that gets sent back in onValueChange.
                ))}
              </Picker>
              <ThemedText type="subtitle" style={styles.modalSubtitle}>Filter by Season</ThemedText>
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
              <ThemedText type="subtitle" style={styles.modalSubtitle}>Filter by Price</ThemedText>
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
              <ThemedText type="subtitle" style={styles.modalSubtitle}>Filter by Longevity</ThemedText>
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
              <ThemedText type="subtitle" style={styles.modalSubtitle}>Filter by Friends</ThemedText>
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
                <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
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
    // search label style
  },
  filterButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  searchInput: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  activeFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#e0e0e0',
  },
  clearFilter: {
    color: 'blue',
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
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 20,
  },
  modalSubtitle: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  picker: {
    width: '100%',
    height: 200,
  },
  pickerItem: {
    color: '#000',
    height: 44,
  },
  applyButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  modalScrollContent: {
    paddingVertical: 10,
  },
});

