import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FiYLogo } from '@/components/ui/FiYLogo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { User, Mail, Lock, Phone, ArrowLeft } from 'lucide-react-native';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';

export default function SignupScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setLoading(true);
      const session = await authService.registerWithEmail(email.trim(), password, 'PATIENT', name.trim());
      session.phone = phone || '+91 98765 43210';
      setSession(session);
      router.push('/(auth)/otp');
    } catch (err: any) {
      setError(err.message || 'Signup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerClassName="px-6 py-4 flex-grow justify-between">
        <View>
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mb-4 self-start">
            <ArrowLeft size={24} color="#0F172A" />
          </TouchableOpacity>

          <FiYLogo size="lg" />
          <Text className="text-2xl font-black text-slate-900 mt-4">Create Account</Text>
          <Text className="text-sm text-slate-500 mt-1 mb-6">
            Join FiYDoc to manage your healthcare or start consulting patients.
          </Text>

          {error ? (
            <View className="bg-red-50 p-3 rounded-xl border border-red-200 mb-4">
              <Text className="text-xs font-bold text-red-600">{error}</Text>
            </View>
          ) : null}

          <View style={{ gap: 16 }}>
            <Input
              label="Full Name"
              placeholder="e.g. Aarav Mehta"
              value={name}
              onChangeText={setName}
              leftIcon={<User size={18} color="#94A3B8" />}
            />

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
              label="Mobile Number"
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              leftIcon={<Phone size={18} color="#94A3B8" />}
            />

            <Input
              label="Password"
              placeholder="At least 8 characters"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              leftIcon={<Lock size={18} color="#94A3B8" />}
            />
          </View>
        </View>

        <View style={{ gap: 16, paddingTop: 24 }}>
          <Button
            title="Create Account & Verify OTP"
            onPress={handleSignup}
            loading={loading}
            variant="teal"
            size="lg"
          />

          <View className="flex-row justify-center items-center">
            <Text className="text-sm text-slate-500">Already registered? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text className="text-sm font-bold text-[#1E58C8]">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
