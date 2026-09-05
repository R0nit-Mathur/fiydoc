import * as Updates from 'expo-updates';

export interface UpdateStatus {
  isAvailable: boolean;
  isChecking: boolean;
  isDownloading: boolean;
  manifest?: any;
  error?: string;
  channel?: string;
  runtimeVersion?: string;
}

export const updateService = {
  isEnabled(): boolean {
    return Updates.isEnabled;
  },

  getMetadata() {
    return {
      isEnabled: Updates.isEnabled,
      channel: Updates.channel || 'development',
      runtimeVersion: Updates.runtimeVersion || '1.0.0',
      updateId: Updates.updateId || 'local-bundle',
      createdAt: Updates.createdAt ? new Date(Updates.createdAt).toLocaleString() : 'Just now',
    };
  },

  async checkForUpdate(): Promise<{ isAvailable: boolean; message: string }> {
    if (!Updates.isEnabled) {
      return {
        isAvailable: false,
        message: 'OTA updates are active in standalone production builds.',
      };
    }

    try {
      const check = await Updates.checkForUpdateAsync();
      if (check.isAvailable) {
        return {
          isAvailable: true,
          message: 'A new update is available for download.',
        };
      }
      return {
        isAvailable: false,
        message: 'Your FiYDoc app is up to date!',
      };
    } catch (err: any) {
      console.warn('[updateService] Check failed:', err?.message);
      return {
        isAvailable: false,
        message: err?.message || 'Could not check for updates.',
      };
    }
  },

  async fetchAndApplyUpdate(): Promise<boolean> {
    if (!Updates.isEnabled) return false;

    try {
      const check = await Updates.checkForUpdateAsync();
      if (check.isAvailable) {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[updateService] Download or apply failed:', err);
      return false;
    }
  },
};
