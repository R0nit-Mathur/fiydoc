import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FiYLogo } from '@/components/ui/FiYLogo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Mail, Lock, ArrowLeft, Eye, EyeOff, ShieldCheck, UserCheck, Stethoscope } from 'lucide-react-native';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

      // Direct role-based navigation
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

  const setTestAccount = (accountEmail: string) => {
    setEmail(accountEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 24, flexGrow: 1, justifyContent: 'space-between' }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mb-3 self-start">
            <ArrowLeft size={24} color="#0F172A" />
          </TouchableOpacity>

          <FiYLogo size="lg" />
          <Text className="text-2xl font-black text-slate-900 mt-4">Welcome to FiYDoc</Text>
          <Text className="text-xs text-slate-500 font-medium mt-1 mb-6 leading-5">
            Sign in to access your clinic appointments, verified specialist network, and health records.
          </Text>

          {/* Quick Test Accounts Bar */}
          <View className="bg-slate-50 p-4 rounded-3xl border border-slate-200/90 mb-5">
            <Text className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2.5">
              ⚡ Quick Test Credentials:
            </Text>
            <View className="flex-row" style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={() => setTestAccount('patient@fiydoc.app')}
                activeOpacity={0.8}
                className="flex-1 bg-teal-50 border border-teal-200/90 p-2.5 rounded-2xl items-center flex-row justify-center"
                style={{ gap: 6 }}
              >
                <UserCheck size={14} color="#00B39B" />
                <Text className="text-xs font-bold text-teal-800">Patient</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTestAccount('doctor@fiydoc.app')}
                activeOpacity={0.8}
                className="flex-1 bg-blue-50 border border-blue-200/90 p-2.5 rounded-2xl items-center flex-row justify-center"
                style={{ gap: 6 }}
              >
                <Stethoscope size={14} color="#1E58C8" />
                <Text className="text-xs font-bold text-blue-800">Doctor</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTestAccount('admin@fiydoc.app')}
                activeOpacity={0.8}
                className="flex-1 bg-slate-100 border border-slate-300 p-2.5 rounded-2xl items-center flex-row justify-center"
                style={{ gap: 6 }}
              >
                <ShieldCheck size={14} color="#0F172A" />
                <Text className="text-xs font-bold text-slate-800">Admin</Text>
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <View className="bg-red-50 p-3.5 rounded-2xl border border-red-200 mb-4">
              <Text className="text-xs font-bold text-red-600">{error}</Text>
            </View>
          ) : null}

          <View style={{ gap: 16 }}>
            <Input
              label="Email Address"
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              leftIcon={<Mail size={18} color="#94A3B8" />}
            />

            <Input
              label="Password"
              placeholder="••••••••••••"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              leftIcon={<Lock size={18} color="#94A3B8" />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={18} color="#94A3B8" /> : <Eye size={18} color="#94A3B8" />}
                </TouchableOpacity>
              }
            />

            <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} className="self-end pt-1">
              <Text className="text-xs font-bold text-[#1E58C8]">Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ gap: 16, paddingTop: 24, paddingBottom: 8 }}>
          <Button
            title="Sign In to FiYDoc"
            onPress={handleLogin}
            loading={loading}
            variant="primary"
            size="lg"
          />

          <View className="flex-row justify-center items-center">
            <Text className="text-xs text-slate-500">Don't have an account yet? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text className="text-xs font-bold text-[#00B39B]">Create an Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
