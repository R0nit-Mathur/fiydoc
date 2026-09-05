import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Heart, Activity, AlertCircle, ShieldCheck } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';

export default function PatientSetupScreen() {
  const router = useRouter();
  const { setOnboardingCompleted } = useAuthStore();

  const [age, setAge] = useState('32');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('Penicillin, Dust Mites');
  const [emergencyContact, setEmergencyContact] = useState('+91 98765 12345');

  const handleFinish = () => {
    setOnboardingCompleted(true);
    router.replace('/(patient)/(tabs)/home');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerClassName="px-6 py-4 flex-grow justify-between">
        <View>
          <View className="flex-row items-center justify-between mb-2">
            <View className="bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
              <Text className="text-xs font-bold text-[#00B39B]">Step 2 of 2: Health Profile</Text>
            </View>
          </View>

          <Text className="text-2xl font-black text-slate-900 mt-2">Personalize Your Health Care</Text>
          <Text className="text-sm text-slate-500 mt-1 mb-6">
            Help doctors review your basic vitals and allergy warnings before your consultation.
          </Text>

          <View className="space-y-4">
            <View className="flex-row space-x-3">
              <View className="flex-1">
                <Input
                  label="Age"
                  placeholder="32"
                  keyboardType="number-pad"
                  value={age}
                  onChangeText={setAge}
                />
              </View>

              <View className="flex-1">
                <Input
                  label="Blood Group"
                  placeholder="O+"
                  value={bloodGroup}
                  onChangeText={setBloodGroup}
                />
              </View>
            </View>

            <View>
              <Text className="text-sm font-semibold text-slate-700 mb-2">Gender</Text>
              <View className="flex-row space-x-2">
                {(['Male', 'Female', 'Other'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGender(g)}
                    className={`flex-1 py-2.5 rounded-xl border text-center items-center ${
                      gender === g ? 'bg-teal-50 border-[#00B39B]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${gender === g ? 'text-[#00B39B]' : 'text-slate-700'}`}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Input
              label="Known Allergies & Medical Conditions"
              placeholder="e.g. Penicillin, Asthma, Diabetes"
              value={allergies}
              onChangeText={setAllergies}
              leftIcon={<AlertCircle size={18} color="#94A3B8" />}
            />

            <Input
              label="Emergency Contact Number"
              placeholder="+91 98765 12345"
              keyboardType="phone-pad"
              value={emergencyContact}
              onChangeText={setEmergencyContact}
              leftIcon={<Activity size={18} color="#94A3B8" />}
            />
          </View>
        </View>

        <View className="pt-6 pb-4">
          <Button
            title="Complete Setup & Enter Dashboard"
            onPress={handleFinish}
            variant="teal"
            size="lg"
            icon={<ShieldCheck size={20} color="#FFFFFF" />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
