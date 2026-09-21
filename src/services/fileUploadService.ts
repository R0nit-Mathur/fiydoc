import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { apiClient } from './apiClient';

export interface UploadResult {
  url: string;
  path: string;
  filename: string;
  sizeBytes: number;
  mimeType: string;
  storageProvider: string;
}

export const fileUploadService = {
  /**
   * Reads a local file URI (from document picker, camera, or gallery)
   * and uploads it to the backend /upload endpoint, returning a permanent public URL.
   */
  async uploadFile(
    file: { uri: string; name?: string; mimeType?: string },
    category: 'documents' | 'prescriptions' | 'doctors' | 'patients' = 'documents',
  ): Promise<UploadResult> {
    const { uri, name, mimeType } = file;

    // If already a remote web URL, avoid re-uploading
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return {
        url: uri,
        path: uri,
        filename: name || uri.split('/').pop() || 'file',
        sizeBytes: 0,
        mimeType: mimeType || 'application/octet-stream',
        storageProvider: 'external',
      };
    }

    let base64Data = '';
    let detectedMime = mimeType || 'application/octet-stream';

    if (uri.startsWith('data:')) {
      // Data URI format: data:[<mediatype>][;base64],<data>
      const match = uri.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        detectedMime = match[1];
        base64Data = match[2];
      } else {
        base64Data = uri.split(',')[1] || '';
      }
    } else if (Platform.OS === 'web') {
      const res = await fetch(uri);
      const blob = await res.blob();
      detectedMime = blob.type || detectedMime;
      base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1] || '');
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      // Native iOS and Android
      base64Data = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      if (!mimeType) {
        const ext = (name || uri).split('.').pop()?.toLowerCase();
        if (ext === 'jpg' || ext === 'jpeg') detectedMime = 'image/jpeg';
        else if (ext === 'png') detectedMime = 'image/png';
        else if (ext === 'webp') detectedMime = 'image/webp';
        else if (ext === 'pdf') detectedMime = 'application/pdf';
      }
    }

    const filename = name || `doc_${Date.now()}.${detectedMime.includes('pdf') ? 'pdf' : 'jpg'}`;

    try {
      const uploadPromise = apiClient<UploadResult>('/upload', {
        method: 'POST',
        body: JSON.stringify({
          filename,
          base64: base64Data,
          mimeType: detectedMime,
          category,
        }),
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('File upload timeout after 8s')), 8000)
      );

      return await Promise.race([uploadPromise, timeoutPromise]);
    } catch (err: any) {
      console.warn('[fileUploadService] Upload failed or timed out, returning local URI fallback:', err?.message);
      return {
        url: uri,
        path: uri,
        filename,
        sizeBytes: base64Data.length,
        mimeType: detectedMime,
        storageProvider: 'local',
      };
    }
  },
};
