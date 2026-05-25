import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SectionList,
  StyleSheet,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { Contact, Screen } from '../types';
import { SPECIALTY_COLORS } from '../sampleData';

interface Props {
  contacts: Contact[];
  onNavigate: (screen: Screen) => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function RolodexScreen({ contacts, onNavigate }: Props) {
  const [search, setSearch] = useState('');
  const [activeSpecialty, setActiveSpecialty] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return contacts.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.specialty.toLowerCase().includes(search.toLowerCase()) ||
        c.company.toLowerCase().includes(search.toLowerCase());
      const matchesSpecialty = activeSpecialty ? c.specialty === activeSpecialty : true;
      return matchesSearch && matchesSpecialty;
    });
  }, [contacts, search, activeSpecialty]);

  const specialties = useMemo(
    () => [...new Set(contacts.map(c => c.specialty))].sort(),
    [contacts],
  );

  const sections = useMemo(() => {
    const grouped: Record<string, Contact[]> = {};
    filtered.forEach(c => {
      if (!grouped[c.specialty]) grouped[c.specialty] = [];
      grouped[c.specialty].push(c);
    });
    return Object.keys(grouped)
      .sort()
      .map(specialty => ({ title: specialty, data: grouped[specialty] }));
  }, [filtered]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1f36" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rolodex</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => onNavigate({ name: 'addEdit' })}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts, specialties..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        horizontal
        data={['All', ...specialties]}
        keyExtractor={item => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBar}
        renderItem={({ item }) => {
          const isAll = item === 'All';
          const isActive = isAll ? activeSpecialty === null : activeSpecialty === item;
          const color = isAll ? '#6366f1' : (SPECIALTY_COLORS[item] ?? '#4A5568');
          return (
            <TouchableOpacity
              style={[
                styles.filterChip,
                isActive && { backgroundColor: color, borderColor: color },
              ]}
              onPress={() => setActiveSpecialty(isAll ? null : item)}>
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {sections.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📇</Text>
          <Text style={styles.emptyText}>No contacts found</Text>
          <Text style={styles.emptySubtext}>
            {contacts.length === 0 ? 'Tap "+ Add" to create your first contact' : 'Try a different search'}
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section: { title } }) => {
            const color = SPECIALTY_COLORS[title] ?? '#4A5568';
            return (
              <View style={[styles.sectionHeader, { borderLeftColor: color }]}>
                <View style={[styles.sectionDot, { backgroundColor: color }]} />
                <Text style={styles.sectionTitle}>{title}</Text>
                <Text style={styles.sectionCount}>
                  {sections.find(s => s.title === title)?.data.length ?? 0}
                </Text>
              </View>
            );
          }}
          renderItem={({ item }) => {
            const color = SPECIALTY_COLORS[item.specialty] ?? '#4A5568';
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => onNavigate({ name: 'detail', contactId: item.id })}>
                <View style={[styles.avatar, { backgroundColor: color + '22' }]}>
                  <Text style={[styles.avatarText, { color }]}>{getInitials(item.name)}</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  {item.company ? (
                    <Text style={styles.cardCompany}>{item.company}</Text>
                  ) : null}
                  {item.phone ? <Text style={styles.cardMeta}>{item.phone}</Text> : null}
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
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
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#ffffff', letterSpacing: 0.5 },
  addButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  searchContainer: { backgroundColor: '#1a1f36', paddingHorizontal: 16, paddingBottom: 14 },
  searchInput: {
    backgroundColor: '#2d3354',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#ffffff',
  },
  filterBar: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    marginRight: 8,
  },
  filterChipText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  filterChipTextActive: { color: '#ffffff' },
  listContent: { paddingBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderLeftWidth: 4,
    marginTop: 8,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  sectionTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.8 },
  sectionCount: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { fontSize: 16, fontWeight: '700' },
  cardBody: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  cardCompany: { fontSize: 13, color: '#6b7280', marginTop: 1 },
  cardMeta: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  chevron: { fontSize: 22, color: '#d1d5db' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
});
