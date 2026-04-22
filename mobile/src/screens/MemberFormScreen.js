import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { addMember, updateMember } from '../database/db';

const PRIMARY = '#2563eb';
const today = new Date().toISOString().split('T')[0];

const SERVICE_GROUPS = ['Choir', 'Youth', 'Cell A', 'Cell B', 'Ushers', 'Media', ''];

export default function MemberFormScreen({ route, navigation }) {
  const existing = route.params?.member;
  const [form, setForm] = useState({
    first_name: existing?.first_name || '',
    last_name: existing?.last_name || '',
    email: existing?.email || '',
    phone: existing?.phone || '',
    group_name: existing?.group_name || '',
    joined_date: existing?.joined_date || today,
  });

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const save = async () => {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      Alert.alert('Required', 'Please enter first and last name.');
      return;
    }
    if (existing) {
      await updateMember(existing.id, form);
    } else {
      await addMember(form);
    }
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.section}>
        <Field label="First Name *" value={form.first_name} onChangeText={set('first_name')} placeholder="e.g. James" autoFocus />
        <Field label="Last Name *" value={form.last_name} onChangeText={set('last_name')} placeholder="e.g. Okonkwo" />
        <Field label="Phone" value={form.phone} onChangeText={set('phone')} placeholder="+1 555 000 0000" keyboardType="phone-pad" />
        <Field label="Email" value={form.email} onChangeText={set('email')} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" />
        <Field label="Date Joined (YYYY-MM-DD)" value={form.joined_date} onChangeText={set('joined_date')} placeholder={today} />

        <Text style={styles.label}>Group / Cell</Text>
        <View style={styles.chipRow}>
          {SERVICE_GROUPS.map(g => (
            <TouchableOpacity
              key={g || '__none__'}
              style={[styles.chip, form.group_name === g && styles.chipActive]}
              onPress={() => set('group_name')(g)}
            >
              <Text style={[styles.chipText, form.group_name === g && styles.chipTextActive]}>
                {g || 'None'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.input}
          value={form.group_name}
          onChangeText={set('group_name')}
          placeholder="Or type a custom group…"
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveBtnText}>{existing ? 'Update Member' : 'Save Member'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, ...props }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  section: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 11, fontSize: 15, backgroundColor: '#fafafa', color: '#1f2937' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  chipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  saveBtn: { backgroundColor: PRIMARY, margin: 16, borderRadius: 12, padding: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
