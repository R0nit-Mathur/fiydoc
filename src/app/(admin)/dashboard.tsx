import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
  Linking,
  Platform,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  ShieldCheck,
  Users,
  UserCheck,
  Clock,
  Calendar,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  ExternalLink,
  LogOut,
  RefreshCw,
  Eye,
  Filter,
  X,
  Building2,
  Award,
  ChevronRight,
} from 'lucide-react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { StitchColors, BorderRadius, Shadows } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { adminService, AdminStats, AdminDoctorItem, AuditLogItem } from '@/services/adminService';
import { authService } from '@/services/authService';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { LoadingDialog } from '@/components/ui/LoadingDialog';

type TabKey = 'verifications' | 'all-doctors' | 'audit-logs';

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabKey>('verifications');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Doctors & Verifications Queue
  const [doctors, setDoctors] = useState<AdminDoctorItem[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Review Action Modal
  const [selectedDoctor, setSelectedDoctor] = useState<AdminDoctorItem | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'SUSPEND' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Logout Modal
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const data = await adminService.getStats();
      setStats(data);
    } catch (e: any) {
      console.warn('[Admin] Failed to load stats:', e?.message);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchDoctors = useCallback(async () => {
    try {
      setLoadingDoctors(true);
      const statusParam = activeTab === 'verifications'
        ? 'PENDING'
        : statusFilter !== 'ALL'
        ? statusFilter
        : undefined;

      const data = await adminService.getDoctors({
        status: statusParam,
        search: searchQuery.trim() || undefined,
        limit: 50,
      });
      setDoctors(data.doctors || []);
    } catch (e: any) {
      console.warn('[Admin] Failed to load doctors:', e?.message);
    } finally {
      setLoadingDoctors(false);
    }
  }, [activeTab, statusFilter, searchQuery]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      const data = await adminService.getAuditLogs({ limit: 40 });
      setAuditLogs(data.logs || []);
    } catch (e: any) {
      console.warn('[Admin] Failed to load audit logs:', e?.message);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'audit-logs') {
      fetchAuditLogs();
    } else {
      fetchDoctors();
    }
  }, [activeTab, fetchDoctors, fetchAuditLogs]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchStats(), activeTab === 'audit-logs' ? fetchAuditLogs() : fetchDoctors()]);
    setRefreshing(false);
  };

  const handleReviewAction = async () => {
    if (!selectedDoctor || !actionType) return;

    if ((actionType === 'REJECT' || actionType === 'REQUEST_INFO') && !actionNotes.trim()) {
      Alert.alert('Required', `Please provide a reason/note for ${actionType === 'REJECT' ? 'rejection' : 'requesting info'}.`);
      return;
    }

    try {
      setSubmittingAction(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      await adminService.reviewVerification({
        doctorId: selectedDoctor.id,
        verificationId: selectedDoctor.verificationId,
        action: actionType,
        rejectionReason: actionType === 'REJECT' ? actionNotes.trim() : undefined,
        notes: actionNotes.trim() || undefined,
      });

      Alert.alert('Success', `Doctor status updated to ${actionType}.`);
      setSelectedDoctor(null);
      setActionType(null);
      setActionNotes('');

      // Refresh data
      fetchStats();
      fetchDoctors();
    } catch (err: any) {
      Alert.alert('Action Failed', err.message || 'Could not complete the review action.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleConfirmLogout = async () => {
    try {
      setLoggingOut(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      await authService.signOutAll('USER_ACTION');
      router.replace('/(auth)/welcome');
    } catch (err: any) {
      console.warn('[Admin] Logout error:', err?.message);
      router.replace('/(auth)/welcome');
    } finally {
      setLoggingOut(false);
      setLogoutModalVisible(false);
    }
  };

  const openDocument = (url?: string) => {
    if (!url) {
      Alert.alert('No Document', 'No document file URL available for this doctor.');
      return;
    }
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open document URL.');
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Top Admin Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <View style={styles.shieldWrap}>
            <ShieldCheck size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>FiYDOC Super-Admin</Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>{user?.email || 'admin@fiydoc.app'}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Pressable onPress={handleRefresh} style={[styles.iconBtn, { backgroundColor: colors.backgroundElement }]} hitSlop={8} accessibilityLabel="Refresh Dashboard">
            <RefreshCw size={16} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={() => setLogoutModalVisible(true)}
            style={styles.headerLogoutBtn}
            hitSlop={8}
            accessibilityLabel="Sign Out of Admin Console"
          >
            <LogOut size={15} color="#DC2626" />
            <Text style={styles.headerLogoutText}>Logout</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[StitchColors.primaryContainer]}
            tintColor={StitchColors.primaryContainer}
          />
        }
      >
        {/* System Overview KPI Cards */}
        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.kpiHeader}>
              <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Pending Verification</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Clock size={16} color="#D97706" />
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: '#D97706' }]}>
              {stats ? (stats.pendingDoctors ?? stats.pendingVerifications ?? 0) : '...'}
            </Text>
            <Text style={[styles.kpiSub, { color: colors.textSecondary }]}>requires medical review</Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.kpiHeader}>
              <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Verified Doctors</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: '#DCFCE7' }]}>
                <UserCheck size={16} color="#16A34A" />
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: '#16A34A' }]}>
              {stats ? stats.verifiedDoctors : '...'}
            </Text>
            <Text style={[styles.kpiSub, { color: colors.textSecondary }]}>live on patient search</Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.kpiHeader}>
              <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Total Registered</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: '#DBEAFE' }]}>
                <Users size={16} color="#2563EB" />
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: colors.text }]}>
              {stats ? stats.totalDoctors : '...'}
            </Text>
            <Text style={[styles.kpiSub, { color: colors.textSecondary }]}>doctors in system</Text>
          </View>

          <View style={[styles.kpiCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.kpiHeader}>
              <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Appointments</Text>
              <View style={[styles.kpiIconBox, { backgroundColor: '#F3E8FF' }]}>
                <Calendar size={16} color="#9333EA" />
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: colors.text }]}>
              {stats ? stats.totalAppointments : '...'}
            </Text>
            <Text style={[styles.kpiSub, { color: colors.textSecondary }]}>
              {stats ? `${stats.todayAppointments ?? 0} today` : 'booked total'}
            </Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={[styles.tabBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable
            onPress={() => setActiveTab('verifications')}
            style={[
              styles.tabBtn,
              activeTab === 'verifications' && { backgroundColor: StitchColors.primaryContainer },
            ]}
          >
            <Text style={[styles.tabBtnText, { color: activeTab === 'verifications' ? '#FFFFFF' : colors.textSecondary }]}>
              Verification Queue ({stats ? (stats.pendingDoctors ?? stats.pendingVerifications ?? 0) : 0})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('all-doctors')}
            style={[
              styles.tabBtn,
              activeTab === 'all-doctors' && { backgroundColor: StitchColors.primaryContainer },
            ]}
          >
            <Text style={[styles.tabBtnText, { color: activeTab === 'all-doctors' ? '#FFFFFF' : colors.textSecondary }]}>
              All Doctors ({stats?.totalDoctors || 0})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('audit-logs')}
            style={[
              styles.tabBtn,
              activeTab === 'audit-logs' && { backgroundColor: StitchColors.primaryContainer },
            ]}
          >
            <Text style={[styles.tabBtnText, { color: activeTab === 'audit-logs' ? '#FFFFFF' : colors.textSecondary }]}>
              Audit Trail
            </Text>
          </Pressable>
        </View>

        {/* Search & Filter Bar (for Doctors / Verification Queue) */}
        {activeTab !== 'audit-logs' && (
          <View style={styles.searchSection}>
            <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Search size={16} color={colors.textMuted} />
              <TextInput
                placeholder="Search by doctor name, email, specialty..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={fetchDoctors}
                style={[styles.searchInput, { color: colors.text }]}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <X size={16} color={colors.textMuted} />
                </Pressable>
              )}
            </View>

            {activeTab === 'all-doctors' && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {['ALL', 'VERIFIED', 'PENDING', 'REJECTED', 'INFO_REQUIRED', 'SUSPENDED'].map((st) => (
                  <Pressable
                    key={st}
                    onPress={() => setStatusFilter(st)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: statusFilter === st ? StitchColors.primaryContainer : colors.backgroundElement,
                        borderColor: statusFilter === st ? StitchColors.primaryContainer : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: statusFilter === st ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {st}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Tab Content: Doctors / Verification Queue */}
        {activeTab !== 'audit-logs' && (
          <View style={styles.listSection}>
            {loadingDoctors ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color={StitchColors.primaryContainer} />
                <Text style={[styles.centerText, { color: colors.textSecondary }]}>Loading doctor records...</Text>
              </View>
            ) : doctors.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ShieldCheck size={36} color={StitchColors.primaryContainer} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {activeTab === 'verifications' ? 'No Pending Verifications' : 'No Doctors Found'}
                </Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                  {activeTab === 'verifications'
                    ? 'All registered doctor credentials have been processed. Great job!'
                    : 'Try changing your search keywords or status filter.'}
                </Text>
              </View>
            ) : (
              doctors.map((doc) => {
                const isPending = doc.verificationStatus === 'PENDING';
                const isVerified = doc.verificationStatus === 'VERIFIED';
                const isRejected = doc.verificationStatus === 'REJECTED';
                const isInfoRequired = doc.verificationStatus === 'INFO_REQUIRED';

                return (
                  <View key={doc.id} style={[styles.docCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {/* Header: Name, Specialty & Status Badge */}
                    <View style={styles.docHeader}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.docName, { color: colors.text }]}>{doc.fullName}</Text>
                          {isVerified && <CheckCircle2 size={16} color="#16A34A" />}
                        </View>
                        <Text style={[styles.docSpecialty, { color: StitchColors.primaryContainer }]}>
                          {doc.specialization} • {doc.qualification}
                        </Text>
                        <Text style={[styles.docEmail, { color: colors.textSecondary }]}>
                          {doc.email} {doc.phone ? `• ${doc.phone}` : ''}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          isPending && { backgroundColor: '#FEF3C7' },
                          isVerified && { backgroundColor: '#DCFCE7' },
                          isRejected && { backgroundColor: '#FEE2E2' },
                          isInfoRequired && { backgroundColor: '#DBEAFE' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            isPending && { color: '#B45309' },
                            isVerified && { color: '#15803D' },
                            isRejected && { color: '#B91C1C' },
                            isInfoRequired && { color: '#1D4ED8' },
                          ]}
                        >
                          {doc.verificationStatus}
                        </Text>
                      </View>
                    </View>

                    {/* Verification Details Box */}
                    <View style={[styles.detailsBox, { backgroundColor: colors.backgroundElement }]}>
                      <View style={styles.detailRow}>
                        <Award size={14} color={colors.textSecondary} />
                        <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>License / Reg No:</Text>
                        <Text style={[styles.detailValue, { color: colors.text }]}>
                          {doc.registrationNumber || 'Not submitted'} ({doc.medicalCouncil || 'NMC'})
                        </Text>
                      </View>

                      {doc.clinicName ? (
                        <View style={styles.detailRow}>
                          <Building2 size={14} color={colors.textSecondary} />
                          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Clinic / Hospital:</Text>
                          <Text style={[styles.detailValue, { color: colors.text }]}>
                            {doc.clinicName} {doc.clinicCity ? `(${doc.clinicCity})` : ''}
                          </Text>
                        </View>
                      ) : null}

                      {doc.certificateUrl ? (
                        <View style={styles.detailRow}>
                          <FileText size={14} color={colors.textSecondary} />
                          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Certificate:</Text>
                          <Pressable onPress={() => openDocument(doc.certificateUrl)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <Text style={{ fontSize: 12, color: StitchColors.primaryContainer, fontWeight: '700' }}>
                              View Uploaded File
                            </Text>
                            <ExternalLink size={12} color={StitchColors.primaryContainer} />
                          </Pressable>
                        </View>
                      ) : null}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionsRow}>
                      {isPending ? (
                        <>
                          <Pressable
                            onPress={() => {
                              setSelectedDoctor(doc);
                              setActionType('APPROVE');
                              setActionNotes('');
                            }}
                            style={[styles.actionBtn, { backgroundColor: '#16A34A' }]}
                          >
                            <CheckCircle2 size={14} color="#FFFFFF" />
                            <Text style={styles.actionBtnText}>Approve & Verify</Text>
                          </Pressable>

                          <Pressable
                            onPress={() => {
                              setSelectedDoctor(doc);
                              setActionType('REQUEST_INFO');
                              setActionNotes('');
                            }}
                            style={[styles.actionBtn, { backgroundColor: '#2563EB' }]}
                          >
                            <Text style={styles.actionBtnText}>Request Info</Text>
                          </Pressable>

                          <Pressable
                            onPress={() => {
                              setSelectedDoctor(doc);
                              setActionType('REJECT');
                              setActionNotes('');
                            }}
                            style={[styles.actionBtn, { backgroundColor: '#DC2626' }]}
                          >
                            <XCircle size={14} color="#FFFFFF" />
                            <Text style={styles.actionBtnText}>Reject</Text>
                          </Pressable>
                        </>
                      ) : isVerified ? (
                        <Pressable
                          onPress={() => {
                            setSelectedDoctor(doc);
                            setActionType('SUSPEND');
                            setActionNotes('');
                          }}
                          style={[styles.actionBtn, { backgroundColor: '#DC2626' }]}
                        >
                          <AlertTriangle size={14} color="#FFFFFF" />
                          <Text style={styles.actionBtnText}>Suspend Verification</Text>
                        </Pressable>
                      ) : (
                        <Pressable
                          onPress={() => {
                            setSelectedDoctor(doc);
                            setActionType('APPROVE');
                            setActionNotes('');
                          }}
                          style={[styles.actionBtn, { backgroundColor: '#16A34A' }]}
                        >
                          <CheckCircle2 size={14} color="#FFFFFF" />
                          <Text style={styles.actionBtnText}>Re-Approve</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Tab Content: Audit Trail */}
        {activeTab === 'audit-logs' && (
          <View style={styles.listSection}>
            {loadingLogs ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color={StitchColors.primaryContainer} />
                <Text style={[styles.centerText, { color: colors.textSecondary }]}>Loading audit logs...</Text>
              </View>
            ) : auditLogs.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Audit Entries</Text>
                <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Verification actions will appear here in chronological order.</Text>
              </View>
            ) : (
              auditLogs.map((log) => (
                <View key={log.id} style={[styles.logCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.logHeader}>
                    <Text style={[styles.logAction, { color: StitchColors.primaryContainer }]}>{log.action}</Text>
                    <Text style={[styles.logDate, { color: colors.textSecondary }]}>
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <Text style={[styles.logDetails, { color: colors.text }]}>
                    Entity: {log.entityType} ({log.entityId})
                  </Text>
                  {log.details ? (
                    <Text style={[styles.logJson, { color: colors.textSecondary }]}>
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Action Confirmation Modal */}
      <Modal visible={Boolean(selectedDoctor && actionType)} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {actionType === 'APPROVE' && 'Approve Doctor Verification'}
                  {actionType === 'REJECT' && 'Reject Doctor Application'}
                  {actionType === 'REQUEST_INFO' && 'Request More Information'}
                  {actionType === 'SUSPEND' && 'Suspend Doctor Account'}
                </Text>
                <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                  Doctor: {selectedDoctor?.fullName} ({selectedDoctor?.registrationNumber || 'No license'})
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setSelectedDoctor(null);
                  setActionType(null);
                }}
              >
                <X size={20} color={colors.text} />
              </Pressable>
            </View>

            {(actionType === 'REJECT' || actionType === 'REQUEST_INFO' || actionType === 'SUSPEND') && (
              <View style={{ marginVertical: 14 }}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  {actionType === 'REJECT'
                    ? 'Rejection Reason (will be notified to the doctor):'
                    : actionType === 'REQUEST_INFO'
                    ? 'Required Information / Missing Details:'
                    : 'Suspension Reason:'}
                </Text>
                <TextInput
                  value={actionNotes}
                  onChangeText={setActionNotes}
                  placeholder="e.g. License registration could not be verified on NMC registry. Please upload clear copy."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={3}
                  style={[styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundElement }]}
                />
              </View>
            )}

            {actionType === 'APPROVE' && (
              <View style={[styles.confirmNotice, { backgroundColor: '#DCFCE7' }]}>
                <CheckCircle2 size={18} color="#16A34A" />
                <Text style={{ fontSize: 13, color: '#15803D', flex: 1, lineHeight: 18 }}>
                  Approving will immediately mark this doctor as <Text style={{ fontWeight: '700' }}>VERIFIED</Text>, activating their public profile on patient searches, booking slots, and OPD directories.
                </Text>
              </View>
            )}

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setSelectedDoctor(null);
                  setActionType(null);
                }}
                style={[styles.cancelBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleReviewAction}
                disabled={submittingAction}
                style={[
                  styles.confirmBtn,
                  {
                    backgroundColor:
                      actionType === 'APPROVE'
                        ? '#16A34A'
                        : actionType === 'REJECT' || actionType === 'SUSPEND'
                        ? '#DC2626'
                        : '#2563EB',
                  },
                ]}
              >
                {submittingAction ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmBtnText}>
                    {actionType === 'APPROVE' && 'Confirm Approval'}
                    {actionType === 'REJECT' && 'Confirm Rejection'}
                    {actionType === 'REQUEST_INFO' && 'Send Info Request'}
                    {actionType === 'SUSPEND' && 'Confirm Suspension'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Admin Sign Out Confirmation Dialog */}
      <ConfirmationDialog
        visible={logoutModalVisible}
        title="Sign Out"
        message="Are you sure you want to sign out of the Super-Admin console?"
        confirmText="Sign Out"
        cancelText="Cancel"
        confirmVariant="danger"
        iconVariant="danger"
        loading={loggingOut}
        onConfirm={handleConfirmLogout}
        onCancel={() => setLogoutModalVisible(false)}
      />

      <LoadingDialog
        visible={submittingAction}
        title="Processing Decision"
        message="Updating doctor credentials and system records..."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shieldWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: StitchColors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  headerLogoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },

  scrollContent: {
    padding: 16,
    gap: 16,
  },

  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    ...Shadows.subtle,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  kpiIconBox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
  },
  kpiSub: {
    fontSize: 11,
    marginTop: 2,
  },

  tabBar: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  searchSection: {
    gap: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
  },

  listSection: {
    gap: 12,
  },
  centerBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  centerText: {
    fontSize: 13,
  },

  emptyCard: {
    padding: 36,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },

  docCard: {
    padding: 16,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: 12,
    ...Shadows.subtle,
  },
  docHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  docName: {
    fontSize: 16,
    fontWeight: '800',
  },
  docSpecialty: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  docEmail: {
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  detailsBox: {
    padding: 12,
    borderRadius: BorderRadius.lg,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },

  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: BorderRadius.lg,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  logCard: {
    padding: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 4,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  logAction: {
    fontSize: 13,
    fontWeight: '700',
  },
  logDate: {
    fontSize: 11,
  },
  logDetails: {
    fontSize: 12,
    fontWeight: '600',
  },
  logJson: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: 10,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  confirmNotice: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
