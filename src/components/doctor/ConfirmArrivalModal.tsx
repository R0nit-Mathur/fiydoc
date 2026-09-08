import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ConfirmationAnimation } from '@/components/ui/ConfirmationAnimation';
import { Palette, BorderRadius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface ConfirmArrivalModalProps {
  visible: boolean;
  onClose: () => void;
  confirmedApt: any;
}

export function ConfirmArrivalModal({ visible, onClose, confirmedApt }: ConfirmArrivalModalProps) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useStyles(colors);

  if (!confirmedApt) return null;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Patient Arrival Confirmed"
    >
      <View style={styles.confirmModalContent}>
        <ConfirmationAnimation
          title="Patient Arrival Confirmed!"
          subtitle={`Patient ${confirmedApt.patientName} has been checked into the OPD priority queue.`}
          color={Palette.success}
          size={68}
        />

        <View style={styles.queueDetailsCard}>
          <View style={styles.queueRow}>
            <Text style={styles.queueLabel}>Queue Status</Text>
            <Badge label="IN-CLINIC READY" variant="teal" size="sm" />
          </View>
          <View style={styles.queueRow}>
            <Text style={styles.queueLabel}>Scheduled Slot</Text>
            <Text style={styles.queueValue}>{confirmedApt.date} at {confirmedApt.time}</Text>
          </View>
          <View style={styles.queueRow}>
            <Text style={styles.queueLabel}>Symptoms</Text>
            <Text style={styles.queueValue} numberOfLines={1}>
              {confirmedApt.symptoms?.join(', ') || 'General OPD Evaluation'}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
            onClose();
            router.push(`/(doctor)/consultation/${confirmedApt.id}`);
          }}
          style={({ pressed }) => [
            styles.openRoomBtn,
            pressed && styles.btnPressed,
          ]}
          accessibilityRole="button"
        >
          <Text style={styles.openRoomBtnText}>Open Consultation Room</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  confirmModalContent: {
    paddingVertical: 10,
    gap: 20,
    alignItems: 'center',
  },
  queueDetailsCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: BorderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  queueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  queueLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  queueValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
    marginLeft: 20,
  },
  openRoomBtn: {
    width: '100%',
    backgroundColor: Palette.primaryDark,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  btnPressed: {
    opacity: 0.8,
  },
  openRoomBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.white,
  },
});
