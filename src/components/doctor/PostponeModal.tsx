import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TextInput, StyleSheet } from 'react-native';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Palette, BorderRadius } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Clock3 } from 'lucide-react-native';

const POSTPONE_PRESETS = [
  { label: '+15m', minutes: 15 },
  { label: '+30m', minutes: 30 },
  { label: '+45m', minutes: 45 },
  { label: '+1h', minutes: 60 },
];

const REASON_PRESETS = [
  'OPD running behind schedule',
  'Attending emergency clinical case',
  'Inpatient hospital rounds extension',
  'Emergency surgical review',
];

function addMinutesToTimeString(timeStr: string, minutesToAdd: number): string {
  try {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return timeStr;
    let hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const meridian = (match[3] || 'AM').toUpperCase();

    if (meridian === 'PM' && hours < 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;

    const totalMins = hours * 60 + mins + minutesToAdd;
    let newHours = Math.floor(totalMins / 60) % 24;
    const newMins = totalMins % 60;
    const newMeridian = newHours >= 12 ? 'PM' : 'AM';
    if (newHours > 12) newHours -= 12;
    if (newHours === 0) newHours = 12;

    const formattedMins = newMins < 10 ? `0${newMins}` : `${newMins}`;
    return `${newHours}:${formattedMins} ${newMeridian}`;
  } catch {
    return timeStr;
  }
}

interface PostponeModalProps {
  visible: boolean;
  onClose: () => void;
  selectedApt: any;
  onSuccess: () => void;
}

export function PostponeModal({ visible, onClose, selectedApt, onSuccess }: PostponeModalProps) {
  const { colors } = useAppTheme();
  const styles = useStyles(colors);
  const { user } = useAuthStore();

  const [selectedMinutes, setSelectedMinutes] = useState<number>(30);
  const [selectedReason, setSelectedReason] = useState<string>(REASON_PRESETS[0]);
  const [customReason, setCustomReason] = useState<string>('');

  useEffect(() => {
    if (visible) {
      setSelectedMinutes(30);
      setSelectedReason(REASON_PRESETS[0]);
      setCustomReason('');
    }
  }, [visible]);

  const handleConfirmPostpone = () => {
    if (!selectedApt) return;

    const oldTime = selectedApt.time || '10:30 AM';
    const newTime = addMinutesToTimeString(oldTime, selectedMinutes);
    const finalReason = customReason.trim() || selectedReason;

    const aptStore = useAppointmentStore.getState();
    const existing = aptStore.appointments.find((a) => a.id === selectedApt.id) || selectedApt;
    const updatedApt = {
      ...existing,
      time: newTime,
      notes: finalReason ? `[Postponed: ${finalReason}] ${existing.notes || ''}` : existing.notes,
    };
    aptStore.addAppointment(updatedApt);

    useNotificationStore.getState().addNotification({
      recipientId: selectedApt.patientId || 'pat_1',
      recipientRole: 'patient',
      title: 'Appointment Rescheduled by Doctor',
      message: `${user?.name || selectedApt.doctorName || 'Your doctor'} has rescheduled your appointment to ${newTime}. Reason: ${finalReason}.`,
      type: 'appointment',
      link: `/(patient)/appointments/${selectedApt.id}`,
    });

    onSuccess();
  };

  if (!selectedApt) return null;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Postpone Patient Appointment"
    >
      <View style={styles.modalBody}>
        <View style={styles.modalPatientHeader}>
          <Avatar uri={selectedApt.patientAvatar} name={selectedApt.patientName} size="md" />
          <View style={styles.modalPatientDetails}>
            <Text style={styles.modalPatientName}>{selectedApt.patientName}</Text>
            <Text style={styles.modalPatientSub}>
              Current Schedule: {selectedApt.date} at {selectedApt.time}
            </Text>
          </View>
        </View>

        <View style={styles.delayPickerSection}>
          <Text style={styles.pickerSectionLabel}>Add Delay to Schedule</Text>
          <View style={styles.presetsRow}>
            {POSTPONE_PRESETS.map((p) => {
              const isSelected = selectedMinutes === p.minutes;
              return (
                <Pressable
                  key={p.minutes}
                  onPress={() => setSelectedMinutes(p.minutes)}
                  style={[
                    styles.presetChip,
                    isSelected ? styles.presetChipActive : styles.presetChipInactive,
                  ]}
                  accessibilityRole="button"
                >
                  <Text
                    style={[
                      styles.presetChipText,
                      isSelected ? styles.presetTextActive : styles.presetTextInactive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.projectedSlotCard}>
          <View>
            <Text style={styles.projectedSlotLabel}>New Projected Slot</Text>
            <Text style={styles.projectedSlotTime}>
              {addMinutesToTimeString(selectedApt.time || '10:30 AM', selectedMinutes)}
            </Text>
          </View>
          <Badge label={`+${selectedMinutes} MINS`} variant="blue" size="sm" />
        </View>

        <View style={styles.reasonsSection}>
          <Text style={styles.pickerSectionLabel}>Clinical Reason for Delay</Text>
          <View style={styles.reasonsList}>
            {REASON_PRESETS.map((reason) => {
              const isSelected = selectedReason === reason && !customReason;
              return (
                <Pressable
                  key={reason}
                  onPress={() => {
                    setSelectedReason(reason);
                    setCustomReason('');
                  }}
                  style={[
                    styles.reasonOption,
                    isSelected ? styles.reasonOptionActive : styles.reasonOptionInactive,
                  ]}
                  accessibilityRole="button"
                >
                  <View
                    style={[
                      styles.radioDot,
                      isSelected ? styles.radioDotActive : styles.radioDotInactive,
                    ]}
                  />
                  <Text
                    style={[
                      styles.reasonOptionText,
                      isSelected ? styles.reasonTextActive : styles.reasonTextInactive,
                    ]}
                  >
                    {reason}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            placeholder="Or type custom reason..."
            placeholderTextColor={colors.textMuted}
            value={customReason}
            onChangeText={setCustomReason}
            style={styles.customReasonInput}
          />
        </View>

        <Pressable
          onPress={handleConfirmPostpone}
          style={({ pressed }) => [
            styles.confirmDelayBtn,
            pressed && styles.btnPressed,
          ]}
          accessibilityRole="button"
        >
          <Clock3 size={16} color={Palette.white} />
          <Text style={styles.confirmDelayBtnText}>Confirm Delay & Alert Patient</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  modalBody: {
    paddingVertical: 10,
    gap: 20,
  },
  modalPatientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalPatientDetails: {
    flex: 1,
  },
  modalPatientName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  modalPatientSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  delayPickerSection: {
    gap: 10,
  },
  pickerSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  presetChipActive: {
    backgroundColor: Palette.primaryBlueLight,
    borderColor: Palette.primaryBlueBorder,
  },
  presetChipInactive: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  presetChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  presetTextActive: {
    color: Palette.primaryBlue,
  },
  presetTextInactive: {
    color: colors.text,
  },
  projectedSlotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.healthcareTealLight,
    padding: 16,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Palette.healthcareTealBorder,
  },
  projectedSlotLabel: {
    fontSize: 11,
    color: Palette.healthcareTeal,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  projectedSlotTime: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.primaryDark,
    marginTop: 4,
  },
  reasonsSection: {
    gap: 10,
  },
  reasonsList: {
    gap: 8,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 12,
  },
  reasonOptionActive: {
    backgroundColor: colors.card,
    borderColor: Palette.primaryBlue,
  },
  reasonOptionInactive: {
    backgroundColor: colors.background,
    borderColor: colors.border,
  },
  radioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  radioDotActive: {
    borderColor: Palette.primaryBlue,
    backgroundColor: Palette.primaryBlue,
  },
  radioDotInactive: {
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  reasonOptionText: {
    fontSize: 14,
  },
  reasonTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  reasonTextInactive: {
    color: colors.textSecondary,
  },
  customReasonInput: {
    marginTop: 4,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.lg,
    padding: 12,
    color: colors.text,
    fontSize: 14,
  },
  confirmDelayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.warning,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    gap: 8,
    marginTop: 10,
  },
  btnPressed: {
    opacity: 0.8,
  },
  confirmDelayBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.white,
  },
});
