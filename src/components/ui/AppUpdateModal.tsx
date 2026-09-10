import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { updateService, UpdateMetadata, CheckUpdateResult } from '@/services/updateService';
import { useAppTheme } from '@/hooks/useAppTheme';
import { StitchColors, BorderRadius, Spacing, Palette } from '@/constants/theme';
import {
  RefreshCw,
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Radio,
  Send,
  Sparkles,
} from 'lucide-react-native';

interface AppUpdateModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AppUpdateModal({ visible, onClose }: AppUpdateModalProps) {
  const { colors, isDark } = useAppTheme();
  const [metadata, setMetadata] = useState<UpdateMetadata | null>(null);
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState<CheckUpdateResult | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setMetadata(updateService.getMetadata());
      setResult(null);
      setActionMessage(null);
    }
  }, [visible]);

  const handleCheckForUpdate = async () => {
    setChecking(true);
    setActionMessage(null);
    try {
      const res = await updateService.checkForUpdate();
      setResult(res);
    } catch (err: any) {
      setResult({
        isAvailable: false,
        message: err?.message || 'Error checking for updates.',
      });
    } finally {
      setChecking(false);
    }
  };

  const handleDownloadAndApply = async () => {
    setDownloading(true);
    setActionMessage('Downloading newest bundle and reloading app...');
    try {
      const applyRes = await updateService.fetchAndApplyUpdate();
      setActionMessage(applyRes.message);
    } catch (err: any) {
      setActionMessage(err?.message || 'Failed to download and apply update.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Over-The-Air (OTA) Updates">
      <View style={styles.container}>
        {/* Header telemetry card */}
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={styles.statusRow}>
              <Radio size={14} color={metadata?.isEnabled ? StitchColors.secondaryContainer : '#f59e0b'} />
              <Text style={[styles.statusTitle, { color: colors.text }]}>
                {metadata?.isEnabled ? 'Live EAS OTA Active' : 'Development / Web Mode'}
              </Text>
            </View>
            <Badge
              label={metadata?.channel ? metadata.channel.toUpperCase() : 'LOCAL'}
              variant={metadata?.isEnabled ? 'teal' : 'slate'}
              size="sm"
            />
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaCol}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Runtime Version</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>
                {metadata?.runtimeVersion || '1.0.0'}
              </Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Target Platform</Text>
              <Text style={[styles.metaValue, { color: colors.text }]}>
                {Platform.OS === 'ios' ? 'Apple iOS' : Platform.OS === 'android' ? 'Google Android' : 'Web Browser'}
              </Text>
            </View>
            <View style={[styles.metaCol, { width: '100%', marginTop: 8 }]}>
              <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Active Bundle ID</Text>
              <Text style={[styles.metaValueMono, { color: colors.textSecondary }]} numberOfLines={1}>
                {metadata?.updateId || 'local-metro-bundle'}
              </Text>
            </View>
          </View>
        </View>

        {/* Check result feedback */}
        {result && (
          <View
            style={[
              styles.feedbackBox,
              {
                backgroundColor: result.isAvailable ? StitchColors.secondaryFixed : colors.surfaceContainerLow,
                borderColor: result.isAvailable ? StitchColors.secondaryFixedDim : colors.border,
              },
            ]}
          >
            {result.isAvailable ? (
              <Sparkles size={18} color={StitchColors.secondary} />
            ) : (
              <CheckCircle2 size={18} color={StitchColors.secondary} />
            )}
            <Text
              style={[
                styles.feedbackText,
                { color: result.isAvailable ? StitchColors.secondary : colors.text },
              ]}
            >
              {result.message}
            </Text>
          </View>
        )}

        {actionMessage && (
          <View style={[styles.actionMessageBox, { backgroundColor: colors.backgroundSelected }]}>
            <Text style={[styles.actionMessageText, { color: colors.text }]}>{actionMessage}</Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: StitchColors.primaryContainer },
              checking && { opacity: 0.7 },
            ]}
            onPress={handleCheckForUpdate}
            disabled={checking || downloading}
          >
            {checking ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <RefreshCw size={16} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.buttonText}>Check for OTA Update</Text>
              </>
            )}
          </TouchableOpacity>

          {result?.isAvailable && (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: StitchColors.secondaryContainer, marginTop: 10 },
                downloading && { opacity: 0.7 },
              ]}
              onPress={handleDownloadAndApply}
              disabled={downloading}
            >
              {downloading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <DownloadCloud size={16} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.buttonText}>Install & Restart App</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Deployment CLI Note */}
        <View style={[styles.cliNotice, { borderColor: colors.border }]}>
          <View style={styles.cliTitleRow}>
            <Send size={13} color={colors.textMuted} />
            <Text style={[styles.cliTitle, { color: colors.textMuted }]}>
              OTA Publishing Pipeline (EAS)
            </Text>
          </View>
          <Text style={[styles.cliCode, { color: colors.textSecondary }]}>
            pnpm run update:production -- "Your Release Notes"
          </Text>
          <Text style={[styles.cliSub, { color: colors.textMuted }]}>
            Dispatches live JavaScript & asset changes instantly to all iOS and Android devices without app store re-review.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaCol: {
    flex: 1,
    minWidth: 120,
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  metaValueMono: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: 10,
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    lineHeight: 18,
  },
  actionMessageBox: {
    padding: 10,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  actionMessageText: {
    fontSize: 12,
    textAlign: 'center',
  },
  buttonGroup: {
    marginBottom: Spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: BorderRadius.full,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  cliNotice: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    marginTop: 4,
  },
  cliTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  cliTitle: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cliCode: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 4,
  },
  cliSub: {
    fontSize: 11,
    lineHeight: 15,
  },
});
