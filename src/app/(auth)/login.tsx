import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FiYLogo } from '@/components/ui/FiYLogo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GoogleLogo } from '@/components/ui/GoogleLogo';
import { Mail, Lock, ArrowLeft, Eye, EyeOff, ShieldCheck, UserCheck, Stethoscope } from 'lucide-react-native';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { GoogleAccountPickerModal } from '@/components/auth/GoogleAccountPickerModal';
import { googleAuthService } from '@/services/googleAuth';

export default function LoginScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSafeBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/welcome');
    }
  };

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setLoading(true);
      const session = await authService.loginWithEmail(email.trim(), password);
      setSession(session);

      if (session.role === 'doctor') {
        router.replace('/(doctor)/home');
      } else {
        router.replace('/(patient)/home');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePress = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const session = await googleAuthService.signInWithGoogle();
      if (session) {
        setSession(session);
        if (session.role === 'doctor') {
          router.replace('/(doctor)/home');
        } else {
          router.replace('/(patient)/home');
        }
        return;
      }
      setGoogleModalVisible(true);
    } catch {
      setGoogleModalVisible(true);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSelectGoogleAccount = async (account: { email: string; name: string }) => {
    setError('');
    const session = await authService.loginWithGoogle(account.email, account.name);
    setSession(session);

    if (session.role === 'doctor') {
      router.replace('/(doctor)/home');
    } else {
      router.replace('/(patient)/home');
    }
  };

  const setTestAccount = (accountEmail: string) => {
    setEmail(accountEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, flexGrow: 1, justifyContent: 'space-between' }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <TouchableOpacity
            onPress={handleSafeBack}
            className="w-10 h-10 rounded-2xl bg-slate-100 items-center justify-center -ml-1 mb-3"
          >
            <ArrowLeft size={20} color="#0F172A" />
          </TouchableOpacity>

          <FiYLogo size="lg" />
          <Text className="text-2xl font-black text-slate-900 mt-3">Welcome to FiYDoc</Text>
          <Text className="text-xs text-slate-500 font-medium mt-1 mb-5 leading-5">
            Sign in to access your clinic appointments, verified specialist network, and health records.
          </Text>

          {/* Quick Test Accounts Bar */}
          <View className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-200/90 mb-4">
            <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
              ⚡ Quick Test Credentials:
            </Text>
            <View className="flex-row" style={{ gap: 6 }}>
              <TouchableOpacity
                onPress={() => setTestAccount('patient@fiydoc.app')}
                activeOpacity={0.8}
                className="flex-1 bg-teal-50 border border-teal-200/90 p-2 rounded-xl items-center flex-row justify-center"
                style={{ gap: 4 }}
              >
                <UserCheck size={13} color="#00B39B" />
                <Text className="text-xs font-bold text-teal-800">Patient</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTestAccount('doctor@fiydoc.app')}
                activeOpacity={0.8}
                className="flex-1 bg-blue-50 border border-blue-200/90 p-2 rounded-xl items-center flex-row justify-center"
                style={{ gap: 4 }}
              >
                <Stethoscope size={13} color="#1E58C8" />
                <Text className="text-xs font-bold text-blue-800">Doctor</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTestAccount('admin@fiydoc.app')}
                activeOpacity={0.8}
                className="flex-1 bg-slate-100 border border-slate-300 p-2 rounded-xl items-center flex-row justify-center"
                style={{ gap: 4 }}
              >
                <ShieldCheck size={13} color="#0F172A" />
                <Text className="text-xs font-bold text-slate-800">Admin</Text>
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <View className="bg-red-50 p-3 rounded-xl border border-red-200 mb-4">
              <Text className="text-xs font-bold text-red-600">{error}</Text>
            </View>
          ) : null}

          <View style={{ gap: 14 }}>
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
              label="Password"
              placeholder="••••••••••••"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              leftIcon={<Lock size={16} color="#94A3B8" />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} color="#94A3B8" /> : <Eye size={16} color="#94A3B8" />}
                </TouchableOpacity>
              }
            />

            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} className="self-end pt-0.5">
              <Text className="text-xs font-bold text-[#1E58C8]">Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ gap: 12, paddingTop: 20, paddingBottom: 6 }}>
          <Button
            title="Sign In to FiYDoc"
            onPress={handleLogin}
            loading={loading}
            variant="primary"
            size="lg"
          />

          {/* Google Sign In Button */}
          <TouchableOpacity
            onPress={handleGooglePress}
            activeOpacity={0.85}
            disabled={googleLoading}
            className="flex-row items-center justify-center bg-white py-3 px-4 rounded-2xl border border-slate-200 shadow-sm"
            style={{ gap: 10 }}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#1E58C8" />
            ) : (
              <GoogleLogo size={18} />
            )}
            <Text className="text-sm font-bold text-slate-800">
              {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center items-center pt-1">
            <Text className="text-xs text-slate-500">Don't have an account yet? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text className="text-xs font-bold text-[#00B39B]">Create an Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Google Account Picker Modal */}
      <GoogleAccountPickerModal
        visible={googleModalVisible}
        onClose={() => setGoogleModalVisible(false)}
        onSelectAccount={handleSelectGoogleAccount}
      />
    </SafeAreaView>
  );
}
