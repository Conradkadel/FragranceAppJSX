import React, { useEffect, useState } from 'react';
import { StyleSheet, FlatList, View, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { FragranceCard } from './components/FragranceCard';
import { fetchFragrances, Fragrance } from './services/api';
import { ThemedView } from './components/ThemedView';
import { ThemedText } from './components/ThemedText';
import { loadAllFragranceNotes } from './services/localStorage';
import { Picker } from '@react-native-picker/picker';

// Define inventory status options 
const INVENTORY_STATUSES = [ 'All', '30ML Bottle', '50ML Bottle', '75ML Bottle', '100ML Bottle', '2 ML Sample', '1.5 ML Sample', '1 ML Sample', 'Don\'t Have', 'Want'] as const;
const SEASONS = ['All', 'Summer', 'Fall', 'Winter', 'Spring' ] as const;
const PRICE_POINTS = ['All', '1 - 30', '31 - 70', '71 - 110', '111 - 150', '151 - 200', '201 - 250', '251 - 300'] as const;
const LONGEVITY_RANGES = ['All', '1 - 3', '4 - 6', '7 - 12', '13+'] as const;
const FRIENDS = ['All', 'Allen', 'Dino', 'Ben', 'Conrad'] as const;
type SeasonFilter = typeof SEASONS[number];
type InventoryStatus = typeof INVENTORY_STATUSES[number];
type PriceFilter = typeof PRICE_POINTS[number];
type LongevityFilter = typeof LONGEVITY_RANGES[number];
type FriendsFilter = typeof FRIENDS[number];
// Define the merged data structure
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
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>('All');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('All');
  const [longevityFilter, setLongevityFilter] = useState<LongevityFilter>('All');
  const [friendsFilter, setFriendsFilter] = useState<FriendsFilter>('All');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const router = useRouter();
  useEffect(() => {
    loadFragrancesWithUserData();
  }, []);

  // Refresh list whenever HomeScreen regains focus (e.g., after saving in detail)
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
    
    // DEBUG: inspect loaded user notes for each fragrance
    Object.entries(userNotes).forEach(([key, noteValue]) => {
      console.log(`User note loaded for ${key}:`, noteValue);
    });
    
    // Merge API data with user data
    const mergedData = fragranceData.map(fragrance => {
      const userNote = userNotes[fragrance.fragrance_name];
      // Support both new friendInventories and legacy friendName
      let friendNames: string[] = [];
      if (userNote?.friendInventories && userNote.friendInventories.length > 0) {
        friendNames = userNote.friendInventories.map(fi => fi.friendName);
      } else if ((userNote as any)?.friendName) {
        friendNames = [(userNote as any).friendName];
      }
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
  const filteredFragrances = fragrances.filter(fragrance => {
    const matchesSearch = fragrance.fragrance_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMyInventory = statusFilter === 'All' || fragrance.inventoryStatus === statusFilter;
    const matchesSeason = seasonFilter === 'All' || fragrance.season === seasonFilter;
    const matchesPrice = priceFilter === 'All' || fragrance.price_point === priceFilter;
    const matchesLongevity = (() => {
      if (longevityFilter === 'All') return true;
      if (!fragrance.longevity || fragrance.longevity === 'N/A') return false;
      
      const hours = parseInt(fragrance.longevity, 10);
      if (isNaN(hours)) return false;
      
      switch (longevityFilter) {
        case '1 - 3': return hours >= 1 && hours <= 3;
        case '4 - 6': return hours >= 4 && hours <= 6;
        case '7 - 12': return hours >= 7 && hours <= 12;
        case '13+': return hours >= 13;
        default: return false;
      }
    })();
    const matchesFriend = friendsFilter === 'All' || (fragrance.friends ?? []).includes(friendsFilter);
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

  // DEBUG: log merged fragrances with their friends arrays
  React.useEffect(() => {
    console.log('Merged fragrances:', fragrances.map(f => ({ name: f.fragrance_name, friends: f.friends }))); 
  }, [fragrances]);

  // DEBUG: log when friend filter changes and the resulting filtered list
  React.useEffect(() => {
    console.log(`Filtering by friend: ${friendsFilter}`, filteredFragrances.map(f => f.fragrance_name));
  }, [friendsFilter, filteredFragrances]);

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
          placeholderTextColor="#666"
        />
      </View>
      
      {(statusFilter !== 'All' || seasonFilter !== 'All' || priceFilter !== 'All' || longevityFilter !== 'All' || friendsFilter !== 'All') && (
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
      )}
      
      <FlatList
        data={filteredFragrances}
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

