import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Bell, Lock, CreditCard, ShieldCheck, CheckCircle2, ChevronRight, Save } from 'lucide-react-native';

export default function DoctorSettingsScreen() {
  const router = useRouter();

  const [pushNotifs, setPushNotifs] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [autoConfirm, setAutoConfirm] = useState(false);
  const [bankAccount, setBankAccount] = useState('HDFC Bank •••• 8849');
  const [ifsc, setIfsc] = useState('HDFC0001234');
  const [saved, setSaved] = useState(false);

  const handleSafeBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(doctor)/home');
    }
  };

  useEffect(() => {
    const backAction = () => {
      handleSafeBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SafeAreaView className="flex-1 bg-white justify-between" edges={['top']}>
      <View>
        <View className="px-4 py-3 flex-row items-center justify-between border-b border-slate-100 shadow-xs">
          <TouchableOpacity onPress={handleSafeBack} activeOpacity={0.7} className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center -ml-1">
            <ArrowLeft size={18} color="#0F172A" />
          </TouchableOpacity>
          <Text className="text-base font-extrabold text-slate-900">Doctor Practice Settings</Text>
          <View className="w-9" />
        </View>

        <ScrollView contentContainerClassName="p-5 space-y-5">
          {saved && (
            <View className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 flex-row items-center space-x-2">
              <CheckCircle2 size={18} color="#10B981" />
              <Text className="text-xs font-bold text-emerald-800">Practice preferences saved!</Text>
            </View>
          )}

          {/* Consultation Rules */}
          <View className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-3">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Consultation & Queue Rules
            </Text>

            <View className="flex-row justify-between items-center">
              <Text className="text-sm font-bold text-slate-900">Auto-Approve Patient Bookings</Text>
              <Switch value={autoConfirm} onValueChange={setAutoConfirm} trackColor={{ true: '#1E58C8' }} />
            </View>

            <View className="flex-row justify-between items-center pt-2 border-t border-slate-200">
              <Text className="text-sm font-bold text-slate-900">Push Notifications for Queue</Text>
              <Switch value={pushNotifs} onValueChange={setPushNotifs} trackColor={{ true: '#00B39B' }} />
            </View>
          </View>

          {/* Payout & Banking */}
          <View className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-3">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Fee Payout Account
            </Text>
            <Input label="Bank Account / UPI VPA" value={bankAccount} onChangeText={setBankAccount} />
            <Input label="IFSC Code" value={ifsc} onChangeText={setIfsc} />
          </View>
        </ScrollView>
      </View>

      <View className="p-4 bg-white border-t border-slate-100">
        <Button
          title="Save Settings"
          onPress={handleSave}
          variant="primary"
          size="lg"
          icon={<Save size={20} color="#FFFFFF" />}
        />
      </View>
    </SafeAreaView>
  );
}
