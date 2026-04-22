import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getMemberStats, getServiceStats } from '../database/db';

const PRIMARY = '#2563eb';

function RateBar({ present, total }) {
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;
  const color = pct >= 70 ? '#16a34a' : pct >= 40 ? '#d97706' : '#dc2626';
  return (
    <View style={styles.barRow}>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.barPct, { color }]}>{pct}%</Text>
    </View>
  );
}

export default function ReportsScreen() {
  const [memberStats, setMemberStats] = useState([]);
  const [serviceStats, setServiceStats] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setMemberStats(await getMemberStats());
    setServiceStats(await getServiceStats());
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

      {/* Service attendance chart */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Services</Text>
        {serviceStats.length === 0 ? (
          <Text style={styles.empty}>No services yet.</Text>
        ) : serviceStats.map((s, i) => (
          <View key={i} style={styles.svcRow}>
            <View style={styles.svcLeft}>
              <Text style={styles.svcName} numberOfLines={1}>{s.name}</Text>
              <Text style={styles.svcDate}>{s.date}</Text>
            </View>
            <View style={styles.svcRight}>
              <Text style={styles.svcCount}>{s.present_count}/{s.total_count}</Text>
              <RateBar present={s.present_count} total={s.total_count} />
            </View>
          </View>
        ))}
      </View>

      {/* Member leaderboard */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Member Attendance</Text>
        {memberStats.length === 0 ? (
          <Text style={styles.empty}>No members yet.</Text>
        ) : memberStats.map((m, i) => (
          <View key={m.id} style={styles.memberRow}>
            <Text style={styles.rank}>#{i + 1}</Text>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>{m.first_name} {m.last_name}</Text>
              {m.group_name ? <Text style={styles.memberGroup}>{m.group_name}</Text> : null}
            </View>
            <View style={styles.memberRight}>
              <Text style={styles.memberCount}>{m.present}/{m.total}</Text>
              <RateBar present={m.present} total={m.total} />
            </View>
          </View>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#16a34a' }]} /><Text style={styles.legendText}>≥70%</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#d97706' }]} /><Text style={styles.legendText}>40-69%</Text></View>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: '#dc2626' }]} /><Text style={styles.legendText}>&lt;40%</Text></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  card: { backgroundColor: '#fff', margin: 12, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1f2937', marginBottom: 14 },
  empty: { color: '#9ca3af', textAlign: 'center', paddingVertical: 12 },
  svcRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  svcLeft: { flex: 1, marginRight: 12 },
  svcName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  svcDate: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  svcRight: { alignItems: 'flex-end', minWidth: 90 },
  svcCount: { fontSize: 12, color: '#6b7280' },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6', gap: 10 },
  rank: { fontSize: 13, color: '#9ca3af', width: 24, textAlign: 'center' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  memberGroup: { fontSize: 11, color: PRIMARY, marginTop: 1 },
  memberRight: { alignItems: 'flex-end', minWidth: 80 },
  memberCount: { fontSize: 12, color: '#6b7280' },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  barBg: { width: 60, height: 6, backgroundColor: '#e5e7eb', borderRadius: 99 },
  barFill: { height: 6, borderRadius: 99 },
  barPct: { fontSize: 11, fontWeight: '600', minWidth: 30 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, paddingVertical: 12, marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#6b7280' },
});
