import { Stack, useRouter } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';

export default function Layout() {
  const router = useRouter();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#777777', // Match the dark grey theme
        },
        headerTintColor: '#FFFFFF', // White text
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Fragrances",
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => router.push('/addFragranceScreen')} 
              style={{ marginRight: 16 }}
            >
              <Text style={{ color: '#084f1b', fontSize: 28, fontWeight: 'bold' }}>+</Text>
            </TouchableOpacity>
          ),
        }}
      />
      
    </Stack>
  );
}

