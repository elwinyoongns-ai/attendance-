import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getMembers, removeMember } from '../database/db';

const PRIMARY = '#2563eb';

export default function MembersScreen({ navigation }) {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');

  const load = async () => {
    const data = await getMembers();
    setMembers(data);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const filtered = members.filter(m =>
    `${m.first_name} ${m.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const confirmDelete = (member) => {
    Alert.alert('Remove Member', `Remove ${member.first_name} ${member.last_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => { await removeMember(member.id); load(); } },
    ]);
  };

  const renderItem = ({ item }) => {
    const initials = `${item.first_name[0]}${item.last_name[0]}`.toUpperCase();
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('MemberDetail', { id: item.id })}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
          {item.group_name ? <Text style={styles.group}>{item.group_name}</Text> : null}
          {item.phone ? <Text style={styles.sub}>{item.phone}</Text> : null}
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => navigation.navigate('MemberForm', { member: item })} style={styles.iconBtn}>
            <Ionicons name="pencil-outline" size={18} color={PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => confirmDelete(item)} style={styles.iconBtn}>
            <Ionicons name="person-remove-outline" size={18} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color="#9ca3af" style={{ marginRight: 6 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search members…"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12, paddingBottom: 90 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No members yet</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('MemberForm', {})}>
        <Ionicons name="person-add" size={22} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 12, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  searchInput: { flex: 1, fontSize: 15, color: '#1f2937' },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#1f2937' },
  group: { fontSize: 12, color: PRIMARY, marginTop: 2 },
  sub: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  actions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 6, borderRadius: 8 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { color: '#9ca3af', fontSize: 15 },
  fab: { position: 'absolute', bottom: 24, right: 20, backgroundColor: PRIMARY, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 5 },
});
