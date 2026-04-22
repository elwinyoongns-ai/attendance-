import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getDashboardStats } from '../database/db';

const PRIMARY = '#2563eb';

function StatCard({ icon, value, label, color }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={28} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function AttendanceBar({ present, total }) {
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;
  const barColor = pct >= 70 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626';
  return (
    <View style={styles.barWrapper}>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={[styles.barPct, { color: barColor }]}>{pct}%</Text>
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState({ memberCount: 0, serviceCount: 0, recent: [] });
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const data = await getDashboardStats();
    setStats(data);
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Grace Community Church</Text>
        <Text style={styles.headerSub}>Attendance System</Text>
      </View>

      <View style={styles.statsRow}>
        <StatCard icon="people" value={stats.memberCount} label="Members" color={PRIMARY} />
        <StatCard icon="calendar" value={stats.serviceCount} label="Services" color="#16a34a" />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Services</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Services')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {stats.recent.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={40} color="#d1d5db" />
            <Text style={styles.emptyText}>No services yet</Text>
          </View>
        ) : stats.recent.map((s, i) => (
          <View key={i} style={styles.serviceRow}>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{s.name}</Text>
              <Text style={styles.serviceDate}>{s.service_type} · {s.date}</Text>
            </View>
            <View style={styles.serviceRight}>
              <Text style={styles.serviceCount}>{s.present_count}/{s.total_count}</Text>
              <AttendanceBar present={s.present_count} total={s.total_count} />
            </View>
          </View>
        ))}
      </View>

      <View style={styles.fabRow}>
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('Services', { screen: 'ServiceForm' })}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.fabText}>New Service</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.fab, { backgroundColor: '#16a34a' }]} onPress={() => navigation.navigate('Members', { screen: 'MemberForm' })}>
          <Ionicons name="person-add" size={18} color="#fff" />
          <Text style={styles.fabText}>Add Member</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: { backgroundColor: PRIMARY, padding: 20, paddingTop: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerSub: { color: '#bfdbfe', fontSize: 13, marginTop: 2 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderLeftWidth: 4, alignItems: 'flex-start', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#1f2937', marginTop: 6 },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  section: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  seeAll: { fontSize: 13, color: PRIMARY },
  empty: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { color: '#9ca3af', fontSize: 14 },
  serviceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  serviceInfo: { flex: 1, marginRight: 12 },
  serviceName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  serviceDate: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  serviceRight: { alignItems: 'flex-end' },
  serviceCount: { fontSize: 13, fontWeight: '600', color: '#374151' },
  barWrapper: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  barBg: { width: 70, height: 6, backgroundColor: '#e5e7eb', borderRadius: 99 },
  barFill: { height: 6, borderRadius: 99 },
  barPct: { fontSize: 11, fontWeight: '600' },
  fabRow: { flexDirection: 'row', gap: 12, margin: 16 },
  fab: { flex: 1, backgroundColor: PRIMARY, borderRadius: 10, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  fabText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
