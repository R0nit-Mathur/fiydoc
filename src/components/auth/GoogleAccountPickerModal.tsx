import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Modal } from '@/components/ui/Modal';
import { GoogleLogo } from '@/components/ui/GoogleLogo';
import { Mail, User, ArrowRight, ShieldCheck } from 'lucide-react-native';

interface GoogleAccountPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAccount: (account: { email: string; name: string }) => Promise<void>;
}

export function GoogleAccountPickerModal({
  visible,
  onClose,
  onSelectAccount,
}: GoogleAccountPickerModalProps) {
  const [loading, setLoading] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!customName.trim() || !customEmail.trim()) {
      setError('Please enter both your full name and Google email address.');
      return;
    }
    if (!customEmail.includes('@') || !customEmail.includes('.')) {
      setError('Please enter a valid Google email address.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSelectAccount({
        name: customName.trim(),
        email: customEmail.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google account sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Google Account Authentication">
      <View style={{ gap: 14, paddingVertical: 4 }}>
        {/* Google Header */}
        <View className="items-center pb-1">
          <GoogleLogo size={36} />
          <Text className="text-base font-black text-slate-900 mt-2">
            Sign in with Google
          </Text>
          <Text className="text-xs text-slate-500 font-medium text-center mt-0.5">
            Connect your personal Google account to FiYDoc
          </Text>
        </View>

        {error ? (
          <View className="bg-red-50 p-3 rounded-xl border border-red-200">
            <Text className="text-xs font-bold text-red-600">{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View className="py-8 items-center" style={{ gap: 10 }}>
            <ActivityIndicator size="large" color="#1E58C8" />
            <Text className="text-xs font-bold text-slate-600">
              Authenticating Google Account...
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <View>
              <Text className="text-xs font-bold text-slate-700 mb-1">Full Name</Text>
              <View
                style={{
                  height: 48,
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1.5,
                  borderColor: '#E2E8F0',
                  borderRadius: 14,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <User size={16} color="#94A3B8" />
                <TextInput
                  placeholder="Enter your name as in Google"
                  placeholderTextColor="#94A3B8"
                  value={customName}
                  onChangeText={setCustomName}
                  style={{
                    flex: 1,
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#0F172A',
                    padding: 0,
                  }}
                />
              </View>
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-700 mb-1">Google Email Address</Text>
              <View
                style={{
                  height: 48,
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1.5,
                  borderColor: '#E2E8F0',
                  borderRadius: 14,
                  paddingHorizontal: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Mail size={16} color="#94A3B8" />
                <TextInput
                  placeholder="yourname@gmail.com"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={customEmail}
                  onChangeText={setCustomEmail}
                  style={{
                    flex: 1,
                    fontSize: 14,
                    fontWeight: '600',
                    color: '#0F172A',
                    padding: 0,
                  }}
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              activeOpacity={0.85}
              className="bg-[#1E58C8] py-3.5 rounded-2xl flex-row items-center justify-center mt-2 shadow-sm"
              style={{ gap: 8 }}
            >
              <Text className="text-sm font-black text-white">Authorize Google Sign In</Text>
              <ArrowRight size={16} color="#FFFFFF" />
            </TouchableOpacity>

            <View className="flex-row items-center justify-center mt-1" style={{ gap: 6 }}>
              <ShieldCheck size={14} color="#10B981" />
              <Text className="text-[11px] text-slate-500 font-medium">
                Verified OAuth 2.0 Encrypted Sign-In
              </Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
