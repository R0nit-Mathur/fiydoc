import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

export interface PickedMedia {
  uri: string;
  name: string;
  size?: string;
  mimeType?: string;
}

async function persistPickedFile(uri: string, filename: string): Promise<string> {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) return uri;

  const sanitizedName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const destination = `${FileSystem.documentDirectory}fiydoc-media/${Date.now()}-${sanitizedName}`;
  try {
    await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}fiydoc-media`, { intermediates: true });
    await FileSystem.copyAsync({ from: uri, to: destination });
    return destination;
  } catch (error: any) {
    console.warn('[mediaPicker] Could not persist picked file:', error?.message);
    return uri;
  }
}

/**
 * Universal Image Picker for User / Doctor Avatars and Profile Photos
 */
export async function pickImageFromGallery(): Promise<string | null> {
  try {
    const ImagePicker = await import('expo-image-picker');

    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Photo Library Access',
          'Please allow FiYDoc to access your photos from device settings to select a profile picture.',
          [{ text: 'OK' }]
        );
        return null;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      return persistPickedFile(result.assets[0].uri, `avatar.${result.assets[0].fileName?.split('.').pop() || 'jpg'}`);
    }
    return null;
  } catch (error: any) {
    console.warn('[pickImageFromGallery] Failed:', error?.message);
    Alert.alert(
      'Unable to Select Photo',
      'An issue occurred while accessing the photo gallery. Please verify device permissions and try again.',
      [{ text: 'OK' }]
    );
    return null;
  }
}

/**
 * Universal Document Picker for Lab Reports, Degrees, Medical Certificates & Prescriptions
 */
export async function pickClinicalDocument(): Promise<PickedMedia | null> {
  try {
    const DocumentPicker = await import('expo-document-picker');

    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const file = result.assets[0];
      const sizeKb = file.size ? Math.round(file.size / 1024) : 1200;
      const sizeFormatted = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

      return {
        uri: await persistPickedFile(file.uri, file.name || 'Document.pdf'),
        name: file.name || 'Document.pdf',
        size: sizeFormatted,
        mimeType: file.mimeType || 'application/pdf',
      };
    }
    return null;
  } catch (error: any) {
    console.warn('[pickClinicalDocument] Failed:', error?.message);
    Alert.alert(
      'Document Selection',
      'Unable to open file picker. Please ensure file storage permission is enabled on your device.',
      [{ text: 'OK' }]
    );
    return null;
  }
}
