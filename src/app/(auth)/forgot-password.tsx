import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FiYLogo } from '@/components/ui/FiYLogo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { authService } from '@/services/authService';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentMessage, setSentMessage] = useState('');

  const handleReset = async () => {
    if (!email) return;
    try {
      setLoading(true);
      const res = await authService.requestPasswordReset(email);
      setSentMessage(res.message);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6 py-4 justify-between">
      <View>
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mb-4 self-start">
          <ArrowLeft size={24} color="#0F172A" />
        </TouchableOpacity>

        <FiYLogo size="lg" />
        <Text className="text-2xl font-black text-slate-900 mt-4">Reset Password</Text>
        <Text className="text-sm text-slate-500 mt-1 mb-6">
          Enter your registered email address and we will send you a password recovery link.
        </Text>

        {sentMessage ? (
          <View className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex-row items-center space-x-3 mb-6">
            <CheckCircle2 size={24} color="#10B981" />
            <Text className="text-xs font-bold text-emerald-800 flex-1">{sentMessage}</Text>
          </View>
        ) : (
          <Input
            label="Email Address"
            placeholder="name@example.com"
            value={email}
            onChangeText={setEmail}
            leftIcon={<Mail size={18} color="#94A3B8" />}
          />
        )}
      </View>

      <View className="pb-4">
        {sentMessage ? (
          <Button
            title="Back to Sign In"
            onPress={() => router.replace('/(auth)/login')}
            variant="primary"
            size="lg"
          />
        ) : (
          <Button
            title="Send Reset Instructions"
            onPress={handleReset}
            loading={loading}
            variant="teal"
            size="lg"
          />
        )}
      </View>
    </SafeAreaView>
  );
}
