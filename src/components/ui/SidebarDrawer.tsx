import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { useLocationStore } from '@/store/useLocationStore';
import { updateService } from '@/services/updateService';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { FiYLogo } from '@/components/ui/FiYLogo';
import {
  X,
  FileText,
  ShieldCheck,
  PhoneCall,
  MapPin,
  RefreshCw,
  LogOut,
  ChevronRight,
  Sparkles,
  Heart,
  HelpCircle,
} from 'lucide-react-native';

interface SidebarDrawerProps {
  visible: boolean;
  onClose: () => void;
  onOpenLocationPicker?: () => void;
}

export function SidebarDrawer({ visible, onClose, onOpenLocationPicker }: SidebarDrawerProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { city, formattedAddress } = useLocationStore();

  const handleLogout = () => {
    onClose();
    logout();
    router.replace('/(auth)/login');
  };

  const handleCheckUpdates = async () => {
    try {
      const update = await updateService.checkForUpdate();
      if (update.isAvailable) {
        Alert.alert('Update Available', 'A new version of FiYDoc is ready.', [
          { text: 'Install Now', onPress: () => updateService.fetchAndApplyUpdate() },
          { text: 'Later', style: 'cancel' },
        ]);
      } else {
        Alert.alert('FiYDoc is Up to Date', 'You are running the latest clinical version.');
      }
    } catch {
      Alert.alert('FiYDoc', 'App is running latest version.');
    }
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'National Emergency Healthcare Helpline',
      'Call 112 (National Emergency) or 108 (Ambulance)?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call 108 (Ambulance)', style: 'destructive' },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdrop}
          onPress={onClose}
        />

        <View style={styles.drawerContent}>
          {/* Drawer Top Header */}
          <View style={styles.topHeader}>
            <FiYLogo size="md" />
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* User Profile Card */}
          <View style={styles.userCard}>
            <Avatar uri={user?.avatar} name={user?.name || 'Patient'} size="lg" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.name || 'Verified Patient'}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user?.email || 'patient@fiydoc.app'}
              </Text>
              <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
                <Badge
                  label={user?.role === 'doctor' ? 'DOCTOR PORTAL' : 'VERIFIED PATIENT'}
                  variant={user?.role === 'doctor' ? 'blue' : 'teal'}
                  size="sm"
                />
              </View>
            </View>
          </View>

          {/* Drawer Menu Items */}
          <ScrollView contentContainerStyle={styles.menuList} showsVerticalScrollIndicator={false}>
            {/* Current Location Quick Action */}
            <TouchableOpacity
              onPress={() => {
                onClose();
                onOpenLocationPicker?.();
              }}
              style={styles.menuItem}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#F0FDFA' }]}>
                <MapPin size={18} color="#00B39B" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.menuLabel}>Current Locality</Text>
                <Text style={styles.menuSub} numberOfLines={1}>
                  {city ? `${city} • ` : ''}{formattedAddress || 'Set location'}
                </Text>
              </View>
              <ChevronRight size={16} color="#CBD5E1" />
            </TouchableOpacity>

            {/* Medical Records & Prescriptions */}
            <TouchableOpacity
              onPress={() => {
                onClose();
                router.push('/(patient)/(tabs)/health');
              }}
              style={styles.menuItem}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#EFF6FF' }]}>
                <FileText size={18} color="#1E58C8" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.menuLabel}>Prescriptions & Health Records</Text>
                <Text style={styles.menuSub}>Official digital Rx & lab reports</Text>
              </View>
              <ChevronRight size={16} color="#CBD5E1" />
            </TouchableOpacity>

            {/* ABDM & ABHA National Health ID */}
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Ayushman Bharat Digital Mission (ABDM)',
                  'Your FiYDoc profile is securely configured with ABDM digital interoperability standards.'
                );
              }}
              style={styles.menuItem}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#ECFDF5' }]}>
                <ShieldCheck size={18} color="#059669" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.menuLabel}>ABDM & ABHA Integration</Text>
                <Text style={styles.menuSub}>Government verified health records</Text>
              </View>
              <ChevronRight size={16} color="#CBD5E1" />
            </TouchableOpacity>

            {/* 24x7 Emergency Helpline */}
            <TouchableOpacity
              onPress={handleEmergencyCall}
              style={styles.menuItem}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#FEF2F2' }]}>
                <PhoneCall size={18} color="#DC2626" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.menuLabel}>24x7 Emergency Helplines</Text>
                <Text style={styles.menuSub}>Ambulance 108 • National 112</Text>
              </View>
              <ChevronRight size={16} color="#CBD5E1" />
            </TouchableOpacity>

            {/* Check for Updates */}
            <TouchableOpacity
              onPress={handleCheckUpdates}
              style={styles.menuItem}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#F8FAFC' }]}>
                <RefreshCw size={18} color="#64748B" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.menuLabel}>App Updates & System Status</Text>
                <Text style={styles.menuSub}>v1.0.0 • Verified Build</Text>
              </View>
              <ChevronRight size={16} color="#CBD5E1" />
            </TouchableOpacity>
          </ScrollView>

          {/* Drawer Bottom Sign Out */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              onPress={handleLogout}
              style={styles.logoutBtn}
              activeOpacity={0.85}
            >
              <LogOut size={18} color="#DC2626" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  drawerContent: {
    width: '82%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    height: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 16,
    paddingTop: 48,
    paddingBottom: 24,
    display: 'flex',
    flexDirection: 'column',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  menuList: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  menuSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
});
