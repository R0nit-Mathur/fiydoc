export type PaymentMethodType = 'UPI' | 'CARD' | 'NETBANKING' | 'PAY_AT_CLINIC';

export interface PaymentRequest {
  appointmentId?: string;
  doctorId: string;
  doctorName: string;
  clinicName: string;
  consultationFee: number;
  date: string;
  timeSlot: string;
  paymentMethod: PaymentMethodType;
  paymentDetails?: {
    upiApp?: 'gpay' | 'phonepe' | 'paytm' | 'bhim' | 'other';
    upiId?: string;
    cardNumber?: string;
    cardExpiry?: string;
    bankName?: string;
  };
}

export interface PaymentInvoice {
  invoiceNumber: string;
  transactionId: string;
  appointmentId: string;
  doctorFee: number;
  platformFee: number;
  gstAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethodType;
  paymentStatus: 'PAID' | 'PAY_AT_CLINIC';
  paidAt: string;
  clinicTokenNumber: string;
}

export const paymentService = {
  calculateBill(consultationFee: number) {
    const platformFee = 49;
    const gstAmount = Math.round(platformFee * 0.18 * 100) / 100; // 18% GST on platform fee = ₹8.82
    const totalAmount = consultationFee + platformFee + gstAmount;

    return {
      consultationFee,
      platformFee,
      gstAmount,
      totalAmount,
      doctorGstExempt: true, // Healthcare consultations are exempt from GST under Indian Law
    };
  },

  async processPayment(req: PaymentRequest): Promise<PaymentInvoice> {
    // Simulate payment gateway delay (e.g. Razorpay / Cashfree / UPI Intent)
    await new Promise((resolve) => setTimeout(resolve, 800));

    const bill = this.calculateBill(req.consultationFee);
    const isPayAtClinic = req.paymentMethod === 'PAY_AT_CLINIC';
    const txnId = isPayAtClinic
      ? `FYD-OFFLINE-${Date.now().toString().slice(-6)}`
      : `TXN_FYD_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const invoice: PaymentInvoice = {
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      transactionId: txnId,
      appointmentId: req.appointmentId || `apt_${Date.now()}`,
      doctorFee: bill.consultationFee,
      platformFee: bill.platformFee,
      gstAmount: bill.gstAmount,
      totalAmount: isPayAtClinic ? bill.consultationFee : bill.totalAmount,
      paymentMethod: req.paymentMethod,
      paymentStatus: isPayAtClinic ? 'PAY_AT_CLINIC' : 'PAID',
      paidAt: new Date().toISOString(),
      clinicTokenNumber: `Token #${Math.floor(10 + Math.random() * 20)}`,
    };

    return invoice;
  },

  validateUpiId(upiId: string): boolean {
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    return upiRegex.test(upiId.trim());
  },
};
