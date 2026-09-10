import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Animated,
  useWindowDimensions,
  Platform,
  BackHandler,
  Pressable,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/useAuthStore';
import { useLocationStore } from '@/store/useLocationStore';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { FiYLogo } from '@/components/ui/FiYLogo';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { Palette, Typography, BorderRadius, Shadows, Spacing } from '@/constants/theme';
import {
  X,
  FileText,
  ShieldCheck,
  PhoneCall,
  MapPin,
  RefreshCw,
  LogOut,
  ChevronRight,
  User,
} from 'lucide-react-native';

interface SidebarDrawerProps {
  visible: boolean;
  onClose: () => void;
  onOpenLocationPicker?: () => void;
}

export function SidebarDrawer({ visible, onClose, onOpenLocationPicker }: SidebarDrawerProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const drawerWidth = Math.min(screenWidth * 0.82, 340);
  const { user, logout } = useAuthStore();
  const { city, formattedAddress } = useLocationStore();
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);

  // Animation values: slide from right (drawerWidth -> 0) & backdrop opacity (0 -> 1)
  const slideAnim = useRef(new Animated.Value(drawerWidth)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          bounciness: 4,
          speed: 14,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: drawerWidth,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, drawerWidth]);

  // Handle hardware back button on Android
  useEffect(() => {
    if (!visible) return;
    const onBackPress = () => {
      handleClose();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: drawerWidth,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleConfirmLogout = () => {
    setLogoutConfirmVisible(false);
    handleClose();
    setTimeout(() => {
      logout();
      router.replace('/(auth)/login');
    }, 250);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Animated Dimming Backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5],
                }),
              },
            ]}
          />
        </Pressable>

        {/* Animated Right Drawer Content */}
        <Animated.View
          style={[
            styles.drawer,
            {
              width: drawerWidth,
              paddingTop: Math.max(insets.top, 20),
              paddingBottom: Math.max(insets.bottom, 20),
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Drawer Top Header with close button on right */}
          <View style={styles.topHeader}>
            <FiYLogo size="md" />
            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.7}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color={Palette.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* User Profile Card */}
          <View style={styles.userCard}>
            <Avatar uri={user?.avatar} name={user?.name || 'Patient'} size="lg" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.userName} numberOfLines={1}>
                {user?.name || (user?.role === 'doctor' ? 'Dr. Specialist' : 'Verified Patient')}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user?.email || (user?.role === 'doctor' ? 'doctor@fiydoc.app' : 'patient@fiydoc.app')}
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

          {/* Drawer Navigation List */}
          <ScrollView
            contentContainerStyle={styles.menuList}
            showsVerticalScrollIndicator={false}
          >
            {/* Locality Selector */}
            <TouchableOpacity
              onPress={() => {
                handleClose();
                onOpenLocationPicker?.();
              }}
              style={styles.menuItem}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: Palette.healthcareTealLight }]}>
                <MapPin size={18} color={Palette.healthcareTeal} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.menuLabel}>Current Locality</Text>
                <Text style={styles.menuSub} numberOfLines={1}>
                  {city ? `${city} • ` : ''}{formattedAddress || 'Set location'}
                </Text>
              </View>
              <ChevronRight size={16} color={Palette.textMuted} />
            </TouchableOpacity>

            {/* Prescriptions & Records */}
            <TouchableOpacity
              onPress={() => {
                handleClose();
                if (user?.role === 'doctor') {
                  router.push('/(doctor)/(tabs)/appointments');
                } else {
                  router.push('/(patient)/(tabs)/health');
                }
              }}
              style={styles.menuItem}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: Palette.primaryBlueLight }]}>
                <FileText size={18} color={Palette.primaryBlue} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.menuLabel}>Prescriptions & Records</Text>
                <Text style={styles.menuSub}>Digital Rx & clinical history</Text>
              </View>
              <ChevronRight size={16} color={Palette.textMuted} />
            </TouchableOpacity>

            {/* Account Profile */}
            <TouchableOpacity
              onPress={() => {
                handleClose();
                if (user?.role === 'doctor') {
                  router.push('/(doctor)/(tabs)/profile');
                } else {
                  router.push('/(patient)/(tabs)/profile');
                }
              }}
              style={styles.menuItem}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: '#F1F5F9' }]}>
                <User size={18} color={Palette.textSecondary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.menuLabel}>Personal Profile</Text>
                <Text style={styles.menuSub}>Account details & settings</Text>
              </View>
              <ChevronRight size={16} color={Palette.textMuted} />
            </TouchableOpacity>

            {/* Medical Emergency Helpline */}
            <TouchableOpacity
              onPress={() => {
                handleClose();
                Alert.alert(
                  'Emergency Helpline',
                  'Which service would you like to call?',
                  [
                    { text: 'Ambulance (108)', onPress: () => Linking.openURL('tel:108') },
                    { text: 'National Emergency (112)', onPress: () => Linking.openURL('tel:112') },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
              }}
              style={styles.menuItem}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconBox, { backgroundColor: Palette.dangerBg }]}>
                <PhoneCall size={18} color={Palette.danger} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.menuLabel}>Emergency Helpline</Text>
                <Text style={styles.menuSub}>Ambulance 108 • National 112</Text>
              </View>
              <ChevronRight size={16} color={Palette.textMuted} />
            </TouchableOpacity>
          </ScrollView>

          {/* Drawer Bottom Bar with Sign Out */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              onPress={() => setLogoutConfirmVisible(true)}
              style={styles.logoutBtn}
              activeOpacity={0.85}
            >
              <LogOut size={18} color={Palette.danger} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      {/* Confirmation Dialog on Sign Out */}
      <ConfirmationDialog
        visible={logoutConfirmVisible}
        title="Sign Out?"
        message="Are you sure you want to sign out of your FiYDoc account on this device?"
        confirmText="Sign Out"
        cancelText="Stay Signed In"
        confirmVariant="danger"
        iconVariant="warning"
        onConfirm={handleConfirmLogout}
        onCancel={() => setLogoutConfirmVisible(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end', // Aligns drawer to the RIGHT side of the screen
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0D172D',
  },
  drawer: {
    backgroundColor: Palette.card,
    height: '100%',
    flexDirection: 'column',
    ...Shadows.modal,
    borderLeftWidth: 1,
    borderLeftColor: Palette.cardBorderLight,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Palette.cardBorderLight,
  },
  closeBtn: {
    padding: Spacing.xs + 2,
    borderRadius: BorderRadius.md,
    backgroundColor: Palette.background,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Palette.cardBorderLight,
    backgroundColor: Palette.background,
  },
  userName: {
    ...Typography.h3,
    color: Palette.textPrimary,
  },
  userEmail: {
    ...Typography.caption,
    marginTop: 2,
  },
  menuList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.xs + 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.xl,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  menuLabel: {
    ...Typography.bodyMedium,
  },
  menuSub: {
    ...Typography.caption,
    marginTop: 1,
  },
  bottomBar: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Palette.cardBorderLight,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    backgroundColor: Palette.dangerBg,
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
    color: Palette.danger,
  },
});
