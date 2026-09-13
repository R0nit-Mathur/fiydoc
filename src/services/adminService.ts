import { apiClient } from './apiClient';

export interface AdminStats {
  totalUsers: number;
  totalDoctors: number;
  verifiedDoctors: number;
  pendingDoctors: number;
  pendingVerifications?: number;
  totalAppointments: number;
  todayAppointments: number;
  recentAudits: number;
}

export interface AdminDoctorItem {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  specialization: string;
  qualification: string;
  experienceYears?: number;
  profilePhoto?: string;
  verificationStatus: string;
  verificationId?: string;
  verificationSubmittedAt?: string;
  registrationNumber?: string;
  medicalCouncil?: string;
  registrationYear?: number;
  certificateUrl?: string;
  idProofUrl?: string;
  clinicName?: string;
  clinicCity?: string;
  createdAt: string;
}

export interface ReviewActionPayload {
  doctorId: string;
  verificationId?: string;
  action: 'APPROVE' | 'REJECT' | 'REQUEST_INFO' | 'SUSPEND';
  rejectionReason?: string;
  notes?: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId?: string;
  details?: any;
  createdAt: string;
}

export const adminService = {
  async getStats(): Promise<AdminStats> {
    const res = await apiClient<any>('/admin/stats');
    return {
      totalUsers: res.totalUsers ?? 0,
      totalDoctors: res.totalDoctors ?? 0,
      verifiedDoctors: res.verifiedDoctors ?? 0,
      pendingDoctors: res.pendingDoctors ?? res.pendingVerifications ?? 0,
      pendingVerifications: res.pendingVerifications ?? res.pendingDoctors ?? 0,
      totalAppointments: res.totalAppointments ?? 0,
      todayAppointments: res.todayAppointments ?? 0,
      recentAudits: res.recentAudits ?? 0,
    };
  },

  async getDoctors(params?: { status?: string; search?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset) query.append('offset', String(params.offset));
    const qs = query.toString();
    const res = await apiClient<any>(`/admin/doctors${qs ? `?${qs}` : ''}`);
    const rawList: any[] = Array.isArray(res) ? res : Array.isArray(res?.doctors) ? res.doctors : [];

    const doctors: AdminDoctorItem[] = rawList.map((doc: any) => ({
      id: doc.id,
      fullName: doc.fullName || 'Doctor',
      email: doc.user?.email || doc.email || '',
      phone: doc.user?.phone || doc.phone || '',
      specialization: doc.specialization || 'General Medicine',
      qualification: doc.qualification || (Array.isArray(doc.qualifications) && doc.qualifications[0]?.degree) || 'MBBS',
      experienceYears: doc.experienceYears || 0,
      profilePhoto: doc.profilePhoto || undefined,
      verificationStatus: doc.verification?.status || doc.verificationStatus || 'PENDING',
      verificationId: doc.verification?.id || doc.verificationId,
      verificationSubmittedAt: doc.verification?.createdAt || doc.verificationSubmittedAt,
      registrationNumber: doc.verification?.registrationNumber || doc.registrationNumber,
      medicalCouncil: doc.verification?.registrationAuthority || doc.medicalCouncil || 'NMC',
      registrationYear: doc.verification?.registrationYear,
      certificateUrl: (Array.isArray(doc.verification?.submittedDocuments) && doc.verification?.submittedDocuments[0]) || doc.certificateUrl,
      idProofUrl: (Array.isArray(doc.verification?.submittedDocuments) && doc.verification?.submittedDocuments[1]) || doc.idProofUrl,
      clinicName: doc.clinic?.name || doc.clinicName,
      clinicCity: doc.clinic?.address || doc.clinicCity,
      createdAt: doc.user?.createdAt || doc.createdAt || new Date().toISOString(),
    }));

    return {
      doctors,
      total: typeof res?.total === 'number' ? res.total : doctors.length,
    };
  },

  async getDoctorDetail(id: string) {
    return apiClient<any>(`/admin/doctors/${id}`);
  },

  async getVerifications(params?: { status?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset) query.append('offset', String(params.offset));
    const qs = query.toString();
    const res = await apiClient<any>(`/admin/verifications${qs ? `?${qs}` : ''}`);
    const rawList: any[] = Array.isArray(res) ? res : Array.isArray(res?.verifications) ? res.verifications : [];
    return { verifications: rawList, total: rawList.length };
  },

  async reviewVerification(payload: ReviewActionPayload) {
    return apiClient<any>('/admin/verifications/review', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        verificationId: payload.verificationId,
        doctorId: payload.doctorId,
      }),
    });
  },

  async getAuditLogs(params?: { limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset) query.append('offset', String(params.offset));
    const qs = query.toString();
    return apiClient<{ logs: AuditLogItem[]; total: number }>(`/admin/audit-logs${qs ? `?${qs}` : ''}`);
  },

  async getUsers(params?: { role?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.role) query.append('role', params.role);
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset) query.append('offset', String(params.offset));
    const qs = query.toString();
    return apiClient<{ users: any[]; total: number }>(`/admin/users${qs ? `?${qs}` : ''}`);
  },
};
