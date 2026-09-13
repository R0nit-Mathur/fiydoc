declare module 'expo-secure-store' {
  export function getItemAsync(key: string, options?: any): Promise<string | null>;
  export function setItemAsync(key: string, value: string, options?: any): Promise<void>;
  export function deleteItemAsync(key: string, options?: any): Promise<void>;
}

declare module 'expo-image-picker' {
  export function requestMediaLibraryPermissionsAsync(): Promise<{ status: string; granted: boolean }>;
  export function launchImageLibraryAsync(options?: any): Promise<any>;
}

declare module 'expo-document-picker' {
  export function getDocumentAsync(options?: any): Promise<any>;
}
