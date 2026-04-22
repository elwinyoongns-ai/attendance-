import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getMember, getMemberAttendance } from '../database/db';

const PRIMARY = '#2563eb';

export default function MemberDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [member, setMember] = useState(null);
  const [records, setRecords] = useState([]);

  useFocusEffect(useCallback(() => {
    getMember(id).then(setMember);
    getMemberAttendance(id).then(setRecords);
  }, [id]));

  if (!member) return null;

  const initials = `${member.first_name[0]}${member.last_name[0]}`.toUpperCase();
  const total = records.length;
  const present = records.filter(r => r.present).length;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;
  const barColor = rate >= 70 ? '#16a34a' : rate >= 40 ? '#d97706' : '#dc2626';

  return (
    <ScrollView style={styles.container}>
      {/* Profile header */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{member.first_name} {member.last_name}</Text>
        {member.group_name ? <Text style={styles.group}>{member.group_name}</Text> : null}

        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('MemberForm', { member })}>
          <Ionicons name="pencil" size={14} color={PRIMARY} />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Contact info */}
      <View style={styles.card}>
        {member.phone ? <InfoRow icon="call-outline" text={member.phone} /> : null}
        {member.email ? <InfoRow icon="mail-outline" text={member.email} /> : null}
        {member.joined_date ? <InfoRow icon="calendar-outline" text={`Joined ${member.joined_date}`} /> : null}
      </View>

      {/* Attendance rate */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Attendance Rate</Text>
        <View style={styles.rateRow}>
          <Text style={[styles.rateNum, { color: barColor }]}>{rate}%</Text>
          <Text style={styles.rateSub}>{present} present / {total} services</Text>
        </View>
        <View style={styles.barBg}>
          <View style={[styles.barFill, { width: `${rate}%`, backgroundColor: barColor }]} />
        </View>
      </View>

      {/* History */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent History</Text>
        {records.length === 0 ? (
          <Text style={styles.empty}>No records yet.</Text>
        ) : records.map((r, i) => (
          <View key={i} style={styles.histRow}>
            <View>
              <Text style={styles.histName}>{r.name}</Text>
              <Text style={styles.histDate}>{r.service_type} · {r.date}</Text>
            </View>
            <View style={[styles.badge, r.present ? styles.badgeGreen : styles.badgeRed]}>
              <Text style={styles.badgeText}>{r.present ? 'Present' : 'Absent'}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, text }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color="#6b7280" style={{ marginRight: 10 }} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  profileCard: { backgroundColor: PRIMARY, padding: 24, alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  name: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  group: { color: '#bfdbfe', fontSize: 13, marginTop: 4 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 12, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  editBtnText: { color: PRIMARY, fontSize: 13, fontWeight: '600' },
  card: { backgroundColor: '#fff', margin: 12, marginTop: 0, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, marginTop: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoText: { fontSize: 14, color: '#1f2937' },
  rateRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 10 },
  rateNum: { fontSize: 32, fontWeight: 'bold' },
  rateSub: { fontSize: 13, color: '#6b7280' },
  barBg: { height: 8, backgroundColor: '#e5e7eb', borderRadius: 99 },
  barFill: { height: 8, borderRadius: 99 },
  histRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  histName: { fontSize: 14, fontWeight: '600', color: '#1f2937' },
  histDate: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeGreen: { backgroundColor: '#dcfce7' },
  badgeRed: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 12, fontWeight: '600' },
  empty: { color: '#9ca3af', textAlign: 'center', paddingVertical: 12 },
});
