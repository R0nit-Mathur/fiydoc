import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FiYLogo } from '@/components/ui/FiYLogo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GoogleLogo } from '@/components/ui/GoogleLogo';
import { User, Mail, Lock, Phone, ArrowLeft, UserCheck, Stethoscope } from 'lucide-react-native';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';

export default function SignupScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    setError('');
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      const session = await authService.registerWithEmail(email.trim(), password, role, name.trim());
      session.phone = phone || '+91 98765 43210';
      setSession(session);
      router.push('/(auth)/otp');
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try a different email.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    try {
      setGoogleLoading(true);
      const session = await authService.loginWithGoogle();
      setSession(session);
      router.replace('/(patient)/home');
    } catch (err: any) {
      setError(err.message || 'Google sign-up failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, flexGrow: 1, justifyContent: 'space-between' }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-2xl bg-slate-100 items-center justify-center -ml-1 mb-3"
          >
            <ArrowLeft size={20} color="#0F172A" />
          </TouchableOpacity>

          <FiYLogo size="lg" />
          <Text className="text-2xl font-black text-slate-900 mt-3">Create Account</Text>
          <Text className="text-xs text-slate-500 font-medium mt-1 mb-4">
            Join FiYDoc to book appointments or manage your clinical practice.
          </Text>

          {/* Account Role Selector Tabs */}
          <View className="flex-row bg-slate-100 p-1 rounded-2xl mb-4" style={{ gap: 4 }}>
            <TouchableOpacity
              onPress={() => setRole('PATIENT')}
              activeOpacity={0.8}
              className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center ${
                role === 'PATIENT' ? 'bg-white shadow-xs' : 'bg-transparent'
              }`}
              style={{ gap: 6 }}
            >
              <UserCheck size={16} color={role === 'PATIENT' ? '#00B39B' : '#64748B'} />
              <Text
                className={`text-xs font-black ${
                  role === 'PATIENT' ? 'text-slate-900' : 'text-slate-500'
                }`}
              >
                I'm a Patient
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setRole('DOCTOR')}
              activeOpacity={0.8}
              className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center ${
                role === 'DOCTOR' ? 'bg-white shadow-xs' : 'bg-transparent'
              }`}
              style={{ gap: 6 }}
            >
              <Stethoscope size={16} color={role === 'DOCTOR' ? '#1E58C8' : '#64748B'} />
              <Text
                className={`text-xs font-black ${
                  role === 'DOCTOR' ? 'text-slate-900' : 'text-slate-500'
                }`}
              >
                I'm a Doctor
              </Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View className="bg-red-50 p-3 rounded-xl border border-red-200 mb-4">
              <Text className="text-xs font-bold text-red-600">{error}</Text>
            </View>
          ) : null}

          <View style={{ gap: 12 }}>
            <Input
              label="Full Name"
              placeholder={role === 'DOCTOR' ? 'e.g. Dr. Priya Sharma' : 'e.g. Aarav Mehta'}
              value={name}
              onChangeText={setName}
              leftIcon={<User size={16} color="#94A3B8" />}
            />

            <Input
              label="Email Address"
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              leftIcon={<Mail size={16} color="#94A3B8" />}
            />

            <Input
              label="Mobile Number (Optional)"
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              leftIcon={<Phone size={16} color="#94A3B8" />}
            />

            <Input
              label="Password"
              placeholder="At least 8 characters"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              leftIcon={<Lock size={16} color="#94A3B8" />}
            />
          </View>
        </View>

        <View style={{ gap: 12, paddingTop: 20, paddingBottom: 6 }}>
          <Button
            title="Create Account & Verify"
            onPress={handleSignup}
            loading={loading}
            variant={role === 'DOCTOR' ? 'primary' : 'teal'}
            size="lg"
          />

          {/* Google Sign In Button */}
          <TouchableOpacity
            onPress={handleGoogleSignup}
            disabled={googleLoading || loading}
            activeOpacity={0.85}
            className="flex-row items-center justify-center bg-white py-3 px-4 rounded-2xl border border-slate-200 shadow-sm"
            style={{ gap: 10 }}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#00B39B" />
            ) : (
              <>
                <GoogleLogo size={18} />
                <Text className="text-sm font-bold text-slate-800">
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center items-center pt-1">
            <Text className="text-xs text-slate-500">Already registered? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text className="text-xs font-bold text-[#1E58C8]">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
