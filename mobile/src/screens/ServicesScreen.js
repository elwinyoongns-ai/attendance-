import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getServices, deleteService } from '../database/db';

const PRIMARY = '#2563eb';

function AttendancePill({ present, total }) {
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;
  const color = pct >= 70 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626';
  const bg = pct >= 70 ? '#dcfce7' : pct >= 40 ? '#fef3c7' : '#fee2e2';
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color }]}>{present}/{total} · {pct}%</Text>
    </View>
  );
}

export default function ServicesScreen({ navigation }) {
  const [services, setServices] = useState([]);

  const load = async () => setServices(await getServices());
  useFocusEffect(useCallback(() => { load(); }, []));

  const confirmDelete = (svc) => {
    Alert.alert('Delete Service', `Delete "${svc.name}" and all attendance records?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteService(svc.id); load(); } },
    ]);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{item.service_type}</Text>
        </View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.date}>{item.date}</Text>
        {item.notes ? <Text style={styles.notes} numberOfLines={1}>{item.notes}</Text> : null}
      </View>
      <View style={styles.cardRight}>
        <TouchableOpacity
          style={styles.attendBtn}
          onPress={() => navigation.navigate('Attendance', { serviceId: item.id, serviceName: item.name })}
        >
          <Ionicons name="checkbox-outline" size={22} color={PRIMARY} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDelete(item)}>
          <Ionicons name="trash-outline" size={20} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={services}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12, paddingBottom: 90 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No services yet</Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('ServiceForm')}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardLeft: { flex: 1 },
  typeBadge: { alignSelf: 'flex-start', backgroundColor: '#eff6ff', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 6 },
  typeText: { fontSize: 11, color: PRIMARY, fontWeight: '600' },
  name: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  date: { fontSize: 12, color: '#6b7280', marginTop: 3 },
  notes: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  pill: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 },
  pillText: { fontSize: 12, fontWeight: '600' },
  cardRight: { justifyContent: 'space-between', alignItems: 'center', paddingLeft: 10 },
  attendBtn: { padding: 6 },
  deleteBtn: { padding: 6 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { color: '#9ca3af', fontSize: 15 },
  fab: { position: 'absolute', bottom: 24, right: 20, backgroundColor: PRIMARY, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 5 },
});
