import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Contact, Screen } from '../types';
import { SPECIALTY_COLORS } from '../sampleData';

interface Props {
  contact: Contact;
  onNavigate: (screen: Screen) => void;
  onDelete: (id: string) => void;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function ContactDetailScreen({ contact, onNavigate, onDelete }: Props) {
  const color = SPECIALTY_COLORS[contact.specialty] ?? '#4A5568';
  const initials = contact.name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  function confirmDelete() {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(contact.id);
            onNavigate({ name: 'rolodex' });
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1f36" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate({ name: 'rolodex' })} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onNavigate({ name: 'addEdit', contactId: contact.id })}
          style={styles.editBtn}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: color + '15' }]}>
          <View style={[styles.avatar, { backgroundColor: color + '30' }]}>
            <Text style={[styles.avatarText, { color }]}>{initials}</Text>
          </View>
          <Text style={styles.name}>{contact.name}</Text>
          <View style={[styles.specialtyBadge, { backgroundColor: color }]}>
            <Text style={styles.specialtyText}>{contact.specialty}</Text>
          </View>
          {contact.company ? <Text style={styles.company}>{contact.company}</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Info</Text>
          <View style={styles.card}>
            <InfoRow label="Phone" value={contact.phone} />
            <InfoRow label="Email" value={contact.email} />
            <InfoRow label="Company" value={contact.company} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.card}>
            {contact.notes ? (
              <Text style={styles.notesText}>{contact.notes}</Text>
            ) : (
              <Text style={styles.noNotes}>No notes yet. Tap Edit to add some.</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.card}>
            <InfoRow label="Added" value={contact.createdAt} />
          </View>
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
          <Text style={styles.deleteText}>Delete Contact</Text>
        </TouchableOpacity>
      </ScrollView>
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
  backBtn: { paddingVertical: 4, paddingRight: 16 },
  backText: { color: '#a5b4fc', fontSize: 17, fontWeight: '500' },
  editBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
  },
  editText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  content: { padding: 16, paddingBottom: 40 },
  heroCard: {
    alignItems: 'center',
    borderRadius: 20,
    padding: 28,
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 8 },
  specialtyBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 8,
  },
  specialtyText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  company: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  section: { marginBottom: 16 },
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
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: { fontSize: 14, color: '#9ca3af', fontWeight: '500' },
  infoValue: { fontSize: 14, color: '#111827', fontWeight: '500', flex: 1, textAlign: 'right' },
  notesText: { fontSize: 15, color: '#374151', lineHeight: 22 },
  noNotes: { fontSize: 14, color: '#d1d5db', fontStyle: 'italic' },
  deleteButton: {
    marginTop: 8,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#fee2e2',
    backgroundColor: '#fff5f5',
    alignItems: 'center',
  },
  deleteText: { color: '#ef4444', fontWeight: '600', fontSize: 15 },
});
