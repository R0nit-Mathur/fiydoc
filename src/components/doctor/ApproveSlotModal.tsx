import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { appointmentService } from '@/services/appointmentService';
import { Palette, BorderRadius } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { CheckCircle2 } from 'lucide-react-native';

interface ApproveSlotModalProps {
  visible: boolean;
  onClose: () => void;
  approvingApt: any;
  onSuccess: () => void;
}

export function ApproveSlotModal({ visible, onClose, approvingApt, onSuccess }: ApproveSlotModalProps) {
  const { colors } = useAppTheme();
  const styles = useStyles(colors);
  const { user } = useAuthStore();

  const handleSaveApproveSlot = async () => {
    if (!approvingApt) return;
    const aptStore = useAppointmentStore.getState();
    aptStore.updateAppointmentStatus(approvingApt.id, 'confirmed');

    try {
      await appointmentService.approveAppointment(approvingApt.id);
    } catch {
      // Offline / fallback to local state
    }

    useNotificationStore.getState().addNotification({
      recipientId: approvingApt.patientId || 'pat_1',
      recipientRole: 'patient',
      title: 'Time Slot Approved!',
      message: `Dr. ${user?.name || approvingApt.doctorName || 'Specialist'} has approved your appointment slot for ${approvingApt.time} on ${approvingApt.date}.`,
      type: 'appointment',
      link: `/(patient)/appointments/${approvingApt.id}`,
    });

    onSuccess();
  };

  if (!approvingApt) return null;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Approve Appointment Time Slot"
    >
      <View style={styles.modalBody}>
        <View style={styles.approveHeaderCard}>
          <Avatar uri={approvingApt.patientAvatar} name={approvingApt.patientName} size="md" />
          <View style={styles.modalPatientDetails}>
            <Text style={styles.modalPatientName}>{approvingApt.patientName}</Text>
            <Text style={styles.modalPatientSub}>
              Requested: {approvingApt.date} at {approvingApt.time}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleSaveApproveSlot}
          style={({ pressed }) => [
            styles.confirmApproveBtn,
            pressed && styles.btnPressed,
          ]}
          accessibilityRole="button"
        >
          <CheckCircle2 size={18} color={Palette.white} />
          <Text style={styles.confirmApproveBtnText}>Save & Approve Time Slot</Text>
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
  approveHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Palette.primaryBlueLight,
    padding: 16,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Palette.primaryBlueBorder,
  },
  modalPatientDetails: {
    flex: 1,
  },
  modalPatientName: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.primaryDark,
  },
  modalPatientSub: {
    fontSize: 13,
    color: Palette.primaryBlue,
    marginTop: 2,
    fontWeight: '500',
  },
  confirmApproveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.healthcareTeal,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    gap: 8,
  },
  btnPressed: {
    opacity: 0.8,
  },
  confirmApproveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.white,
  },
});
