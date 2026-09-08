/**
 * Health Records Screen — Stitch Clinical Clarity
 *
 * Features:
 * - Segmented tabs (Prescriptions / Medical History)
 * - Category filter chips
 * - Prescription list + Medical history list
 * - Add Document modal
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useHealthStore } from '@/store/useHealthStore';
import { Prescription } from '@/types/index';
import { StitchColors, BorderRadius, Shadows, Spacing, Palette } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { FileText, Plus, Pill } from 'lucide-react-native';
import { PrescriptionsTab } from '@/components/patient/PrescriptionsTab';
import { HealthHistoryTab } from '@/components/patient/HealthHistoryTab';
import { AddDocumentModal } from '@/components/patient/AddDocumentModal';
import { PrescriptionDetailModal } from '@/components/patient/PrescriptionDetailModal';

export default function HealthHubScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { records, prescriptions } = useHealthStore();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();

  const patientPrescriptions = useMemo(() => {
    return prescriptions.filter((p) => {
      if (!user) return true;
      if (user.role === 'patient') {
        return !p.patientId || p.patientId === user.id ||
          (p.patientName && user.name && p.patientName.toLowerCase() === user.name.toLowerCase());
      }
      return true;
    });
  }, [prescriptions, user]);

  const [activeTab, setActiveTab] = useState<'PRESCRIPTIONS' | 'HISTORY'>('PRESCRIPTIONS');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [rxModalVisible, setRxModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
      await new Promise((r) => setTimeout(r, 400));
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const openPrescriptionModal = (rx: Prescription) => {
    setSelectedPrescription(rx);
    setRxModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Health Records</Text>
        <TouchableOpacity
          onPress={() => setUploadModalVisible(true)}
          style={[styles.addBtn, { backgroundColor: StitchColors.secondaryContainer }]}
          accessibilityRole="button"
          accessibilityLabel="Add document"
        >
          <Plus size={14} color="#fff" />
          <Text style={styles.addBtnText}>Add Document</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Switcher */}
      <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
        <View
          style={[
            styles.tabBg,
            { backgroundColor: colors.backgroundElement },
          ]}
        >
          <TouchableOpacity
            onPress={() => setActiveTab('PRESCRIPTIONS')}
            style={[
              styles.tabBtn,
              activeTab === 'PRESCRIPTIONS' && [
                styles.tabBtnActive,
                { backgroundColor: StitchColors.primaryContainer },
              ],
            ]}
            accessibilityRole="tab"
          >
            <Pill
              size={15}
              color={activeTab === 'PRESCRIPTIONS' ? '#fff' : colors.textSecondary}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.tabText,
                { color: activeTab === 'PRESCRIPTIONS' ? '#fff' : colors.textSecondary },
              ]}
            >
              Prescriptions ({patientPrescriptions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('HISTORY')}
            style={[
              styles.tabBtn,
              activeTab === 'HISTORY' && [
                styles.tabBtnActive,
                { backgroundColor: StitchColors.primaryContainer },
              ],
            ]}
            accessibilityRole="tab"
          >
            <FileText
              size={15}
              color={activeTab === 'HISTORY' ? '#fff' : colors.textSecondary}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.tabText,
                { color: activeTab === 'HISTORY' ? '#fff' : colors.textSecondary },
              ]}
            >
              Medical History
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[StitchColors.secondaryContainer]}
            tintColor={StitchColors.secondaryContainer}
          />
        }
      >
        {activeTab === 'PRESCRIPTIONS' ? (
          <PrescriptionsTab prescriptions={patientPrescriptions} />
        ) : (
          <HealthHistoryTab records={records} prescriptions={prescriptions} />
        )}
        <View style={{ height: 110 }} />
      </ScrollView>

      <AddDocumentModal visible={uploadModalVisible} onClose={() => setUploadModalVisible(false)} />
      <PrescriptionDetailModal
        visible={rxModalVisible}
        onClose={() => setRxModalVisible(false)}
        prescription={selectedPrescription}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  tabContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  tabBg: {
    flexDirection: 'row',
    borderRadius: BorderRadius.full,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  tabBtnActive: {
    ...Shadows.subtle,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
  },
});
