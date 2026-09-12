/**
 * FiYDOC Clinical Drawing Canvas & Digital Notepad (MS Paint Style)
 *
 * Allows clinicians to sketch anatomical illustrations, annotate findings,
 * write handwritten clinical shorthand, and save to consultation records.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Platform,
  Dimensions,
  TextInput,
  ScrollView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import {
  Edit2,
  Eraser,
  Undo2,
  Trash2,
  Save,
  X,
  Palette,
  Check,
  FileText,
  Sparkles,
} from 'lucide-react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { BorderRadius, Shadows, StitchColors } from '@/constants/theme';

interface PathData {
  d: string;
  color: string;
  width: number;
}

interface ClinicalDrawingNotepadProps {
  visible: boolean;
  onClose: () => void;
  patientName: string;
  onSaveNotes: (notes: string, hasDrawing: boolean) => void;
  initialNotes?: string;
}

const PALETTE_COLORS = [
  { name: 'Navy', hex: '#00397E' },
  { name: 'Charcoal', hex: '#0F172A' },
  { name: 'Inflammation Red', hex: '#DC2626' },
  { name: 'Teal', hex: '#006B5F' },
  { name: 'Amber', hex: '#D97706' },
  { name: 'Purple', hex: '#7C3AED' },
];

const STROKE_WIDTHS = [
  { label: 'Fine', width: 2.5 },
  { label: 'Medium', width: 5 },
  { label: 'Thick', width: 9 },
];

export default function ClinicalDrawingNotepad({
  visible,
  onClose,
  patientName,
  onSaveNotes,
  initialNotes = '',
}: ClinicalDrawingNotepadProps) {
  const { colors, isDark } = useAppTheme();

  // Drawing state
  const [paths, setPaths] = useState<PathData[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [activeTool, setActiveTool] = useState<'pencil' | 'eraser'>('pencil');
  const [strokeColor, setStrokeColor] = useState<string>('#00397E');
  const [strokeWidth, setStrokeWidth] = useState<number>(3.5);
  const [typedNotes, setTypedNotes] = useState<string>(initialNotes);
  const [activeTab, setActiveTab] = useState<'draw' | 'notes'>('draw');
  const [saveBanner, setSaveBanner] = useState(false);

  const canvasRef = useRef<View>(null);

  const handleTouchStart = (evt: any) => {
    const { locationX, locationY } = evt.nativeEvent;
    const startD = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
    setCurrentPath(startD);
  };

  const handleTouchMove = (evt: any) => {
    const { locationX, locationY } = evt.nativeEvent;
    if (!currentPath) return;

    if (activeTool === 'pencil') {
      setCurrentPath((prev) => `${prev} L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`);
    } else {
      // Eraser: remove any saved path that has a coordinate within 20px of touch
      const ERASE_RADIUS = 20;
      setPaths((prevPaths) =>
        prevPaths.filter((p) => {
          // Parse all coordinate pairs from the SVG path string
          const coords = p.d.match(/[\d.]+\s[\d.]+/g) || [];
          return !coords.some((pair) => {
            const [px, py] = pair.split(' ').map(Number);
            return Math.abs(px - locationX) < ERASE_RADIUS && Math.abs(py - locationY) < ERASE_RADIUS;
          });
        })
      );
    }
  };

  const handleTouchEnd = () => {
    if (currentPath && activeTool === 'pencil') {
      setPaths((prev) => [
        ...prev,
        { d: currentPath, color: strokeColor, width: strokeWidth },
      ]);
    }
    setCurrentPath('');
  };

  const handleUndo = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPaths((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    setPaths([]);
    setCurrentPath('');
  };

  const handleSave = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onSaveNotes(typedNotes, paths.length > 0);
    setSaveBanner(true);
    setTimeout(() => {
      setSaveBanner(false);
      onClose();
    }, 900);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : 'pageSheet'}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Top Header */}
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.headerLeft}>
            <View style={styles.titleIconBox}>
              <Edit2 size={18} color={StitchColors.primaryContainer} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Clinical Sketchpad & Notepad</Text>
              <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
                Patient: {patientName} • Freehand MS Paint Style
              </Text>
            </View>
          </View>

          <Pressable
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.closeBtn, { backgroundColor: colors.backgroundElement }]}
          >
            <X size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* View Mode Switcher (Draw vs Typed Notes) */}
        <View style={[styles.tabBar, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
          <Pressable
            onPress={() => setActiveTab('draw')}
            style={[
              styles.tabBtn,
              activeTab === 'draw' && [styles.activeTabBtn, { backgroundColor: StitchColors.primaryContainer }],
            ]}
          >
            <Edit2 size={16} color={activeTab === 'draw' ? '#FFFFFF' : colors.textSecondary} />
            <Text style={[styles.tabBtnText, { color: activeTab === 'draw' ? '#FFFFFF' : colors.textSecondary }]}>
              Drawing Canvas {paths.length > 0 ? `(${paths.length})` : ''}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('notes')}
            style={[
              styles.tabBtn,
              activeTab === 'notes' && [styles.activeTabBtn, { backgroundColor: StitchColors.primaryContainer }],
            ]}
          >
            <FileText size={16} color={activeTab === 'notes' ? '#FFFFFF' : colors.textSecondary} />
            <Text style={[styles.tabBtnText, { color: activeTab === 'notes' ? '#FFFFFF' : colors.textSecondary }]}>
              Clinical Shorthand Notes
            </Text>
          </Pressable>
        </View>

        {activeTab === 'draw' ? (
          <View style={styles.canvasContainer}>
            {/* Toolbar */}
            <View style={[styles.toolbar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              {/* Tool selector */}
              <View style={styles.toolGroup}>
                <Pressable
                  onPress={() => {
                    setActiveTool('pencil');
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                  }}
                  style={[
                    styles.toolBtn,
                    activeTool === 'pencil' && [styles.activeToolBtn, { backgroundColor: '#DBEAFE', borderColor: StitchColors.primaryContainer }],
                  ]}
                >
                  <Edit2 size={18} color={activeTool === 'pencil' ? StitchColors.primaryContainer : colors.textSecondary} />
                </Pressable>

                <Pressable
                  onPress={() => {
                    setActiveTool('eraser');
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                  }}
                  style={[
                    styles.toolBtn,
                    activeTool === 'eraser' && [styles.activeToolBtn, { backgroundColor: '#FEE2E2', borderColor: '#DC2626' }],
                  ]}
                >
                  <Eraser size={18} color={activeTool === 'eraser' ? '#DC2626' : colors.textSecondary} />
                </Pressable>
              </View>

              {/* Color Swatches */}
              <View style={styles.colorRow}>
                {PALETTE_COLORS.map((c) => (
                  <Pressable
                    key={c.hex}
                    onPress={() => {
                      setStrokeColor(c.hex);
                      setActiveTool('pencil');
                    }}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c.hex },
                      strokeColor === c.hex && activeTool === 'pencil' && styles.activeColorDot,
                    ]}
                  />
                ))}
              </View>

              {/* Stroke width selector */}
              <View style={styles.strokeWidthGroup}>
                {STROKE_WIDTHS.map((s) => (
                  <Pressable
                    key={s.label}
                    onPress={() => setStrokeWidth(s.width)}
                    style={[
                      styles.strokeWidthBtn,
                      strokeWidth === s.width && { backgroundColor: StitchColors.primaryContainer },
                    ]}
                  >
                    <View
                      style={[
                        styles.strokeSampleDot,
                        {
                          width: s.width + 2,
                          height: s.width + 2,
                          backgroundColor: strokeWidth === s.width ? '#FFFFFF' : colors.text,
                        },
                      ]}
                    />
                  </Pressable>
                ))}
              </View>

              {/* Action buttons (Undo, Clear) */}
              <View style={styles.actionGroup}>
                <Pressable
                  onPress={handleUndo}
                  disabled={paths.length === 0}
                  style={[styles.toolBtn, { opacity: paths.length > 0 ? 1 : 0.4 }]}
                >
                  <Undo2 size={18} color={colors.text} />
                </Pressable>

                <Pressable
                  onPress={handleClear}
                  disabled={paths.length === 0}
                  style={[styles.toolBtn, { opacity: paths.length > 0 ? 1 : 0.4 }]}
                >
                  <Trash2 size={18} color="#DC2626" />
                </Pressable>
              </View>
            </View>

            {/* Drawing Surface with Grid Background */}
            <View
              ref={canvasRef}
              style={[styles.drawingSurface, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onStartShouldSetResponderCapture={() => true}
              onMoveShouldSetResponderCapture={() => true}
              onResponderGrant={handleTouchStart}
              onResponderMove={handleTouchMove}
              onResponderRelease={handleTouchEnd}
            >
              <Svg style={StyleSheet.absoluteFill}>
                {paths.map((p, idx) => (
                  <Path
                    key={idx}
                    d={p.d}
                    stroke={p.color}
                    strokeWidth={p.width}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                ))}
                {currentPath ? (
                  <Path
                    d={currentPath}
                    stroke={activeTool === 'eraser' ? '#F87171' : strokeColor}
                    strokeWidth={activeTool === 'eraser' ? 18 : strokeWidth}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                ) : null}
              </Svg>

              {paths.length === 0 && !currentPath && (
                <View style={styles.canvasEmptyHint} pointerEvents="none">
                  <Edit2 size={32} color={colors.textMuted} />
                  <Text style={[styles.canvasEmptyTitle, { color: colors.textSecondary }]}>
                    Freehand Clinical Drawing
                  </Text>
                  <Text style={[styles.canvasEmptyDesc, { color: colors.textMuted }]}>
                    Sketch anatomical diagrams, lesion outlines, or clinical shorthand with your finger or stylus.
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          /* Typed Clinical Shorthand Notepad */
          <ScrollView contentContainerStyle={styles.notesContainer}>
            <View style={[styles.notesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.notesLabel, { color: colors.textSecondary }]}>
                DOCTOR'S SCRATCHPAD / CLINICAL IMPRESSION
              </Text>
              <TextInput
                value={typedNotes}
                onChangeText={setTypedNotes}
                placeholder="Type rapid clinical observations, patient dialogue, tentative differential diagnosis, or notes for this visit..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={10}
                style={[styles.notesTextArea, { color: colors.text, borderColor: colors.border }]}
              />

              {/* Quick Shorthand Snippet Chips */}
              <View style={styles.snippetRow}>
                <Text style={[styles.snippetHeading, { color: colors.textSecondary }]}>Quick Inserts:</Text>
                {[
                  'Bilateral lungs clear, no wheeze',
                  'S1, S2 audible, no murmurs',
                  'Abdomen soft, non-tender',
                  'Throat mild erythema, no pus',
                  'BP under good control',
                  'Follow up in 5 days',
                ].map((snippet) => (
                  <Pressable
                    key={snippet}
                    onPress={() => setTypedNotes((prev) => (prev ? `${prev}\n• ${snippet}` : `• ${snippet}`))}
                    style={[styles.snippetChip, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
                  >
                    <Text style={[styles.snippetChipText, { color: StitchColors.primaryContainer }]}>
                      + {snippet}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>
        )}

        {/* Bottom Save Bar */}
        <View style={[styles.bottomBar, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
          {saveBanner ? (
            <View style={styles.savedNotice}>
              <Check size={18} color="#059669" />
              <Text style={styles.savedNoticeText}>Clinical note & sketches saved to consultation record!</Text>
            </View>
          ) : (
            <View style={styles.bottomButtonsRow}>
              <Pressable
                onPress={onClose}
                style={[styles.cancelBtn, { backgroundColor: colors.backgroundElement }]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Close</Text>
              </Pressable>

              <Pressable
                onPress={handleSave}
                style={[styles.saveBtn, { backgroundColor: StitchColors.primaryContainer }]}
              >
                <Save size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Save to Consultation</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  titleIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 12,
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    gap: 6,
  },
  activeTabBtn: {
    ...Shadows.subtle,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  canvasContainer: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexWrap: 'wrap',
    gap: 8,
  },
  toolGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  toolBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeToolBtn: {
    borderWidth: 1.5,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.full,
  },
  activeColorDot: {
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    ...Shadows.subtle,
  },
  strokeWidthGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  strokeWidthBtn: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  strokeSampleDot: {
    borderRadius: BorderRadius.full,
  },
  actionGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  drawingSurface: {
    flex: 1,
    position: 'relative',
  },
  canvasEmptyHint: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    opacity: 0.65,
  },
  canvasEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  canvasEmptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
    lineHeight: 18,
  },
  notesContainer: {
    padding: 16,
  },
  notesCard: {
    borderRadius: BorderRadius.xl,
    padding: 16,
    borderWidth: 1,
  },
  notesLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  notesTextArea: {
    fontSize: 14,
    lineHeight: 22,
    minHeight: 140,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: 12,
    textAlignVertical: 'top',
  },
  snippetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
    alignItems: 'center',
  },
  snippetHeading: {
    fontSize: 12,
    fontWeight: '600',
    width: '100%',
    marginBottom: 2,
  },
  snippetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  snippetChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
    gap: 8,
    ...Shadows.subtle,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  savedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: BorderRadius.xl,
  },
  savedNoticeText: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '600',
  },
});
