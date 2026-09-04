import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Modal } from '@/components/ui/Modal';
import { GoogleLogo } from '@/components/ui/GoogleLogo';
import { UserPlus, ArrowRight } from 'lucide-react-native';

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
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [error, setError] = useState('');

  const PRESET_ACCOUNTS = [
    {
      name: 'Aarav Mehta',
      email: 'aarav.mehta@gmail.com',
      avatarText: 'AM',
      avatarBg: '#00B39B',
      role: 'Patient Account',
    },
    {
      name: 'Dr. Priya Sharma',
      email: 'dr.priya.sharma@gmail.com',
      avatarText: 'PS',
      avatarBg: '#1E58C8',
      role: 'Verified Doctor',
    },
  ];

  const handlePickAccount = async (account: { email: string; name: string }) => {
    try {
      setLoading(true);
      setError('');
      await onSelectAccount(account);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async () => {
    if (!customName.trim() || !customEmail.trim()) {
      setError('Please enter both your name and Google email address.');
      return;
    }
    if (!customEmail.includes('@')) {
      setError('Please enter a valid Google email address.');
      return;
    }

    await handlePickAccount({
      name: customName.trim(),
      email: customEmail.trim(),
    });
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Sign in with Google">
      <View style={{ gap: 14, paddingVertical: 4 }}>
        {/* Google Header */}
        <View className="items-center pb-1">
          <GoogleLogo size={32} />
          <Text className="text-base font-black text-slate-900 mt-2">
            Choose an account
          </Text>
          <Text className="text-xs text-slate-500 font-medium text-center mt-0.5">
            to continue to <Text className="font-bold text-slate-800">FiYDoc Health</Text>
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
              Connecting securely with Google...
            </Text>
          </View>
        ) : isCustomMode ? (
          /* Custom Google Account Form */
          <View style={{ gap: 10 }}>
            <View>
              <Text className="text-xs font-bold text-slate-700 mb-1">Your Full Name</Text>
              <TextInput
                placeholder="e.g. Ronit Mathur"
                placeholderTextColor="#94A3B8"
                value={customName}
                onChangeText={setCustomName}
                style={{
                  height: 44,
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  fontSize: 13,
                  fontWeight: '600',
                  color: '#0F172A',
                }}
              />
            </View>

            <View>
              <Text className="text-xs font-bold text-slate-700 mb-1">Google Email Address</Text>
              <TextInput
                placeholder="name@gmail.com"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                keyboardType="email-address"
                value={customEmail}
                onChangeText={setCustomEmail}
                style={{
                  height: 44,
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  fontSize: 13,
                  fontWeight: '600',
                  color: '#0F172A',
                }}
              />
            </View>

            <TouchableOpacity
              onPress={handleCustomSubmit}
              activeOpacity={0.85}
              className="bg-[#1E58C8] py-3 rounded-xl flex-row items-center justify-center mt-2 shadow-sm"
              style={{ gap: 8 }}
            >
              <Text className="text-xs font-black text-white">Continue with this Account</Text>
              <ArrowRight size={14} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setIsCustomMode(false);
                setError('');
              }}
              className="py-1 items-center"
            >
              <Text className="text-xs font-bold text-slate-500">Back to accounts list</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Preset Accounts Selection */
          <View style={{ gap: 8 }}>
            {PRESET_ACCOUNTS.map((acc) => (
              <TouchableOpacity
                key={acc.email}
                onPress={() => handlePickAccount({ name: acc.name, email: acc.email })}
                activeOpacity={0.8}
                className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/90 flex-row items-center justify-between"
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, gap: 10 }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: acc.avatarBg,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>
                      {acc.avatarText}
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                      {acc.name}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '500', color: '#64748B' }} numberOfLines={1}>
                      {acc.email}
                    </Text>
                  </View>
                </View>
                <View className="bg-slate-200/80 px-2 py-0.5 rounded-md ml-2">
                  <Text style={{ fontSize: 9, fontWeight: '700', color: '#475569' }}>
                    {acc.role}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Use Another Account Button */}
            <TouchableOpacity
              onPress={() => {
                setIsCustomMode(true);
                setError('');
              }}
              activeOpacity={0.8}
              className="p-3.5 rounded-2xl border border-dashed border-slate-300 flex-row items-center mt-1"
              style={{ gap: 10 }}
            >
              <View className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center">
                <UserPlus size={16} color="#64748B" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-800">Use another Google account</Text>
                <Text className="text-[10px] text-slate-500">Sign in with your custom Gmail address</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Privacy Note */}
        <Text className="text-[10px] text-slate-400 text-center leading-4 pt-1">
          To continue, Google will securely share your name, email address, and profile photo with FiYDoc.
        </Text>
      </View>
    </Modal>
  );
}
