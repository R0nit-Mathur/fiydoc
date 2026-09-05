import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { paymentService, PaymentMethodType } from '@/services/paymentService';
import { appointmentService } from '@/services/appointmentService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  Lock,
  Wallet,
  Smartphone,
  Banknote,
  Receipt,
  AlertCircle,
} from 'lucide-react-native';

const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', iconBg: '#E8F0FE', color: '#1A73E8' },
  { id: 'phonepe', name: 'PhonePe', iconBg: '#F3E8FD', color: '#5F259F' },
  { id: 'paytm', name: 'Paytm UPI', iconBg: '#E0F2FE', color: '#00BAF2' },
  { id: 'bhim', name: 'BHIM UPI', iconBg: '#FEF3C7', color: '#D97706' },
];

const POPULAR_BANKS = [
  'State Bank of India (SBI)',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank (PNB)',
];

export default function BookingPaymentScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { bookingDraft, addAppointment, resetBookingDraft } = useAppointmentStore();
  const { addNotification } = useNotificationStore();

  const doctor = bookingDraft.doctor;
  const fee = doctor?.consultationFee || 700;
  const bill = paymentService.calculateBill(fee);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('UPI');
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>('gpay');
  const [upiId, setUpiId] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvv, setCardCvv] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<string>(POPULAR_BANKS[0]);
  const [processing, setProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const isPayAtClinic = paymentMethod === 'PAY_AT_CLINIC';
  const totalPayable = isPayAtClinic ? bill.consultationFee : bill.totalAmount;

  const handleProcessPayment = async () => {
    setErrorMsg('');

    // Method-specific input validation
    if (paymentMethod === 'UPI' && selectedUpiApp === 'custom') {
      if (!paymentService.validateUpiId(upiId)) {
        setErrorMsg('Please enter a valid UPI ID (e.g. yourname@okhdfcbank or 9876543210@paytm).');
        return;
      }
    } else if (paymentMethod === 'CARD') {
      const cleanCard = cardNumber.replace(/\s+/g, '');
      if (cleanCard.length < 15) {
        setErrorMsg('Please enter a valid 16-digit debit or credit card number.');
        return;
      }
      if (!cardExpiry.includes('/') || cardExpiry.length < 5) {
        setErrorMsg('Please enter a valid card expiry date (MM/YY).');
        return;
      }
      if (cardCvv.length < 3) {
        setErrorMsg('Please enter a valid 3-digit CVV.');
        return;
      }
    }

    const targetDoctorId = doctor?.id || 'doc_live';
    const targetDate = bookingDraft.date || new Date().toISOString().split('T')[0];
    const targetTimeSlot = bookingDraft.timeSlot || '10:30 AM';

    // Real-time concurrency check to prevent double booking
    if (useAppointmentStore.getState().isSlotBooked(targetDoctorId, targetDate, targetTimeSlot)) {
      setErrorMsg('This slot was just booked by another patient. Please go back and pick an available time.');
      return;
    }

    try {
      setProcessing(true);

      const invoice = await paymentService.processPayment({
        doctorId: targetDoctorId,
        doctorName: doctor?.name || 'Dr. Specialist',
        clinicName: doctor?.hospital || 'FiYDoc Medical Clinic',
        consultationFee: fee,
        date: bookingDraft.date || new Date().toISOString().split('T')[0],
        timeSlot: bookingDraft.timeSlot || '10:30 AM',
        paymentMethod,
        paymentDetails: {
          upiApp: selectedUpiApp as any,
          upiId: selectedUpiApp === 'custom' ? upiId : `${selectedUpiApp}@fiydoc`,
          cardNumber: cardNumber ? `•••• ${cardNumber.slice(-4)}` : undefined,
          bankName: selectedBank,
        },
      });

      // Save appointment locally and to backend
      const newAppointment = {
        id: invoice.appointmentId,
        patientId: user?.id || 'pat_live',
        patientName: user?.name || 'Patient',
        patientAvatar: user?.avatar,
        doctorId: doctor?.id || 'doc_live',
        doctorName: doctor?.name || 'Consultant Doctor',
        doctorSpecialty: doctor?.specialty || 'General OPD',
        doctorAvatar: doctor?.avatar || '',
        hospital: doctor?.hospital || doctor?.clinic?.name || 'Clinical Practice',
        date: bookingDraft.date || new Date().toISOString().split('T')[0],
        time: bookingDraft.timeSlot || '10:30 AM',
        status: 'confirmed' as const,
        mode: 'clinic' as const,
        fee: totalPayable,
        paymentStatus: invoice.paymentStatus,
        symptoms: bookingDraft.symptoms,
        notes: bookingDraft.patientNotes,
      };

      addAppointment(newAppointment);

      // 1. Patient Notification
      addNotification({
        recipientId: user?.id || 'pat_1',
        recipientRole: 'patient',
        title: isPayAtClinic
          ? `Appointment Booked • ${invoice.clinicTokenNumber}`
          : `Payment Successful (₹${totalPayable}) • ${invoice.clinicTokenNumber}`,
        message: isPayAtClinic
          ? `Slot reserved with ${doctor?.name || 'Doctor'}. Please pay ₹${fee} at clinic reception upon arrival.`
          : `Txn #${invoice.transactionId}. Consultation with ${doctor?.name || 'Doctor'} confirmed for ${newAppointment.date} at ${newAppointment.time}.`,
        type: 'appointment',
        link: `/(patient)/appointments/${newAppointment.id}`,
      });

      // 2. Doctor Notification (Instant Alert for New Patient Booking)
      addNotification({
        recipientId: doctor?.id || 'doc_live',
        recipientRole: 'doctor',
        title: `New Appointment • ${invoice.clinicTokenNumber}`,
        message: `Patient ${user?.name || 'Patient'} booked for ${newAppointment.date} at ${newAppointment.time}. Chief complaint: ${bookingDraft.symptoms.join(', ') || 'Consultation'}.`,
        type: 'appointment',
        link: `/(doctor)/(tabs)/appointments`,
      });

      resetBookingDraft();

      // Navigate to success pass
      router.replace({
        pathname: '/(patient)/booking/success',
        params: {
          appointmentId: newAppointment.id,
          transactionId: invoice.transactionId,
          invoiceNumber: invoice.invoiceNumber,
          paymentStatus: invoice.paymentStatus,
          paymentMethod,
          tokenNumber: invoice.clinicTokenNumber,
        },
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Payment processing encountered an issue. Please retry.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header Bar */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#FFFFFF',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: '#F1F5F9',
        }}
      >
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} className="p-1 -ml-1">
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>
          Secure Checkout & Payment
        </Text>
        <View className="bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex-row items-center" style={{ gap: 4 }}>
          <Lock size={11} color="#10B981" />
          <Text className="text-[10px] font-bold text-emerald-700">256-BIT SSL</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Doctor & Slot Overview Card */}
        <View className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm" style={{ gap: 10 }}>
          <View className="flex-row justify-between items-start">
            <View className="flex-1 mr-2">
              <Text className="text-base font-black text-slate-900" numberOfLines={1}>
                {doctor?.name || 'Dr. Specialist'}
              </Text>
              <Text className="text-xs font-bold text-[#00B39B] mt-0.5" numberOfLines={1}>
                {doctor?.specialty || 'Consultant Specialist'}
              </Text>
              <Text className="text-[11px] text-slate-500 mt-0.5" numberOfLines={1}>
                {doctor?.hospital || 'FiYDoc Healthcare Clinic'}
              </Text>
            </View>
            <Badge label="IN-CLINIC OPD" variant="blue" size="sm" />
          </View>

          <View className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex-row justify-between items-center">
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Calendar size={15} color="#1E58C8" />
              <Text className="text-xs font-bold text-slate-800">
                {bookingDraft.date || 'Today'}
              </Text>
            </View>
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Clock size={15} color="#1E58C8" />
              <Text className="text-xs font-bold text-slate-800">
                {bookingDraft.timeSlot || '10:30 AM'}
              </Text>
            </View>
          </View>
        </View>

        {/* Error Notice */}
        {errorMsg ? (
          <View className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200 flex-row items-center" style={{ gap: 8 }}>
            <AlertCircle size={18} color="#E11D48" />
            <Text className="text-xs font-bold text-rose-800 flex-1">{errorMsg}</Text>
          </View>
        ) : null}

        {/* Select Payment Method */}
        <View style={{ gap: 10 }}>
          <Text className="text-sm font-black text-slate-900">Select Payment Method</Text>

          {/* Payment Method Selector Tabs */}
          <View className="flex-row gap-2">
            {[
              { id: 'UPI', label: 'UPI / QR', icon: <Smartphone size={16} /> },
              { id: 'CARD', label: 'Card', icon: <CreditCard size={16} /> },
              { id: 'NETBANKING', label: 'NetBanking', icon: <Building2 size={16} /> },
              { id: 'PAY_AT_CLINIC', label: 'Pay at Clinic', icon: <Banknote size={16} /> },
            ].map((tab) => {
              const active = paymentMethod === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => {
                    setPaymentMethod(tab.id as PaymentMethodType);
                    setErrorMsg('');
                  }}
                  activeOpacity={0.8}
                  className={`flex-1 py-2.5 px-1 rounded-2xl border items-center justify-center ${
                    active
                      ? 'bg-[#1E58C8] border-[#1E58C8] shadow-sm'
                      : 'bg-white border-slate-200'
                  }`}
                  style={{ gap: 4 }}
                >
                  {React.cloneElement(tab.icon, {
                    color: active ? '#FFFFFF' : '#64748B',
                  })}
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '800',
                      color: active ? '#FFFFFF' : '#334155',
                      textAlign: 'center',
                    }}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Payment Tab Content */}
          <View className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm" style={{ gap: 14 }}>
            {/* 1. UPI Tab */}
            {paymentMethod === 'UPI' && (
              <View style={{ gap: 14 }}>
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Instant UPI Payment Apps (Zero Convenience Fee)
                </Text>

                <View className="flex-row flex-wrap gap-2">
                  {UPI_APPS.map((app) => {
                    const selected = selectedUpiApp === app.id;
                    return (
                      <TouchableOpacity
                        key={app.id}
                        onPress={() => setSelectedUpiApp(app.id)}
                        activeOpacity={0.85}
                        className={`flex-1 min-w-[130px] p-3 rounded-2xl border flex-row items-center justify-between ${
                          selected
                            ? 'bg-blue-50/90 border-[#1E58C8]'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <View className="flex-row items-center" style={{ gap: 8 }}>
                          <View
                            className="w-7 h-7 rounded-xl items-center justify-center"
                            style={{ backgroundColor: app.iconBg }}
                          >
                            <Smartphone size={15} color={app.color} />
                          </View>
                          <Text className="text-xs font-black text-slate-900">{app.name}</Text>
                        </View>
                        {selected && <CheckCircle2 size={16} color="#1E58C8" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Custom VPA Option */}
                <TouchableOpacity
                  onPress={() => setSelectedUpiApp('custom')}
                  activeOpacity={0.85}
                  className={`p-3 rounded-2xl border flex-row items-center justify-between ${
                    selectedUpiApp === 'custom'
                      ? 'bg-blue-50/90 border-[#1E58C8]'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <View className="flex-row items-center" style={{ gap: 8 }}>
                    <Wallet size={16} color="#1E58C8" />
                    <Text className="text-xs font-bold text-slate-800">
                      Pay via Custom UPI ID / VPA
                    </Text>
                  </View>
                  {selectedUpiApp === 'custom' && <CheckCircle2 size={16} color="#1E58C8" />}
                </TouchableOpacity>

                {selectedUpiApp === 'custom' && (
                  <View style={{ gap: 6 }}>
                    <Input
                      label="Enter Your UPI ID / VPA"
                      placeholder="e.g. mobile@upi or name@okhdfcbank"
                      value={upiId}
                      onChangeText={setUpiId}
                      autoCapitalize="none"
                    />
                    <Text className="text-[10px] text-slate-400">
                      A payment request will be sent to your UPI app for approval.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* 2. CARD Tab */}
            {paymentMethod === 'CARD' && (
              <View style={{ gap: 12 }}>
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Debit / Credit Card (RuPay, Visa, Mastercard)
                </Text>

                <Input
                  label="Card Number"
                  placeholder="4532 0012 3456 7890"
                  value={cardNumber}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/\D/g, '').slice(0, 16);
                    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
                    setCardNumber(formatted);
                  }}
                  keyboardType="numeric"
                />

                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Input
                      label="Expiry Date"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChangeText={(text) => {
                        const cleaned = text.replace(/\D/g, '').slice(0, 4);
                        if (cleaned.length >= 3) {
                          setCardExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
                        } else {
                          setCardExpiry(cleaned);
                        }
                      }}
                      keyboardType="numeric"
                    />
                  </View>
                  <View className="flex-1">
                    <Input
                      label="CVV"
                      placeholder="123"
                      value={cardCvv}
                      onChangeText={(text) => setCardCvv(text.replace(/\D/g, '').slice(0, 4))}
                      keyboardType="numeric"
                      secureTextEntry
                    />
                  </View>
                </View>

                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <ShieldCheck size={14} color="#10B981" />
                  <Text className="text-[11px] text-slate-500 font-medium">
                    Card details tokenized as per RBI compliance guidelines.
                  </Text>
                </View>
              </View>
            )}

            {/* 3. NETBANKING Tab */}
            {paymentMethod === 'NETBANKING' && (
              <View style={{ gap: 10 }}>
                <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Select Popular Bank
                </Text>

                <View style={{ gap: 8 }}>
                  {POPULAR_BANKS.map((bank) => {
                    const active = selectedBank === bank;
                    return (
                      <TouchableOpacity
                        key={bank}
                        onPress={() => setSelectedBank(bank)}
                        activeOpacity={0.8}
                        className={`p-3 rounded-2xl border flex-row items-center justify-between ${
                          active
                            ? 'bg-blue-50/90 border-[#1E58C8]'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: active ? '800' : '600',
                            color: active ? '#1E58C8' : '#334155',
                          }}
                        >
                          {bank}
                        </Text>
                        {active && <CheckCircle2 size={16} color="#1E58C8" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* 4. PAY AT CLINIC Tab */}
            {paymentMethod === 'PAY_AT_CLINIC' && (
              <View className="bg-amber-50 p-4 rounded-2xl border border-amber-200" style={{ gap: 8 }}>
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <Banknote size={18} color="#D97706" />
                  <Text className="text-xs font-black text-amber-900 uppercase tracking-wider">
                    Pay at Hospital / Clinic Reception
                  </Text>
                </View>
                <Text className="text-xs text-amber-800 leading-5">
                  No advance online payment required! Your consultation token is instantly reserved.
                  You can pay ₹{bill.consultationFee} via Cash, UPI, or Card at the clinic counter
                  before seeing the doctor.
                </Text>
                <View className="bg-white/80 p-2.5 rounded-xl border border-amber-200 flex-row items-center" style={{ gap: 6 }}>
                  <CheckCircle2 size={14} color="#D97706" />
                  <Text className="text-[11px] font-bold text-amber-900">
                    Platform fee waived for direct clinic desk payments.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Itemized Indian Tax Bill */}
        <View className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm" style={{ gap: 10 }}>
          <View className="flex-row items-center justify-between pb-2 border-b border-slate-100">
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Receipt size={16} color="#0F172A" />
              <Text className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Itemized Medical Bill
              </Text>
            </View>
            <Text className="text-[10px] font-bold text-slate-400">GST INVOICE</Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-xs text-slate-600">Doctor Consultation OPD Fee</Text>
            <Text className="text-xs font-bold text-slate-900">₹{bill.consultationFee}</Text>
          </View>

          <View className="flex-row justify-between">
            <View>
              <Text className="text-xs text-slate-600">Healthcare Service Tax (GST)</Text>
              <Text className="text-[10px] text-emerald-600 font-semibold">Exempt under Notif. 12/2017</Text>
            </View>
            <Text className="text-xs font-bold text-emerald-600">₹0.00</Text>
          </View>

          {!isPayAtClinic && (
            <>
              <View className="flex-row justify-between">
                <Text className="text-xs text-slate-600">Clinic Digital Token & System Fee</Text>
                <Text className="text-xs font-bold text-slate-900">₹{bill.platformFee}</Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-xs text-slate-600">18% GST on Token Fee</Text>
                <Text className="text-xs font-bold text-slate-900">₹{bill.gstAmount}</Text>
              </View>
            </>
          )}

          <View className="pt-2 border-t border-slate-100 flex-row justify-between items-center">
            <View>
              <Text className="text-sm font-black text-slate-900">
                {isPayAtClinic ? 'Payable at Clinic Reception' : 'Total Amount Payable'}
              </Text>
              <Text className="text-[10px] text-slate-400">Inclusive of all applicable Indian taxes</Text>
            </View>
            <Text className="text-xl font-black text-[#1E58C8]">₹{totalPayable}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#FFFFFF',
          padding: 16,
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
          elevation: 5,
        }}
      >
        <Button
          title={
            processing
              ? 'Securing Payment...'
              : isPayAtClinic
              ? `Confirm Slot (Pay ₹${totalPayable} at Clinic)`
              : `Pay ₹${totalPayable} via ${paymentMethod}`
          }
          onPress={handleProcessPayment}
          loading={processing}
          variant="primary"
          size="lg"
          icon={<ShieldCheck size={20} color="#FFFFFF" />}
        />
      </View>
    </SafeAreaView>
  );
}
