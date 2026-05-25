import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Contact, Screen } from '../types';
import { SPECIALTIES, SPECIALTY_COLORS } from '../sampleData';

interface Props {
  contact?: Contact;
  onSave: (contact: Contact) => void;
  onNavigate: (screen: Screen) => void;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, multiline && styles.fieldInputMulti]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? ''}
        placeholderTextColor="#9ca3af"
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType ?? 'default'}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

export default function AddEditContactScreen({ contact, onSave, onNavigate }: Props) {
  const isEdit = Boolean(contact);
  const [name, setName] = useState(contact?.name ?? '');
  const [specialty, setSpecialty] = useState(contact?.specialty ?? SPECIALTIES[0]);
  const [phone, setPhone] = useState(contact?.phone ?? '');
  const [email, setEmail] = useState(contact?.email ?? '');
  const [company, setCompany] = useState(contact?.company ?? '');
  const [notes, setNotes] = useState(contact?.notes ?? '');
  const [showSpecialtyPicker, setShowSpecialtyPicker] = useState(false);
  const [nameError, setNameError] = useState('');

  function handleSave() {
    if (!name.trim()) {
      setNameError('Name is required');
      return;
    }
    const now = new Date().toISOString().split('T')[0];
    const saved: Contact = {
      id: contact?.id ?? String(Date.now()),
      name: name.trim(),
      specialty,
      phone: phone.trim(),
      email: email.trim(),
      company: company.trim(),
      notes: notes.trim(),
      createdAt: contact?.createdAt ?? now,
    };
    onSave(saved);
    onNavigate({ name: 'detail', contactId: saved.id });
  }

  const selectedColor = SPECIALTY_COLORS[specialty] ?? '#4A5568';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1f36" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() =>
            onNavigate(contact ? { name: 'detail', contactId: contact.id } : { name: 'rolodex' })
          }
          style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEdit ? 'Edit Contact' : 'New Contact'}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Info</Text>
            <View style={styles.card}>
              <Field
                label="Full Name *"
                value={name}
                onChange={v => {
                  setName(v);
                  setNameError('');
                }}
                placeholder="e.g. Dr. Jane Smith"
              />
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specialty</Text>
            <TouchableOpacity
              style={styles.specialtySelector}
              onPress={() => setShowSpecialtyPicker(v => !v)}>
              <View style={[styles.specialtyDot, { backgroundColor: selectedColor }]} />
              <Text style={styles.specialtyName}>{specialty}</Text>
              <Text style={styles.chevron}>{showSpecialtyPicker ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showSpecialtyPicker && (
              <View style={styles.specialtyGrid}>
                {SPECIALTIES.map(s => {
                  const c = SPECIALTY_COLORS[s] ?? '#4A5568';
                  const active = s === specialty;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[styles.specialtyChip, active && { backgroundColor: c + '22', borderColor: c }]}
                      onPress={() => {
                        setSpecialty(s);
                        setShowSpecialtyPicker(false);
                      }}>
                      <View style={[styles.chipDot, { backgroundColor: c }]} />
                      <Text style={[styles.chipText, active && { color: c, fontWeight: '700' }]}>
                        {s}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Info</Text>
            <View style={styles.card}>
              <Field
                label="Phone"
                value={phone}
                onChange={setPhone}
                placeholder="(555) 000-0000"
                keyboardType="phone-pad"
              />
              <Field
                label="Email"
                value={email}
                onChange={setEmail}
                placeholder="name@example.com"
                keyboardType="email-address"
              />
              <Field
                label="Company / Organization"
                value={company}
                onChange={setCompany}
                placeholder="e.g. General Hospital"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.card}>
              <Field
                label="Notes"
                value={notes}
                onChange={setNotes}
                placeholder="Add any notes, reminders, or details..."
                multiline
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1f36',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  cancelBtn: { paddingVertical: 4, paddingRight: 8 },
  cancelText: { color: '#a5b4fc', fontSize: 16 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#ffffff' },
  saveBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
  },
  saveText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  content: { padding: 16, paddingBottom: 60 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  field: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#9ca3af', marginBottom: 4 },
  fieldInput: { fontSize: 15, color: '#111827', paddingVertical: 0 },
  fieldInputMulti: { minHeight: 90, paddingTop: 4 },
  errorText: { fontSize: 12, color: '#ef4444', marginTop: 4, marginBottom: 4 },
  specialtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  specialtyDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  specialtyName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111827' },
  chevron: { color: '#9ca3af', fontSize: 12 },
  specialtyGrid: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  specialtyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  chipDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
});
