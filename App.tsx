import React, {useState, useEffect, useCallback} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  Category,
  LoyaltyProgram,
  CATEGORY_CONFIG,
  CATEGORY_ORDER,
} from './src/types';
import {loadPrograms, savePrograms} from './src/storage';

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function formatPoints(n: number): string {
  return n.toLocaleString();
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Sub-components ─────────────────────────────────────────────────────────

interface SummaryCardProps {
  category: Category;
  total: number;
  count: number;
}

function SummaryCard({category, total, count}: SummaryCardProps) {
  const cfg = CATEGORY_CONFIG[category];
  return (
    <View style={[styles.summaryCard, {borderLeftColor: cfg.color}]}>
      <Text style={styles.summaryIcon}>{cfg.icon}</Text>
      <View style={styles.summaryInfo}>
        <Text style={styles.summaryLabel}>{cfg.label}</Text>
        <Text style={[styles.summaryPoints, {color: cfg.color}]}>
          {formatPoints(total)}
        </Text>
        <Text style={styles.summaryCount}>
          {count} {count === 1 ? 'program' : 'programs'}
        </Text>
      </View>
    </View>
  );
}

interface ProgramCardProps {
  program: LoyaltyProgram;
  onEdit: (p: LoyaltyProgram) => void;
  onDelete: (id: string) => void;
}

function ProgramCard({program, onEdit, onDelete}: ProgramCardProps) {
  const cfg = CATEGORY_CONFIG[program.category];
  return (
    <View style={[styles.programCard, {borderLeftColor: cfg.color}]}>
      <View style={styles.programHeader}>
        <View style={styles.programTitleRow}>
          <Text style={styles.programIcon}>{cfg.icon}</Text>
          <Text style={styles.programName}>{program.name}</Text>
        </View>
        <View style={styles.programActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onEdit(program)}>
            <Text style={styles.actionBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => onDelete(program.id)}>
            <Text style={[styles.actionBtnText, styles.deleteBtnText]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={[styles.programPoints, {color: cfg.color}]}>
        {formatPoints(program.points)} pts
      </Text>
      {program.accountNumber ? (
        <Text style={styles.programMeta}>Account: {program.accountNumber}</Text>
      ) : null}
      {program.expirationDate ? (
        <Text style={styles.programMeta}>Expires: {program.expirationDate}</Text>
      ) : null}
      <Text style={styles.programUpdated}>Updated: {program.lastUpdated}</Text>
    </View>
  );
}

// ─── Add/Edit Modal ──────────────────────────────────────────────────────────

interface ProgramFormModalProps {
  visible: boolean;
  initial?: LoyaltyProgram;
  onSave: (program: LoyaltyProgram) => void;
  onClose: () => void;
}

function ProgramFormModal({
  visible,
  initial,
  onSave,
  onClose,
}: ProgramFormModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('airline');
  const [points, setPoints] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setCategory(initial.category);
      setPoints(String(initial.points));
      setAccountNumber(initial.accountNumber ?? '');
      setExpirationDate(initial.expirationDate ?? '');
    } else {
      setName('');
      setCategory('airline');
      setPoints('');
      setAccountNumber('');
      setExpirationDate('');
    }
  }, [initial, visible]);

  function handleSave() {
    if (!name.trim()) {
      Alert.alert('Validation', 'Program name is required.');
      return;
    }
    const parsed = parseInt(points.replace(/,/g, ''), 10);
    if (isNaN(parsed) || parsed < 0) {
      Alert.alert('Validation', 'Please enter a valid points balance.');
      return;
    }
    onSave({
      id: initial?.id ?? generateId(),
      name: name.trim(),
      category,
      points: parsed,
      accountNumber: accountNumber.trim() || undefined,
      expirationDate: expirationDate.trim() || undefined,
      lastUpdated: today(),
    });
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SafeAreaView style={styles.modalSafe}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {initial ? 'Edit Program' : 'Add Program'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            keyboardShouldPersistTaps="handled">
            {/* Category Picker */}
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.categoryRow}>
              {CATEGORY_ORDER.map(cat => {
                const cfg = CATEGORY_CONFIG[cat];
                const selected = cat === category;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      selected && {
                        backgroundColor: cfg.color,
                        borderColor: cfg.color,
                      },
                    ]}
                    onPress={() => setCategory(cat)}>
                    <Text style={styles.categoryChipIcon}>{cfg.icon}</Text>
                    <Text
                      style={[
                        styles.categoryChipText,
                        selected && styles.categoryChipTextSelected,
                      ]}>
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Name */}
            <Text style={styles.fieldLabel}>Program Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. United MileagePlus"
              placeholderTextColor="#aaa"
              value={name}
              onChangeText={setName}
            />

            {/* Points */}
            <Text style={styles.fieldLabel}>Points Balance *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 50000"
              placeholderTextColor="#aaa"
              value={points}
              onChangeText={setPoints}
              keyboardType="numeric"
            />

            {/* Account Number */}
            <Text style={styles.fieldLabel}>Account Number (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. UA-123456789"
              placeholderTextColor="#aaa"
              value={accountNumber}
              onChangeText={setAccountNumber}
            />

            {/* Expiration */}
            <Text style={styles.fieldLabel}>Expiration Date (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2026-12-31"
              placeholderTextColor="#aaa"
              value={expirationDate}
              onChangeText={setExpirationDate}
            />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'programs';

export default function App(): React.JSX.Element {
  const [programs, setPrograms] = useState<LoyaltyProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<LoyaltyProgram | undefined>();
  const [filterCategory, setFilterCategory] = useState<Category | 'all'>('all');

  // Load persisted data on mount
  useEffect(() => {
    loadPrograms()
      .then(setPrograms)
      .finally(() => setLoading(false));
  }, []);

  // Persist whenever programs change
  const persist = useCallback((updated: LoyaltyProgram[]) => {
    setPrograms(updated);
    savePrograms(updated);
  }, []);

  function handleSave(program: LoyaltyProgram) {
    const updated = editing
      ? programs.map(p => (p.id === program.id ? program : p))
      : [...programs, program];
    persist(updated);
    setModalVisible(false);
    setEditing(undefined);
  }

  function handleEdit(program: LoyaltyProgram) {
    setEditing(program);
    setModalVisible(true);
  }

  function handleDelete(id: string) {
    Alert.alert('Delete Program', 'Remove this loyalty program?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => persist(programs.filter(p => p.id !== id)),
      },
    ]);
  }

  // ── Dashboard data ─────────────────────────────────────────────────────
  const totals = CATEGORY_ORDER.reduce(
    (acc, cat) => {
      const subset = programs.filter(p => p.category === cat);
      acc[cat] = {
        total: subset.reduce((s, p) => s + p.points, 0),
        count: subset.length,
      };
      return acc;
    },
    {} as Record<Category, {total: number; count: number}>,
  );

  const grandTotal = programs.reduce((s, p) => s + p.points, 0);

  // ── Programs list (filtered) ───────────────────────────────────────────
  const visible =
    filterCategory === 'all'
      ? programs
      : programs.filter(p => p.category === filterCategory);

  const grouped = CATEGORY_ORDER.reduce(
    (acc, cat) => {
      acc[cat] = visible.filter(p => p.category === cat);
      return acc;
    },
    {} as Record<Category, LoyaltyProgram[]>,
  );

  // ── Render ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {/* App Header */}
      <View style={styles.appHeader}>
        <View>
          <Text style={styles.appTitle}>Loyalty Points</Text>
          <Text style={styles.appSubtitle}>All your rewards in one place</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setEditing(undefined);
            setModalVisible(true);
          }}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(['dashboard', 'programs'] as Tab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}>
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}>
              {tab === 'dashboard' ? 'Dashboard' : 'Programs'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}>
        {activeTab === 'dashboard' ? (
          <>
            {/* Grand Total */}
            <View style={styles.grandTotalCard}>
              <Text style={styles.grandTotalLabel}>Total Points</Text>
              <Text style={styles.grandTotalValue}>
                {formatPoints(grandTotal)}
              </Text>
              <Text style={styles.grandTotalSub}>
                across {programs.length}{' '}
                {programs.length === 1 ? 'program' : 'programs'}
              </Text>
            </View>

            {/* Category Summaries */}
            <Text style={styles.sectionTitle}>By Category</Text>
            {CATEGORY_ORDER.map(cat => (
              <SummaryCard
                key={cat}
                category={cat}
                total={totals[cat].total}
                count={totals[cat].count}
              />
            ))}

            {programs.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏆</Text>
                <Text style={styles.emptyTitle}>No programs yet</Text>
                <Text style={styles.emptyText}>
                  Tap "+ Add" to add your first loyalty program.
                </Text>
              </View>
            )}
          </>
        ) : (
          <>
            {/* Category Filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterRow}
              contentContainerStyle={styles.filterContent}>
              {(['all', ...CATEGORY_ORDER] as const).map(cat => {
                const selected = cat === filterCategory;
                const color =
                  cat === 'all' ? '#444' : CATEGORY_CONFIG[cat].color;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.filterChip,
                      selected && {backgroundColor: color, borderColor: color},
                    ]}
                    onPress={() => setFilterCategory(cat)}>
                    <Text
                      style={[
                        styles.filterChipText,
                        selected && styles.filterChipTextSelected,
                      ]}>
                      {cat === 'all'
                        ? 'All'
                        : `${CATEGORY_CONFIG[cat].icon} ${CATEGORY_CONFIG[cat].label}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Program Cards grouped by category */}
            {CATEGORY_ORDER.map(cat => {
              const list = grouped[cat];
              if (list.length === 0) {
                return null;
              }
              const cfg = CATEGORY_CONFIG[cat];
              return (
                <View key={cat}>
                  <Text style={[styles.groupHeader, {color: cfg.color}]}>
                    {cfg.icon} {cfg.label}
                  </Text>
                  {list.map(p => (
                    <ProgramCard
                      key={p.id}
                      program={p}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </View>
              );
            })}

            {visible.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>No programs</Text>
                <Text style={styles.emptyText}>
                  {filterCategory === 'all'
                    ? 'Tap "+ Add" to get started.'
                    : `No ${CATEGORY_CONFIG[filterCategory].label} programs added yet.`}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Add / Edit Modal */}
      <ProgramFormModal
        visible={modalVisible}
        initial={editing}
        onSave={handleSave}
        onClose={() => {
          setModalVisible(false);
          setEditing(undefined);
        }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  container: {flex: 1, backgroundColor: '#f8f9fa'},

  // App Header
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  appTitle: {fontSize: 24, fontWeight: '700', color: '#1a1a1a'},
  appSubtitle: {fontSize: 13, color: '#888', marginTop: 2},
  addBtn: {
    backgroundColor: '#1a73e8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: {color: '#fff', fontWeight: '600', fontSize: 14},

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {borderBottomColor: '#1a73e8'},
  tabText: {fontSize: 14, fontWeight: '500', color: '#888'},
  tabTextActive: {color: '#1a73e8', fontWeight: '600'},

  // Content
  content: {flex: 1},
  contentInner: {padding: 16, paddingBottom: 40},

  // Grand Total
  grandTotalCard: {
    backgroundColor: '#1a73e8',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#1a73e8',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 6,
  },
  grandTotalLabel: {color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '500'},
  grandTotalValue: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -1,
  },
  grandTotalSub: {color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4},

  // Section title
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },

  // Summary Cards
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  summaryIcon: {fontSize: 28, marginRight: 14},
  summaryInfo: {flex: 1},
  summaryLabel: {fontSize: 14, color: '#666', fontWeight: '500'},
  summaryPoints: {fontSize: 26, fontWeight: '700', marginTop: 2},
  summaryCount: {fontSize: 12, color: '#999', marginTop: 2},

  // Filter chips
  filterRow: {marginBottom: 16},
  filterContent: {paddingRight: 8, gap: 8, flexDirection: 'row'},
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  filterChipText: {fontSize: 13, fontWeight: '500', color: '#555'},
  filterChipTextSelected: {color: '#fff'},

  // Group header
  groupHeader: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 4,
  },

  // Program Cards
  programCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  programTitleRow: {flexDirection: 'row', alignItems: 'center', flex: 1},
  programIcon: {fontSize: 16, marginRight: 6},
  programName: {fontSize: 15, fontWeight: '600', color: '#1a1a1a', flex: 1},
  programActions: {flexDirection: 'row', gap: 6},
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a73e8',
  },
  actionBtnText: {fontSize: 12, fontWeight: '500', color: '#1a73e8'},
  deleteBtn: {borderColor: '#e53935'},
  deleteBtnText: {color: '#e53935'},
  programPoints: {fontSize: 22, fontWeight: '700', marginBottom: 4},
  programMeta: {fontSize: 12, color: '#666', marginTop: 2},
  programUpdated: {fontSize: 11, color: '#bbb', marginTop: 4},

  // Empty State
  emptyState: {alignItems: 'center', paddingVertical: 48},
  emptyIcon: {fontSize: 48, marginBottom: 12},
  emptyTitle: {fontSize: 18, fontWeight: '600', color: '#444', marginBottom: 6},
  emptyText: {fontSize: 14, color: '#888', textAlign: 'center'},

  // Modal
  modalContainer: {flex: 1, backgroundColor: '#f8f9fa'},
  modalSafe: {flex: 1},
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  modalCancel: {fontSize: 16, color: '#666'},
  modalTitle: {fontSize: 17, fontWeight: '600', color: '#1a1a1a'},
  modalSave: {fontSize: 16, fontWeight: '600', color: '#1a73e8'},
  modalBody: {flex: 1, padding: 20},

  // Form Fields
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1a1a',
  },
  categoryRow: {flexDirection: 'row', gap: 8},
  categoryChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  categoryChipIcon: {fontSize: 20, marginBottom: 4},
  categoryChipText: {fontSize: 11, fontWeight: '500', color: '#555'},
  categoryChipTextSelected: {color: '#fff'},
});
