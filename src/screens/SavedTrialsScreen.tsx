import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
  ActivityIndicator, Alert,
} from 'react-native';
import { getSaved, unsaveTrial } from '../api/trials';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type SavedItem = {
  id: string;
  trial: any;
  interested: boolean;
  last_known_status: string | null;
  status_changed: boolean;
  created_at: string;
};

export default function SavedTrialsScreen({ navigation }: { navigation: NativeStackNavigationProp<any> }) {
  const [saved, setSaved] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSaved = useCallback(async () => {
    try {
      const data = await getSaved();
      setSaved(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load saved trials');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSaved(); }, [fetchSaved]);

  const onRefresh = () => { setRefreshing(true); fetchSaved(); };

  const handleRemove = (item: SavedItem) => {
    Alert.alert('Remove trial', `Remove "${item.trial.title}" from saved?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await unsaveTrial(item.trial.id);
            setSaved(saved.filter(s => s.id !== item.id));
          } catch {
            Alert.alert('Error', 'Failed to remove');
          }
        }
      },
    ]);
  };

  const renderItem = ({ item }: { item: SavedItem }) => {
    const status = item.trial.enrollment_status?.replace(/_/g, ' ') || 'unknown';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('TrialDetail', { trialId: item.trial.id })}
        activeOpacity={0.8}
      >
        {item.status_changed && (
          <View style={styles.statusChangeBanner}>
            <Text style={styles.statusChangeText}>⚠️ Status changed to: {status}</Text>
          </View>
        )}
        <View style={styles.cardHeader}>
          <Text style={styles.bookmarkIcon}>★</Text>
          {item.interested && <Text style={styles.interestedBadge}>Interested</Text>}
        </View>
        <Text style={styles.title}>{item.trial.title}</Text>
        {item.trial.phase && <Text style={styles.phaseBadge}>{item.trial.phase}</Text>}
        {item.trial.conditions?.length > 0 && (
          <Text style={styles.conditions}>{item.trial.conditions.join(', ')}</Text>
        )}
        <View style={styles.cardFooter}>
          <Text style={styles.statusText}>Status: {status}</Text>
          <TouchableOpacity onPress={() => handleRemove(item)}>
            <Text style={styles.deleteText}>🗑 Remove</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#0F7B7B" /></View>;

  return (
    <View style={styles.container}>
      {/* Disclaimer banner — required wording, visible without scrolling */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          This is informational matching, not medical advice. It does not diagnose,
          treat, or tell you to join any study. Talk to your doctor or the study team
          before acting.
        </Text>
      </View>
      <FlatList
        data={saved}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No saved trials yet.</Text>
            <Text style={styles.emptySubtext}>Save trials from the Matches feed.</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  disclaimer: {
    backgroundColor: '#FFF8E1', paddingHorizontal: 16, paddingVertical: 10,
    borderLeftWidth: 3, borderLeftColor: '#FFC107',
  },
  disclaimerText: { fontSize: 13, color: '#795548', lineHeight: 18 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginHorizontal: 16,
    marginVertical: 6, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  statusChangeBanner: {
    backgroundColor: '#FFF3E0', borderRadius: 8, padding: 8,
    marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#FF9800',
  },
  statusChangeText: { fontSize: 13, color: '#E65100', fontWeight: '500' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  bookmarkIcon: { fontSize: 20, color: '#0F7B7B' },
  interestedBadge: { fontSize: 12, color: '#1565C0', backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  title: { fontSize: 16, fontWeight: '600', color: '#222', lineHeight: 22, marginBottom: 4 },
  phaseBadge: { fontSize: 12, fontWeight: '600', color: '#0F7B7B', backgroundColor: '#E0F7F7', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginBottom: 4 },
  conditions: { fontSize: 14, color: '#0F7B7B', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  statusText: { fontSize: 13, color: '#666' },
  deleteText: { fontSize: 14, color: '#C62828', fontWeight: '500' },
  empty: { flex: 1, alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 18, color: '#666', fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: '#999', marginTop: 8 },
});
