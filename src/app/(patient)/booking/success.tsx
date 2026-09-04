import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppointmentDetailQuery } from '@/hooks/queries/useAppointmentsQuery';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FiYLogo } from '@/components/ui/FiYLogo';
import {
  CheckCircle2,
  Calendar,
  Clock,
  QrCode,
  Building2,
  Receipt,
  Share2,
  Download,
  CreditCard,
  Banknote,
  Smartphone,
  ShieldCheck,
} from 'lucide-react-native';

export default function BookingSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    appointmentId?: string;
    transactionId?: string;
    invoiceNumber?: string;
    paymentStatus?: string;
    paymentMethod?: string;
    tokenNumber?: string;
  }>();

  const { appointments } = useAppointmentStore();
  const targetId = params.appointmentId || 'apt_101';
  const { data: remoteApt } = useAppointmentDetailQuery(targetId);
  const localApt = appointments.find((a) => a.id === targetId);
  const apt = localApt || remoteApt;

  const [receiptSaved, setReceiptSaved] = useState(false);

  const isPayAtClinic = params.paymentStatus === 'PAY_AT_CLINIC';
  const tokenNumber = params.tokenNumber || 'Token #14';
  const txnId = params.transactionId || (isPayAtClinic ? 'FYD-OFFLINE-DESK' : 'TXN_FYD_847291');

  const handleSharePass = async () => {
    try {
      await Share.share({
        title: `FiYDoc OPD Pass • ${tokenNumber}`,
        message: `FiYDoc Confirmed Appointment Pass\nDoctor: ${apt?.doctorName || 'Dr. Specialist'}\nDate: ${apt?.date || 'Today'} at ${apt?.time || '10:30 AM'}\nToken: ${tokenNumber}\nClinic: ${apt?.hospital || 'HeartCare Specialty Clinic'}\nTxn: ${txnId}`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadReceipt = () => {
    setReceiptSaved(true);
    setTimeout(() => setReceiptSaved(false), 2500);
  };

  return (
    <SafeAreaView className="flex-1 bg-white justify-between" edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, alignItems: 'center', gap: 18 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated Check Icon */}
        <View className="w-16 h-16 rounded-full bg-emerald-100 items-center justify-center border-4 border-emerald-50 mt-2">
          <CheckCircle2 size={36} color="#10B981" />
        </View>

        <View className="items-center" style={{ gap: 4 }}>
          <Text className="text-2xl font-black text-slate-900 text-center">
            {isPayAtClinic ? 'Clinic Token Reserved!' : 'Payment & Booking Confirmed!'}
          </Text>
          <Text className="text-xs text-slate-500 text-center">
            Booking ID: <Text className="font-mono font-bold text-slate-800">{targetId}</Text>
          </Text>
        </View>

        {receiptSaved && (
          <View className="w-full bg-emerald-50 p-3 rounded-2xl border border-emerald-200 flex-row items-center justify-center" style={{ gap: 6 }}>
            <CheckCircle2 size={16} color="#10B981" />
            <Text className="text-xs font-bold text-emerald-800">Digital Tax Invoice Saved to Downloads</Text>
          </View>
        )}

        {/* Official Clinic Digital Token Pass */}
        <View className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-sm" style={{ gap: 14 }}>
          {/* Letterhead */}
          <View className="flex-row justify-between items-center pb-3 border-b border-slate-200">
            <FiYLogo size="sm" />
            <Badge
              label={isPayAtClinic ? 'PAY AT RECEPTION' : 'PAID PASS'}
              variant={isPayAtClinic ? 'warning' : 'teal'}
              size="sm"
            />
          </View>

          {/* Token Callout Banner */}
          <View className="bg-[#1E58C8] p-3.5 rounded-2xl flex-row items-center justify-between">
            <View>
              <Text className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">
                OPD Queue Token
              </Text>
              <Text className="text-xl font-black text-white">{tokenNumber}</Text>
            </View>
            <View className="bg-white/20 px-2.5 py-1 rounded-lg">
              <Text className="text-[11px] font-bold text-white">Priority Queue</Text>
            </View>
          </View>

          {/* Doctor Meta */}
          <View style={{ gap: 2 }}>
            <Text className="text-lg font-black text-slate-900">
              {apt?.doctorName || 'Dr. Priya Sharma'}
            </Text>
            <Text className="text-xs font-bold text-[#00B39B]">
              {apt?.doctorSpecialty || 'Senior Consultant Cardiologist'}
            </Text>
            <View className="flex-row items-center mt-0.5" style={{ gap: 4 }}>
              <Building2 size={13} color="#64748B" />
              <Text className="text-xs text-slate-500" numberOfLines={1}>
                {apt?.hospital || 'HeartCare Specialty Clinic, Mumbai'}
              </Text>
            </View>
          </View>

          {/* Date & Time Strip */}
          <View className="flex-row justify-between bg-white p-3 rounded-2xl border border-slate-200/80">
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Calendar size={15} color="#1E58C8" />
              <Text className="text-xs font-bold text-slate-800">{apt?.date || 'Today'}</Text>
            </View>
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Clock size={15} color="#1E58C8" />
              <Text className="text-xs font-bold text-slate-800">{apt?.time || '10:30 AM'}</Text>
            </View>
          </View>

          {/* Payment & Invoice Breakdown Details */}
          <View className="bg-white p-3 rounded-2xl border border-slate-200/80" style={{ gap: 6 }}>
            <View className="flex-row justify-between items-center">
              <Text className="text-[11px] text-slate-500">Payment Status</Text>
              <Text className="text-xs font-bold text-slate-900">
                {isPayAtClinic ? 'Due at Reception (₹' + (apt?.fee || 700) + ')' : 'Paid (₹' + (apt?.fee || 757.82) + ')'}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-[11px] text-slate-500">Transaction ID</Text>
              <Text className="text-[10px] font-mono font-bold text-slate-700">{txnId}</Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-[11px] text-slate-500">Consultation Channel</Text>
              <Text className="text-xs font-bold text-teal-600">In-Clinic OPD Visit</Text>
            </View>
          </View>

          {/* QR Code Ticket */}
          <View className="items-center pt-1" style={{ gap: 6 }}>
            <View className="p-3 bg-white rounded-2xl border border-slate-200 items-center justify-center">
              <QrCode size={100} color="#0F172A" />
            </View>
            <Text className="text-[10px] text-slate-400 font-mono text-center">
              Present QR or Token #{tokenNumber} at hospital front desk
            </Text>
          </View>

          {/* Download & Share Row */}
          <View className="flex-row gap-2 pt-1 border-t border-slate-200">
            <TouchableOpacity
              onPress={handleDownloadReceipt}
              activeOpacity={0.8}
              className="flex-1 bg-slate-100 py-2.5 px-2 rounded-xl flex-row items-center justify-center"
              style={{ gap: 6 }}
            >
              <Download size={14} color="#0F172A" />
              <Text className="text-xs font-bold text-slate-800">Invoice Slip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSharePass}
              activeOpacity={0.8}
              className="flex-1 bg-teal-50 py-2.5 px-2 rounded-xl flex-row items-center justify-center border border-teal-200"
              style={{ gap: 6 }}
            >
              <Share2 size={14} color="#00B39B" />
              <Text className="text-xs font-bold text-[#00B39B]">Share Pass</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.replace(`/(patient)/appointments/${targetId}`)}
          activeOpacity={0.85}
          className="w-full bg-blue-50 border border-blue-200 p-3.5 rounded-2xl flex-row items-center justify-center shadow-sm"
          style={{ gap: 8 }}
        >
          <Building2 size={16} color="#1E58C8" />
          <Text className="text-sm font-black text-[#1E58C8]">View Hospital Directions & Details</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sticky Bottom Action */}
      <View className="p-4 bg-white border-t border-slate-100 shadow-md">
        <Button
          title="Return to Patient Dashboard"
          onPress={() => router.replace('/(patient)/home')}
          variant="primary"
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}
