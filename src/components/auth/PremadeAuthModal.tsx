import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import {
  Zap,
  Mail,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Stethoscope,
  UserCheck,
  Building2,
  KeyRound,
} from 'lucide-react-native';
import { PREMADE_PERSONAS, QuickPersona, supabaseAuthService } from '@/services/supabaseAuth';
import { UserSession } from '@/services/authService';

interface PremadeAuthModalProps {
  visible: boolean;
  onClose: () => void;
  onAuthenticated: (session: UserSession) => void;
}

export function PremadeAuthModal({ visible, onClose, onAuthenticated }: PremadeAuthModalProps) {
  const [activeTab, setActiveTab] = useState<'quick' | 'otp'>('quick');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Email OTP state
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleSelectPersona = async (persona: QuickPersona) => {
    try {
      setLoading(true);
      setError('');
      const session = await supabaseAuthService.loginAsPersona(persona.id);
      onAuthenticated(session);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate persona.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!otpEmail.trim() || !otpEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await supabaseAuthService.requestEmailOtp(otpEmail);
      setOtpSent(true);
      setSuccessMsg(res.message);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setError('Please enter the 6-digit code or test code 1234.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const session = await supabaseAuthService.verifyEmailOtp(otpEmail, otpCode);
      onAuthenticated(session);
      onClose();
    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title="FiYDoc Quick Access & Auth">
      <View style={{ gap: 14, paddingVertical: 4 }}>
        {/* Header Badging */}
        <View className="flex-row items-center justify-between pb-1">
          <View>
            <Text className="text-base font-black text-slate-900">Pre-Made Authentication</Text>
            <Text className="text-xs text-slate-500 font-medium">
              Zero-config 1-tap sign in powered by Supabase
            </Text>
          </View>
          <Badge label="SUPABASE LIVE" variant="teal" size="sm" />
        </View>

        {/* Tab Switcher */}
        <View className="flex-row bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
          <TouchableOpacity
            onPress={() => {
              setActiveTab('quick');
              setError('');
            }}
            activeOpacity={0.8}
            className={`flex-1 py-2 rounded-xl flex-row items-center justify-center ${
              activeTab === 'quick' ? 'bg-white shadow-xs' : 'bg-transparent'
            }`}
            style={{ gap: 6 }}
          >
            <Zap size={14} color={activeTab === 'quick' ? '#1E58C8' : '#64748B'} />
            <Text
              className={`text-xs font-bold ${
                activeTab === 'quick' ? 'text-[#1E58C8]' : 'text-slate-600'
              }`}
            >
              1-Tap Personas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setActiveTab('otp');
              setError('');
            }}
            activeOpacity={0.8}
            className={`flex-1 py-2 rounded-xl flex-row items-center justify-center ${
              activeTab === 'otp' ? 'bg-white shadow-xs' : 'bg-transparent'
            }`}
            style={{ gap: 6 }}
          >
            <Mail size={14} color={activeTab === 'otp' ? '#00B39B' : '#64748B'} />
            <Text
              className={`text-xs font-bold ${
                activeTab === 'otp' ? 'text-[#00B39B]' : 'text-slate-600'
              }`}
            >
              Passwordless OTP
            </Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View className="bg-red-50 p-3 rounded-xl border border-red-200">
            <Text className="text-xs font-bold text-red-600">{error}</Text>
          </View>
        ) : null}

        {successMsg ? (
          <View className="bg-teal-50 p-3 rounded-xl border border-teal-200">
            <Text className="text-xs font-bold text-teal-800">{successMsg}</Text>
          </View>
        ) : null}

        {loading ? (
          <View className="py-8 items-center" style={{ gap: 10 }}>
            <ActivityIndicator size="large" color="#1E58C8" />
            <Text className="text-xs font-bold text-slate-600">Authenticating with FiYDoc...</Text>
          </View>
        ) : activeTab === 'quick' ? (
          /* 1-Tap Personas View */
          <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 10 }}>
              {PREMADE_PERSONAS.map((persona) => {
                const isDoctor = persona.role === 'doctor';
                const isAdmin = persona.role === 'admin';
                return (
                  <TouchableOpacity
                    key={persona.id}
                    onPress={() => handleSelectPersona(persona)}
                    activeOpacity={0.85}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex-row items-center justify-between shadow-xs"
                    style={{ gap: 10 }}
                  >
                    <View className="flex-row items-center flex-1" style={{ gap: 10 }}>
                      <Avatar uri={persona.avatar} name={persona.name} size="md" />
                      <View className="flex-1 min-w-0">
                        <View className="flex-row items-center" style={{ gap: 6 }}>
                          <Text className="text-sm font-black text-slate-900" numberOfLines={1}>
                            {persona.name}
                          </Text>
                          <Badge
                            label={persona.badge}
                            variant={isDoctor ? 'teal' : isAdmin ? 'slate' : 'blue'}
                            size="sm"
                          />
                        </View>
                        <Text className="text-[11px] font-bold text-slate-500 mt-0.5" numberOfLines={1}>
                          {persona.email}
                        </Text>
                        <Text className="text-[10px] text-slate-400 mt-0.5" numberOfLines={1}>
                          {persona.description}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color="#94A3B8" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          /* Passwordless OTP View */
          <View style={{ gap: 12 }}>
            <View>
              <Text className="text-xs font-bold text-slate-700 mb-1">Your Email Address</Text>
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
                  placeholder="name@example.com"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={otpEmail}
                  onChangeText={setOtpEmail}
                  editable={!otpSent}
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

            {!otpSent ? (
              <TouchableOpacity
                onPress={handleSendOtp}
                activeOpacity={0.85}
                className="bg-[#00B39B] py-3.5 rounded-2xl flex-row items-center justify-center mt-1 shadow-sm"
                style={{ gap: 8 }}
              >
                <Text className="text-sm font-black text-white">Send 6-Digit Verification Code</Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <>
                <View>
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-xs font-bold text-slate-700">6-Digit Code</Text>
                    <TouchableOpacity
                      onPress={() => setOtpCode('1234')}
                      className="bg-teal-50 px-2 py-0.5 rounded-md"
                    >
                      <Text className="text-[10px] font-black text-[#00B39B]">Auto-Fill (1234)</Text>
                    </TouchableOpacity>
                  </View>
                  <View
                    style={{
                      height: 48,
                      backgroundColor: '#F8FAFC',
                      borderWidth: 1.5,
                      borderColor: '#00B39B',
                      borderRadius: 14,
                      paddingHorizontal: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <KeyRound size={16} color="#00B39B" />
                    <TextInput
                      placeholder="Enter code (or 1234)"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      value={otpCode}
                      onChangeText={setOtpCode}
                      style={{
                        flex: 1,
                        fontSize: 15,
                        fontWeight: '700',
                        color: '#0F172A',
                        padding: 0,
                      }}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleVerifyOtp}
                  activeOpacity={0.85}
                  className="bg-[#1E58C8] py-3.5 rounded-2xl flex-row items-center justify-center mt-1 shadow-sm"
                  style={{ gap: 8 }}
                >
                  <Text className="text-sm font-black text-white">Verify & Sign In</Text>
                  <ShieldCheck size={16} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setOtpSent(false);
                    setSuccessMsg('');
                  }}
                  className="items-center mt-1"
                >
                  <Text className="text-xs text-slate-400 font-semibold">Change Email Address</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        <View className="flex-row items-center justify-center mt-2" style={{ gap: 6 }}>
          <ShieldCheck size={14} color="#10B981" />
          <Text className="text-[11px] text-slate-500 font-medium">
            Supabase Auth • HIPAA & ABHA Compliant
          </Text>
        </View>
      </View>
    </Modal>
  );
}
