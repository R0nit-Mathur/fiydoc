import * as Updates from 'expo-updates';
import { Platform } from 'react-native';

export interface UpdateMetadata {
  isEnabled: boolean;
  channel: string;
  runtimeVersion: string;
  updateId: string;
  createdAt: string;
  isEmbeddedLaunch: boolean;
  platform: string;
}

export interface CheckUpdateResult {
  isAvailable: boolean;
  message: string;
  manifest?: any;
}

export const updateService = {
  isEnabled(): boolean {
    return Updates.isEnabled;
  },

  getMetadata(): UpdateMetadata {
    return {
      isEnabled: Updates.isEnabled,
      channel: Updates.channel || (Updates.isEnabled ? 'production' : 'local-dev'),
      runtimeVersion: Updates.runtimeVersion || '1.0.0',
      updateId: Updates.updateId || 'embedded-bundle',
      createdAt: Updates.createdAt ? new Date(Updates.createdAt).toLocaleString() : 'Embedded',
      isEmbeddedLaunch: Updates.isEmbeddedLaunch ?? true,
      platform: Platform.OS,
    };
  },

  async checkForUpdate(): Promise<CheckUpdateResult> {
    if (!Updates.isEnabled) {
      return {
        isAvailable: false,
        message: Platform.OS === 'web'
          ? 'OTA dynamic updates are active on iOS & Android standalone binaries.'
          : 'App is running in development mode. OTA updates activate on installed builds.',
      };
    }

    try {
      const check = await Updates.checkForUpdateAsync();
      if (check.isAvailable) {
        return {
          isAvailable: true,
          message: 'A new FiYDoc OTA update is available for immediate installation.',
          manifest: check.manifest,
        };
      }
      return {
        isAvailable: false,
        message: 'Your FiYDoc build is fully up to date with the latest release.',
      };
    } catch (err: any) {
      console.warn('[updateService] Check failed:', err?.message);
      return {
        isAvailable: false,
        message: err?.message || 'Unable to reach Expo update servers. Check your internet connection.',
      };
    }
  },

  async fetchAndApplyUpdate(): Promise<{ success: boolean; message: string }> {
    if (!Updates.isEnabled) {
      return {
        success: false,
        message: 'OTA updates are only applicable to standalone native iOS/Android builds.',
      };
    }

    try {
      const fetchResult = await Updates.fetchUpdateAsync();
      if (fetchResult.isNew) {
        await Updates.reloadAsync();
        return {
          success: true,
          message: 'Update applied! Reloading application...',
        };
      }
      return {
        success: false,
        message: 'No newer update found than current installed bundle.',
      };
    } catch (err: any) {
      console.warn('[updateService] Download/apply failed:', err);
      return {
        success: false,
        message: err?.message || 'Failed to download update bundle.',
      };
    }
  },
};
