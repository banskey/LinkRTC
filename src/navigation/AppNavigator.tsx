import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import OnboardingScreen from '../screens/OnboardingScreen';
import MatchFeedScreen from '../screens/MatchFeedScreen';
import TrialDetailScreen from '../screens/TrialDetailScreen';
import SavedTrialsScreen from '../screens/SavedTrialsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MedicalProfileScreen from '../screens/MedicalProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#0F7B7B',
        tabBarLabelStyle: { fontSize: 13, fontWeight: '500' },
        headerStyle: { backgroundColor: '#0F7B7B' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="MatchesTab"
        component={MatchFeedScreen}
        options={{
          title: 'Matches',
          tabBarIcon: ({ color, size }) => <Ionicons name="search" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="SavedTab"
        component={SavedTrialsScreen}
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, size }) => <Ionicons name="bookmark" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: '#0F7B7B' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen
        name="TrialDetail"
        component={TrialDetailScreen}
        options={{ title: 'Trial Details' }}
      />
      <Stack.Screen
        name="MedicalProfile"
        component={MedicalProfileScreen}
        options={{ title: 'Medical Profile' }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0F7B7B" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppStack /> : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
