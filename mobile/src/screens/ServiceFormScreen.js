import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { addService } from '../database/db';

const PRIMARY = '#2563eb';
const today = new Date().toISOString().split('T')[0];

const SERVICE_TYPES = ['Sunday Service', 'Bible Study', 'Prayer Meeting', 'Youth Service', 'Special Event', 'Other'];

export default function ServiceFormScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', service_type: 'Sunday Service', date: today, notes: '' });
  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }));

  const save = async () => {
    if (!form.name.trim()) { Alert.alert('Required', 'Please enter a service name.'); return; }
    if (!form.date.match(/^\d{4}-\d{2}-\d{2}$/)) { Alert.alert('Invalid Date', 'Use format YYYY-MM-DD'); return; }
    const id = await addService(form);
    navigation.replace('Attendance', { serviceId: id, serviceName: form.name });
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <View style={{ marginBottom: 14 }}>
          <Text style={styles.label}>Service Name *</Text>
          <TextInput style={styles.input} value={form.name} onChangeText={set('name')} placeholder="e.g. Sunday Morning Service" autoFocus />
        </View>

        <Text style={styles.label}>Service Type</Text>
        <View style={styles.chipRow}>
          {SERVICE_TYPES.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.chip, form.service_type === t && styles.chipActive]}
              onPress={() => set('service_type')(t)}
            >
              <Text style={[styles.chipText, form.service_type === t && styles.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ marginTop: 14, marginBottom: 14 }}>
          <Text style={styles.label}>Date (YYYY-MM-DD) *</Text>
          <TextInput style={styles.input} value={form.date} onChangeText={set('date')} placeholder={today} />
        </View>

        <Text style={styles.label}>Notes</Text>
        <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={form.notes} onChangeText={set('notes')} placeholder="Optional notes…" multiline />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={save}>
        <Text style={styles.saveBtnText}>Create & Take Attendance</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  card: { backgroundColor: '#fff', margin: 16, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 11, fontSize: 15, backgroundColor: '#fafafa', color: '#1f2937' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  chipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipText: { fontSize: 13, color: '#374151' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  saveBtn: { backgroundColor: PRIMARY, margin: 16, borderRadius: 12, padding: 16, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
