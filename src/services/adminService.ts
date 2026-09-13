import { apiClient } from './apiClient';

export interface AdminStats {
  totalUsers: number;
  totalDoctors: number;
  verifiedDoctors: number;
  pendingDoctors: number;
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
    return apiClient<AdminStats>('/admin/stats');
  },

  async getDoctors(params?: { status?: string; search?: string; limit?: number; offset?: number }) {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.offset) query.append('offset', String(params.offset));
    const qs = query.toString();
    return apiClient<{ doctors: AdminDoctorItem[]; total: number }>(`/admin/doctors${qs ? `?${qs}` : ''}`);
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
    return apiClient<{ verifications: any[]; total: number }>(`/admin/verifications${qs ? `?${qs}` : ''}`);
  },

  async reviewVerification(payload: ReviewActionPayload) {
    return apiClient<any>('/admin/verifications/review', {
      method: 'POST',
      body: JSON.stringify(payload),
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
