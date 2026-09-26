import axios from 'axios';
import {
  ApiResponse,
  AuditLogEntry,
  AuthResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  GoogleAuthRequest,
  LoginRequest,
  MaintenanceStatus,
  RegisterRequest,
  ResetPasswordRequest,
  ResendOtpRequest,
  UpdateProfileRequest,
  UserProfile,
  VerifyOtpRequest,
} from '@/types/auth';
import {
  Doctor,
  DoctorRequest,
  Specialty,
  SpecialtyRequest,
  SymptomMatchRequest,
  SymptomMatchResponse,
} from '@/types/doctor';
import {
  AdminUser,
  AppointmentResponse,
  BookAppointmentRequest,
  PatientStrike,
  UpdateAppointmentStatusRequest,
} from '@/types/appointment';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT Bearer token to every request if present
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// If an admin deletes this account while it's still logged in, the backend flags the
// next request with this header instead of a generic 401 - force the session out and
// explain why, rather than leaving them stuck on a page silently failing every request.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.headers?.['x-auth-error'] === 'ACCOUNT_DELETED') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?accountDeleted=1';
      }
    }
    return Promise.reject(error);
  }
);

// 1. Authentication API
export const authApi = {
  register: async (data: RegisterRequest): Promise<ApiResponse<string>> => {
    const res = await api.post<ApiResponse<string>>('/auth/register', data);
    return res.data;
  },

  verifyEmail: async (data: VerifyOtpRequest): Promise<ApiResponse<AuthResponse>> => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/verify-email', data);
    return res.data;
  },

  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return res.data;
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<ApiResponse<string>> => {
    const res = await api.post<ApiResponse<string>>('/auth/forgot-password', data);
    return res.data;
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<ApiResponse<string>> => {
    const res = await api.post<ApiResponse<string>>('/auth/reset-password', data);
    return res.data;
  },

  resendOtp: async (data: ResendOtpRequest): Promise<ApiResponse<string>> => {
    const res = await api.post<ApiResponse<string>>('/auth/resend-otp', data);
    return res.data;
  },

  googleLogin: async (data: GoogleAuthRequest): Promise<ApiResponse<AuthResponse>> => {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/google', data);
    return res.data;
  },
};

// 2. Specialties API
export const specialtyApi = {
  getAll: async (): Promise<ApiResponse<Specialty[]>> => {
    const res = await api.get<ApiResponse<Specialty[]>>('/specialties');
    return res.data;
  },

  getById: async (id: number): Promise<ApiResponse<Specialty>> => {
    const res = await api.get<ApiResponse<Specialty>>(`/specialties/${id}`);
    return res.data;
  },

  create: async (data: SpecialtyRequest): Promise<ApiResponse<Specialty>> => {
    const res = await api.post<ApiResponse<Specialty>>('/specialties', data);
    return res.data;
  },

  update: async (id: number, data: SpecialtyRequest): Promise<ApiResponse<Specialty>> => {
    const res = await api.put<ApiResponse<Specialty>>(`/specialties/${id}`, data);
    return res.data;
  },

  delete: async (id: number): Promise<ApiResponse<string>> => {
    const res = await api.delete<ApiResponse<string>>(`/specialties/${id}`);
    return res.data;
  },
};

// 3. Doctors API
export const doctorApi = {
  getAll: async (params?: { specialtyId?: number; search?: string }): Promise<ApiResponse<Doctor[]>> => {
    const res = await api.get<ApiResponse<Doctor[]>>('/doctors', { params });
    return res.data;
  },

  // Admin-only: includes inactive/deactivated doctors so they stay manageable (e.g. reactivating them).
  getAllForAdmin: async (): Promise<ApiResponse<Doctor[]>> => {
    const res = await api.get<ApiResponse<Doctor[]>>('/doctors/admin/all');
    return res.data;
  },

  getById: async (id: number): Promise<ApiResponse<Doctor>> => {
    const res = await api.get<ApiResponse<Doctor>>(`/doctors/${id}`);
    return res.data;
  },

  create: async (data: DoctorRequest): Promise<ApiResponse<Doctor>> => {
    const res = await api.post<ApiResponse<Doctor>>('/doctors', data);
    return res.data;
  },

  update: async (id: number, data: DoctorRequest): Promise<ApiResponse<Doctor>> => {
    const res = await api.put<ApiResponse<Doctor>>(`/doctors/${id}`, data);
    return res.data;
  },

  // Activates/deactivates without touching specialties - works even for a doctor with none assigned.
  setActive: async (id: number, active: boolean): Promise<ApiResponse<Doctor>> => {
    const res = await api.put<ApiResponse<Doctor>>(`/doctors/${id}/status`, { active });
    return res.data;
  },

  delete: async (id: number): Promise<ApiResponse<string>> => {
    const res = await api.delete<ApiResponse<string>>(`/doctors/${id}`);
    return res.data;
  },

  uploadProfileImage: async (id: number, file: File): Promise<ApiResponse<string>> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<ApiResponse<string>>(`/doctors/${id}/profile-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  deleteProfileImage: async (id: number): Promise<ApiResponse<string>> => {
    const res = await api.delete<ApiResponse<string>>(`/doctors/${id}/profile-image`);
    return res.data;
  },
};

// 4. AI Symptom Assistant API
export const aiApi = {
  matchSymptoms: async (data: SymptomMatchRequest): Promise<ApiResponse<SymptomMatchResponse>> => {
    const res = await api.post<ApiResponse<SymptomMatchResponse>>('/ai/symptom-match', data);
    return res.data;
  },
};

// 5. Appointments API
export const appointmentApi = {
  book: async (data: BookAppointmentRequest): Promise<ApiResponse<AppointmentResponse>> => {
    const res = await api.post<ApiResponse<AppointmentResponse>>('/appointments/book', data);
    return res.data;
  },

  getMyAppointments: async (): Promise<ApiResponse<AppointmentResponse[]>> => {
    const res = await api.get<ApiResponse<AppointmentResponse[]>>('/appointments/my-appointments');
    return res.data;
  },

  cancel: async (id: number): Promise<ApiResponse<AppointmentResponse>> => {
    const res = await api.put<ApiResponse<AppointmentResponse>>(`/appointments/${id}/cancel`);
    return res.data;
  },

  getAll: async (): Promise<ApiResponse<AppointmentResponse[]>> => {
    const res = await api.get<ApiResponse<AppointmentResponse[]>>('/appointments/all');
    return res.data;
  },

  updateStatus: async (
    id: number,
    data: UpdateAppointmentStatusRequest
  ): Promise<ApiResponse<AppointmentResponse>> => {
    const res = await api.put<ApiResponse<AppointmentResponse>>(`/appointments/${id}/status`, data);
    return res.data;
  },

  // Downloads the CSV and triggers a save-as in the browser (auth header can't be attached to a plain <a> link)
  exportCsv: async (): Promise<void> => {
    const res = await api.get('/appointments/export/csv', { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'appointments.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

// 6. User Profile API (the logged-in user's own account)
export const userApi = {
  getMyProfile: async (): Promise<ApiResponse<UserProfile>> => {
    const res = await api.get<ApiResponse<UserProfile>>('/users/me');
    return res.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<ApiResponse<UserProfile>> => {
    const res = await api.put<ApiResponse<UserProfile>>('/users/me', data);
    return res.data;
  },

  changePassword: async (data: ChangePasswordRequest): Promise<ApiResponse<string>> => {
    const res = await api.put<ApiResponse<string>>('/users/me/password', data);
    return res.data;
  },

  uploadProfileImage: async (file: File): Promise<ApiResponse<string>> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<ApiResponse<string>>('/users/me/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  deleteProfileImage: async (): Promise<ApiResponse<string>> => {
    const res = await api.delete<ApiResponse<string>>('/users/me/profile-image');
    return res.data;
  },
};

// 7. Admin Audit Log API
export const auditLogApi = {
  getAll: async (): Promise<ApiResponse<AuditLogEntry[]>> => {
    const res = await api.get<ApiResponse<AuditLogEntry[]>>('/admin/audit-logs');
    return res.data;
  },

  // Downloads the CSV and triggers a save-as in the browser (auth header can't be attached to a plain <a> link)
  exportCsv: async (): Promise<void> => {
    const res = await api.get('/admin/audit-logs/export/csv', { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'audit-logs.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

// 8. System Settings API (maintenance mode)
export const settingsApi = {
  getMaintenanceStatus: async (): Promise<ApiResponse<MaintenanceStatus>> => {
    // MaintenanceGate renders nothing until this resolves, so a sleeping backend (Render free
    // tier cold start) must not be able to hang it - time out and let the gate fail open.
    const res = await api.get<ApiResponse<MaintenanceStatus>>('/settings/maintenance', { timeout: 5000 });
    return res.data;
  },

  updateMaintenanceMode: async (enabled: boolean, message?: string): Promise<ApiResponse<MaintenanceStatus>> => {
    const res = await api.put<ApiResponse<MaintenanceStatus>>('/admin/settings/maintenance', { enabled, message });
    return res.data;
  },
};

// 9. Admin actions on patient accounts
export const adminUserApi = {
  // Every registered account (User Management).
  getAll: async (): Promise<ApiResponse<AdminUser[]>> => {
    const res = await api.get<ApiResponse<AdminUser[]>>('/admin/users');
    return res.data;
  },

  // Permanently deletes a patient account and their appointment history. Admin accounts are rejected server-side.
  delete: async (userId: number): Promise<ApiResponse<string>> => {
    const res = await api.delete<ApiResponse<string>>(`/admin/users/${userId}`);
    return res.data;
  },

  // Every patient with at least one recorded no-show strike (the blacklist view).
  getNoShowList: async (): Promise<ApiResponse<PatientStrike[]>> => {
    const res = await api.get<ApiResponse<PatientStrike[]>>('/admin/users/no-show-list');
    return res.data;
  },

  // Clears a patient's no-show strikes and restores their ability to book new appointments.
  unlockBooking: async (userId: number): Promise<ApiResponse<string>> => {
    const res = await api.put<ApiResponse<string>>(`/admin/users/${userId}/unlock-booking`);
    return res.data;
  },

  // Manually restricts a patient account from booking, same effect as hitting the strike limit.
  lockBooking: async (userId: number): Promise<ApiResponse<string>> => {
    const res = await api.put<ApiResponse<string>>(`/admin/users/${userId}/lock-booking`);
    return res.data;
  },
};

export default api;
