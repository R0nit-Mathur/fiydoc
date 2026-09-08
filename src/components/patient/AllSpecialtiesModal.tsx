import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { ALL_SPECIALTIES, SpecialtyConfig } from '@/constants/specialties';
import { Palette, Typography, BorderRadius, Shadows, Spacing, StitchColors } from '@/constants/theme';
import {
  X,
  Search as SearchIcon,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';

interface AllSpecialtiesModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AllSpecialtiesModal({ visible, onClose }: AllSpecialtiesModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSpecialties = useMemo(() => {
    if (!searchQuery.trim()) return ALL_SPECIALTIES;
    const q = searchQuery.toLowerCase().trim();
    return ALL_SPECIALTIES.filter(
      (spec) =>
        spec.name.toLowerCase().includes(q) ||
        spec.desc.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSelectSpecialty = (spec: SpecialtyConfig) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    onClose();
    router.push({
      pathname: '/(patient)/(tabs)/discovery',
      params: { specialty: spec.name },
    });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>All Medical Specialties</Text>
              <View style={styles.badgeCount}>
                <Text style={styles.badgeCountText}>{ALL_SPECIALTIES.length} Available</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeButton}
              accessibilityLabel="Close specialties modal"
            >
              <X size={18} color={Palette.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <SearchIcon size={16} color={StitchColors.outline} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by specialty, condition (e.g. Heart, Skin)..."
              placeholderTextColor={Palette.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={14} color={Palette.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Specialties List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.gridContainer}>
              {filteredSpecialties.map((spec) => {
                const Icon = spec.icon;
                return (
                  <TouchableOpacity
                    key={spec.id}
                    onPress={() => handleSelectSpecialty(spec)}
                    activeOpacity={0.82}
                    style={styles.specialtyCard}
                  >
                    <View style={[styles.iconWrap, { backgroundColor: spec.lightBg }]}>
                      <Icon size={22} color={spec.color} strokeWidth={2.2} />
                    </View>
                    <View style={styles.textWrap}>
                      <Text style={styles.specName} numberOfLines={1}>
                        {spec.name}
                      </Text>
                      <Text style={styles.specDesc} numberOfLines={2}>
                        {spec.desc}
                      </Text>
                    </View>
                    <ChevronRight size={14} color={StitchColors.outline} />
                  </TouchableOpacity>
                );
              })}

              {filteredSpecialties.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>No Specialties Matching "{searchQuery}"</Text>
                  <Text style={styles.emptySubtitle}>Try searching with broader terms like Fever, Eye, Bones, or Child.</Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(13, 23, 45, 0.6)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: Palette.card,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    ...Shadows.modal,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.textPrimary,
    letterSpacing: -0.3,
  },
  badgeCount: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  badgeCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: StitchColors.primaryContainer,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.background,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    gap: 8,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Palette.textPrimary,
    padding: 0,
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },
  gridContainer: {
    gap: 8,
  },
  specialtyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.background,
    padding: 12,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  specName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  specDesc: {
    fontSize: 11,
    color: Palette.textSecondary,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Palette.textMuted,
    textAlign: 'center',
    maxWidth: 260,
  },
});
