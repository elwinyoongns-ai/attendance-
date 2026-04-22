import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getAttendance, saveAttendance } from '../database/db';

const PRIMARY = '#2563eb';

export default function AttendanceScreen({ route, navigation }) {
  const { serviceId, serviceName } = route.params;
  const [records, setRecords] = useState([]);
  const [present, setPresent] = useState(new Set());
  const [search, setSearch] = useState('');

  useFocusEffect(useCallback(() => {
    getAttendance(serviceId).then(data => {
      setRecords(data);
      setPresent(new Set(data.filter(r => r.present).map(r => r.member_id)));
    });
  }, [serviceId]));

  const toggle = (id) => {
    setPresent(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const markAll = (val) => {
    const visible = filtered.map(r => r.member_id);
    setPresent(prev => {
      const next = new Set(prev);
      visible.forEach(id => val ? next.add(id) : next.delete(id));
      return next;
    });
  };

  const save = async () => {
    await saveAttendance(serviceId, present);
    Alert.alert('Saved', 'Attendance has been saved.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
  };

  const filtered = records.filter(r =>
    `${r.first_name} ${r.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const presentCount = filtered.filter(r => present.has(r.member_id)).length;

  const renderItem = ({ item }) => {
    const isPresent = present.has(item.member_id);
    const initials = `${item.first_name[0]}${item.last_name[0]}`.toUpperCase();
    return (
      <TouchableOpacity style={[styles.row, isPresent && styles.rowPresent]} onPress={() => toggle(item.member_id)} activeOpacity={0.7}>
        <View style={[styles.avatar, { backgroundColor: isPresent ? '#16a34a' : '#e5e7eb' }]}>
          <Text style={[styles.avatarText, { color: isPresent ? '#fff' : '#6b7280' }]}>{initials}</Text>
        </View>
        <View style={styles.rowInfo}>
          <Text style={styles.rowName}>{item.first_name} {item.last_name}</Text>
          {item.group_name ? <Text style={styles.rowGroup}>{item.group_name}</Text> : null}
        </View>
        <View style={[styles.check, isPresent ? styles.checkOn : styles.checkOff]}>
          {isPresent && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statNum}>{present.size}</Text>
          <Text style={styles.statLbl}>Present</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#dc2626' }]}>{records.length - present.size}</Text>
          <Text style={styles.statLbl}>Absent</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNum, { color: '#6b7280' }]}>{records.length}</Text>
          <Text style={styles.statLbl}>Total</Text>
        </View>
      </View>

      {/* Search + mark all */}
      <View style={styles.toolbar}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={16} color="#9ca3af" />
          <TextInput style={styles.searchInput} placeholder="Filter…" value={search} onChangeText={setSearch} />
        </View>
        <TouchableOpacity style={[styles.markBtn, { backgroundColor: '#dcfce7' }]} onPress={() => markAll(true)}>
          <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: '600' }}>All Present</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.markBtn, { backgroundColor: '#fee2e2' }]} onPress={() => markAll(false)}>
          <Text style={{ color: '#dc2626', fontSize: 12, fontWeight: '600' }}>All Absent</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.member_id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 90 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color="#d1d5db" />
            <Text style={styles.emptyText}>No members found</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.saveBtn} onPress={save}>
        <Ionicons name="save-outline" size={20} color="#fff" />
        <Text style={styles.saveBtnText}>Save Attendance</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  statsBar: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 20, gap: 24, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#16a34a' },
  statLbl: { fontSize: 11, color: '#6b7280', marginTop: 1 },
  toolbar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7, gap: 6 },
  searchInput: { flex: 1, fontSize: 14, color: '#1f2937' },
  markBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 6 },
  rowPresent: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontWeight: 'bold', fontSize: 14 },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  rowGroup: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  check: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: '#16a34a' },
  checkOff: { backgroundColor: '#e5e7eb', borderWidth: 1, borderColor: '#d1d5db' },
  empty: { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyText: { color: '#9ca3af' },
  saveBtn: { position: 'absolute', bottom: 20, left: 16, right: 16, backgroundColor: PRIMARY, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 5 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
