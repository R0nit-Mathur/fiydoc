import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { X, ExternalLink, FileText, AlertCircle, Eye } from 'lucide-react-native';
import { StitchColors } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface DocumentViewerModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  documentUrl?: string | null;
  url?: string | null;
  fileType?: 'image' | 'pdf' | 'auto';
  mimeType?: string;
  subtitle?: string;
}

export function DocumentViewerModal({
  visible,
  onClose,
  title = 'Medical Document',
  documentUrl,
  url: directUrl,
  fileType = 'auto',
  mimeType,
  subtitle,
}: DocumentViewerModalProps) {
  const insets = useSafeAreaInsets();
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  if (!visible) return null;

  const url = documentUrl || directUrl || '';
  const isPdf =
    fileType === 'pdf' ||
    mimeType === 'application/pdf' ||
    (fileType === 'auto' &&
      (url.toLowerCase().endsWith('.pdf') ||
        url.includes('/pdf') ||
        url.includes('application/pdf')));

  const handleOpenExternal = async () => {
    if (!url) return;
    try {
      if (Platform.OS === 'web') {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        await WebBrowser.openBrowserAsync(url);
      }
    } catch {
      Linking.openURL(url).catch(() => {});
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <View style={styles.titleColumn}>
            <Text numberOfLines={1} style={styles.titleText}>
              {title}
            </Text>
            {subtitle && (
              <Text numberOfLines={1} style={styles.subtitleText}>
                {subtitle}
              </Text>
            )}
          </View>

          <View style={styles.headerActions}>
            {url ? (
              <Pressable
                onPress={handleOpenExternal}
                style={styles.actionBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Open document in browser or external viewer"
              >
                <ExternalLink size={18} color={StitchColors.primary} />
                <Text style={styles.actionBtnText}>Open</Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Close viewer"
            >
              <X size={20} color="#334155" />
            </Pressable>
          </View>
        </View>

        {/* Content Body */}
        <View style={styles.contentContainer}>
          {!url ? (
            <View style={styles.emptyCard}>
              <AlertCircle size={40} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No Document Available</Text>
              <Text style={styles.emptyText}>
                This record does not have an attached file to display.
              </Text>
            </View>
          ) : isPdf ? (
            <View style={styles.pdfCard}>
              <View style={styles.pdfIconContainer}>
                <FileText size={48} color={StitchColors.primary} />
              </View>
              <Text style={styles.pdfCardTitle}>{title}</Text>
              <Text style={styles.pdfCardSubtitle}>
                Clinical PDF Document • Secure Medical Cloud
              </Text>
              <Pressable
                onPress={handleOpenExternal}
                style={styles.primaryOpenBtn}
              >
                <Eye size={18} color="#ffffff" />
                <Text style={styles.primaryOpenBtnText}>
                  View Full PDF Document
                </Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.imageScrollContent}
              maximumZoomScale={3}
              minimumZoomScale={1}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
            >
              {imageLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={StitchColors.primary} />
                  <Text style={styles.loadingText}>Loading document preview...</Text>
                </View>
              )}
              {imageError ? (
                <View style={styles.emptyCard}>
                  <AlertCircle size={40} color="#ef4444" />
                  <Text style={styles.emptyTitle}>Preview Unavailable</Text>
                  <Text style={styles.emptyText}>
                    Could not render image preview. Tap "Open" to view the file directly.
                  </Text>
                  <Pressable onPress={handleOpenExternal} style={styles.primaryOpenBtn}>
                    <ExternalLink size={18} color="#ffffff" />
                    <Text style={styles.primaryOpenBtnText}>Open Document</Text>
                  </Pressable>
                </View>
              ) : (
                <Image
                  source={{ uri: url }}
                  style={styles.previewImage}
                  contentFit="contain"
                  onLoadStart={() => setImageLoading(true)}
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    setImageLoading(false);
                    setImageError(true);
                  }}
                />
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  titleColumn: {
    flex: 1,
    marginRight: 12,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitleText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: StitchColors.primary,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#090d16',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  imageScrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  previewImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
  },
  loadingOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    color: '#cbd5e1',
    fontSize: 13,
    marginTop: 10,
    fontWeight: '500',
  },
  pdfCard: {
    width: '88%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  pdfIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pdfCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6,
  },
  pdfCardSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryOpenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: StitchColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
  },
  primaryOpenBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 320,
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
});
