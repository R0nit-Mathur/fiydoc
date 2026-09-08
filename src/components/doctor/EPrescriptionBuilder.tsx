import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Palette, Spacing, BorderRadius } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  MEDICINES_DIRECTORY,
  DIAGNOSTIC_TESTS_DIRECTORY,
  MedicineItem,
  DiagnosticTestItem,
} from '@/constants/medicalDirectory';
import {
  FREQUENCY_SHORTCUTS,
  DURATION_SHORTCUTS,
  INSTRUCTION_SHORTCUTS,
} from '@/constants/prescriptionShorthands';
import { Pill, Activity, Plus, Trash2, Search } from 'lucide-react-native';

export interface PrescribedMedicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface PrescribedTest {
  id: string;
  name: string;
  category: string;
  fastingRequired: boolean;
}

interface EPrescriptionBuilderProps {
  prescribedMeds: PrescribedMedicine[];
  setPrescribedMeds: React.Dispatch<React.SetStateAction<PrescribedMedicine[]>>;
  prescribedTests: PrescribedTest[];
  setPrescribedTests: React.Dispatch<React.SetStateAction<PrescribedTest[]>>;
  followUpNotes: string;
  setFollowUpNotes: (val: string) => void;
}

export function EPrescriptionBuilder({
  prescribedMeds,
  setPrescribedMeds,
  prescribedTests,
  setPrescribedTests,
  followUpNotes,
  setFollowUpNotes,
}: EPrescriptionBuilderProps) {
  const { colors, isDark } = useAppTheme();
  // Modals & Confirmation States
  const [addMedModal, setAddMedModal] = useState(false);
  const [addTestModal, setAddTestModal] = useState(false);
  const [medSearch, setMedSearch] = useState('');
  const [testSearch, setTestSearch] = useState('');

  // New Custom Medicine Form
  const [customMedName, setCustomMedName] = useState('');
  const [customDosage, setCustomDosage] = useState('1 tablet');
  const [customFrequency, setCustomFrequency] = useState('Twice daily');
  const [customDuration, setCustomDuration] = useState('5 days');
  const [customInstructions, setCustomInstructions] = useState('After meals');

  const filteredMedicines = useMemo(() => {
    if (!medSearch.trim()) return MEDICINES_DIRECTORY.slice(0, 5);
    return MEDICINES_DIRECTORY.filter(
      (m) =>
        m.name.toLowerCase().includes(medSearch.toLowerCase()) ||
        m.generic.toLowerCase().includes(medSearch.toLowerCase())
    );
  }, [medSearch]);

  const filteredTests = useMemo(() => {
    if (!testSearch.trim()) return DIAGNOSTIC_TESTS_DIRECTORY.slice(0, 5);
    return DIAGNOSTIC_TESTS_DIRECTORY.filter(
      (t) =>
        t.name.toLowerCase().includes(testSearch.toLowerCase()) ||
        t.category.toLowerCase().includes(testSearch.toLowerCase())
    );
  }, [testSearch]);

  const handleAddPresetMedicine = (m: MedicineItem) => {
    const newMed: PrescribedMedicine = {
      id: `med_${Date.now()}`,
      name: `${m.name} (${m.generic})`,
      dosage: m.defaultDosage,
      frequency: m.defaultFrequency.split('(')[0].trim() || 'Twice daily',
      duration: m.defaultDuration,
      instructions: m.instructions,
    };
    setPrescribedMeds((prev) => [...prev, newMed]);
    setAddMedModal(false);
    setMedSearch('');
  };

  const handleAddCustomMedicine = () => {
    if (!customMedName.trim()) return;
    const newMed: PrescribedMedicine = {
      id: `med_${Date.now()}`,
      name: customMedName.trim(),
      dosage: customDosage.trim() || '1 tablet',
      frequency: customFrequency.trim() || 'Twice daily',
      duration: customDuration.trim() || '5 days',
      instructions: customInstructions.trim() || 'After meals',
    };
    setPrescribedMeds((prev) => [...prev, newMed]);
    setCustomMedName('');
    setAddMedModal(false);
  };

  const handleAddPresetTest = (t: DiagnosticTestItem) => {
    const newTest: PrescribedTest = {
      id: `test_${Date.now()}`,
      name: t.name,
      category: t.category,
      fastingRequired: t.fastingRequired,
    };
    setPrescribedTests((prev) => [...prev, newTest]);
    setAddTestModal(false);
    setTestSearch('');
  };

  const handleRemoveMedicine = (idToRemove: string) => {
    setPrescribedMeds((prev) => prev.filter((m) => m.id !== idToRemove));
  };

  const handleRemoveTest = (idToRemove: string) => {
    setPrescribedTests((prev) => prev.filter((t) => t.id !== idToRemove));
  };

  return (
    <>
      {/* 2. Prescribe Medications */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeaderRow}>
          <Pill size={16} color={colors.teal} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Prescribe Medications ({prescribedMeds.length})</Text>
          <TouchableOpacity
            onPress={() => setAddMedModal(true)}
            style={[styles.addSectionBtn, { backgroundColor: isDark ? 'rgba(45, 212, 191, 0.15)' : '#E6F9F5', borderColor: colors.border }]}
            activeOpacity={0.8}
          >
            <Plus size={14} color={colors.teal} />
            <Text style={[styles.addSectionBtnText, { color: colors.teal }]}>Add Medicine</Text>
          </TouchableOpacity>
        </View>

        {prescribedMeds.length === 0 ? (
          <View style={[styles.emptyItemsBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.emptyItemsText, { color: colors.textMuted }]}>No medications added yet.</Text>
          </View>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {prescribedMeds.map((med) => (
              <View key={med.id} style={[styles.medCard, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7', borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.medName, { color: colors.text }]}>{med.name}</Text>
                  <Text style={[styles.medMeta, { color: colors.textSecondary }]}>
                    Dosage: <Text style={{ fontWeight: '700', color: colors.text }}>{med.dosage}</Text> • Frequency: <Text style={{ fontWeight: '700', color: colors.text }}>{med.frequency}</Text>
                  </Text>
                  <Text style={[styles.medDuration, { color: colors.textMuted }]}>Duration: {med.duration}</Text>
                  {med.instructions ? (
                    <Text style={[styles.medInstructions, { color: colors.textSecondary }]}>Instructions: {med.instructions}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveMedicine(med.id)}
                  style={styles.deleteBtn}
                  activeOpacity={0.7}
                >
                  <Trash2 size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 3. Diagnostic Lab Investigations */}
      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeaderRow}>
          <Activity size={16} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Lab Investigations ({prescribedTests.length})</Text>
          <TouchableOpacity
            onPress={() => setAddTestModal(true)}
            style={[styles.addSectionBtn, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(10, 132, 255, 0.15)' : '#EBF5FF' }]}
            activeOpacity={0.8}
          >
            <Plus size={14} color={colors.primary} />
            <Text style={[styles.addSectionBtnText, { color: colors.primary }]}>Add Test</Text>
          </TouchableOpacity>
        </View>

        {prescribedTests.length === 0 ? (
          <View style={[styles.emptyItemsBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.emptyItemsText, { color: colors.textMuted }]}>No lab investigations ordered.</Text>
          </View>
        ) : (
          <View style={{ gap: Spacing.sm }}>
            {prescribedTests.map((t) => (
              <View key={t.id} style={[styles.testCard, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7', borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.testName, { color: colors.text }]}>{t.name}</Text>
                  <Text style={[styles.testCategory, { color: colors.textSecondary }]}>{t.category}</Text>
                </View>
                <Badge
                  label={t.fastingRequired ? 'FASTING' : 'ROUTINE'}
                  variant={t.fastingRequired ? 'warning' : 'teal'}
                  size="sm"
                />
                <TouchableOpacity
                  onPress={() => handleRemoveTest(t.id)}
                  style={styles.deleteBtn}
                  activeOpacity={0.7}
                >
                  <Trash2 size={16} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 4. Clinical Advice & Follow-Up */}
      <View style={styles.sectionCard}>
        <Text style={styles.fieldLabel}>Doctor's Advice & Review Instructions</Text>
        <TextInput
          placeholder="e.g. Review after 7 days in clinic or SOS if fever persists."
          placeholderTextColor={Palette.textMuted}
          value={followUpNotes}
          onChangeText={setFollowUpNotes}
          style={styles.inputField}
        />
      </View>

      {/* Add Medicine Modal */}
      <Modal
        visible={addMedModal}
        onClose={() => setAddMedModal(false)}
        title="Add Medication"
      >
        <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: Spacing.md, paddingVertical: Spacing.xs }}>
            <Text style={styles.modalSubheading}>Quick Search from Medical Directory</Text>
            <View style={styles.searchContainer}>
              <Search size={16} color={Palette.textMuted} />
              <TextInput
                placeholder="Search Dolo, Augmentin, Pan 40..."
                placeholderTextColor={Palette.textMuted}
                value={medSearch}
                onChangeText={setMedSearch}
                style={styles.searchInput}
              />
            </View>

            <View style={{ gap: Spacing.xs }}>
              {filteredMedicines.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleAddPresetMedicine(item)}
                  activeOpacity={0.8}
                  style={styles.presetItem}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.presetName}>{item.name}</Text>
                    <Text style={styles.presetGeneric}>{item.generic}</Text>
                  </View>
                  <Text style={styles.presetAction}>+ Add</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalDivider} />

            <Text style={styles.modalSubheading}>Or Enter Custom Medication</Text>
            <TextInput
              placeholder="Medicine Name (e.g. Azithromycin 500mg)"
              placeholderTextColor={Palette.textMuted}
              value={customMedName}
              onChangeText={setCustomMedName}
              style={styles.inputField}
            />

            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabelSmall}>Dosage</Text>
                <TextInput
                  placeholder="1 tablet"
                  placeholderTextColor={Palette.textMuted}
                  value={customDosage}
                  onChangeText={setCustomDosage}
                  style={styles.inputField}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabelSmall}>Frequency</Text>
                <View style={styles.shorthandChips}>
                  {FREQUENCY_SHORTCUTS.map((s) => (
                    <TouchableOpacity
                      key={s.label}
                      onPress={() => setCustomFrequency(s.full)}
                      activeOpacity={0.75}
                      style={[
                        styles.shorthandChip,
                        {
                          backgroundColor: isDark ? 'rgba(0, 168, 150, 0.2)' : '#E0F7F5',
                          borderColor: isDark ? 'rgba(0, 168, 150, 0.4)' : '#76F4E0',
                        },
                      ]}
                    >
                      <Text style={[styles.shorthandChipLabel, { color: colors.teal }]}>{s.label}</Text>
                      <Text style={[styles.shorthandChipHint, { color: isDark ? colors.textMuted : Palette.textMuted }]}>
                        {s.hint}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  placeholder="Twice daily"
                  placeholderTextColor={Palette.textMuted}
                  value={customFrequency}
                  onChangeText={setCustomFrequency}
                  style={styles.inputField}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabelSmall}>Duration</Text>
                <View style={styles.shorthandChips}>
                  {DURATION_SHORTCUTS.map((s) => (
                    <TouchableOpacity
                      key={s.value}
                      onPress={() => setCustomDuration(s.value)}
                      activeOpacity={0.75}
                      style={[
                        styles.shorthandChip,
                        {
                          backgroundColor: isDark ? 'rgba(20, 80, 163, 0.2)' : '#EBF5FF',
                          borderColor: isDark ? 'rgba(56, 189, 248, 0.4)' : '#ADC6FF',
                        },
                      ]}
                    >
                      <Text style={[styles.shorthandChipLabel, { color: colors.primary }]}>{s.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  placeholder="5 days"
                  placeholderTextColor={Palette.textMuted}
                  value={customDuration}
                  onChangeText={setCustomDuration}
                  style={styles.inputField}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabelSmall}>Instructions</Text>
                <View style={styles.shorthandChips}>
                  {INSTRUCTION_SHORTCUTS.map((s) => (
                    <TouchableOpacity
                      key={s.label}
                      onPress={() => setCustomInstructions(s.value)}
                      activeOpacity={0.75}
                      style={[
                        styles.shorthandChip,
                        {
                          backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
                          borderColor: isDark ? 'rgba(245, 158, 11, 0.4)' : '#FDE68A',
                        },
                      ]}
                    >
                      <Text style={[styles.shorthandChipLabel, { color: isDark ? '#FBBF24' : '#D97706' }]}>
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  placeholder="After meals"
                  placeholderTextColor={Palette.textMuted}
                  value={customInstructions}
                  onChangeText={setCustomInstructions}
                  style={styles.inputField}
                />
              </View>
            </View>

            <Button
              title="Add to Prescription"
              onPress={handleAddCustomMedicine}
              variant="teal"
              size="md"
            />
          </View>
        </ScrollView>
      </Modal>

      {/* Add Lab Test Modal */}
      <Modal
        visible={addTestModal}
        onClose={() => setAddTestModal(false)}
        title="Add Diagnostic Lab Investigation"
      >
        <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: Spacing.md, paddingVertical: Spacing.xs }}>
            <View style={styles.searchContainer}>
              <Search size={16} color={Palette.textMuted} />
              <TextInput
                placeholder="Search CBC, Lipid Profile, Blood Sugar..."
                placeholderTextColor={Palette.textMuted}
                value={testSearch}
                onChangeText={setTestSearch}
                style={styles.searchInput}
              />
            </View>

            <View style={{ gap: Spacing.xs }}>
              {filteredTests.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleAddPresetTest(item)}
                  activeOpacity={0.8}
                  style={styles.presetItem}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.presetName}>{item.name}</Text>
                    <Text style={styles.presetGeneric}>Category: {item.category}</Text>
                  </View>
                  <Text style={styles.presetAction}>+ Order</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: Palette.card,
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Palette.cardBorderLight,
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.primaryDark,
    flex: 1,
  },
  addSectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.healthcareTealLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Palette.healthcareTealBorder,
    gap: 4,
  },
  addSectionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.healthcareTeal,
  },
  emptyItemsBox: {
    backgroundColor: Palette.background,
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderStyle: 'dashed',
  },
  emptyItemsText: {
    fontSize: 13,
    color: Palette.textMuted,
  },
  medCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.background,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  medName: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  medMeta: {
    fontSize: 13,
    color: Palette.textSecondary,
    marginTop: 4,
  },
  medDuration: {
    fontSize: 12,
    color: Palette.textSecondary,
    marginTop: 2,
  },
  medInstructions: {
    fontSize: 11,
    color: Palette.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  deleteBtn: {
    padding: 8,
    backgroundColor: Palette.dangerBg,
    borderRadius: 8,
    marginLeft: Spacing.sm,
  },
  testCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.background,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  testName: {
    fontSize: 15,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  testCategory: {
    fontSize: 12,
    color: Palette.textSecondary,
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textSecondary,
    textTransform: 'uppercase',
  },
  fieldLabelSmall: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  inputField: {
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: 15,
    color: Palette.textPrimary,
  },
  modalSubheading: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    height: 48,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Palette.textPrimary,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.card,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  presetName: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  presetGeneric: {
    fontSize: 12,
    color: Palette.textSecondary,
    marginTop: 2,
  },
  presetAction: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.healthcareTeal,
  },
  modalDivider: {
    height: 1,
    backgroundColor: Palette.cardBorder,
    marginVertical: Spacing.sm,
  },
  shorthandChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
    gap: 4,
  },
  shorthandChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  shorthandChipLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  shorthandChipHint: {
    fontSize: 9,
    marginLeft: 3,
  },
});
