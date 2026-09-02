export type Role = 'ADMIN' | 'DOCTOR' | 'PATIENT';
export type OtpType = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
export type AuthProvider = 'LOCAL' | 'GOOGLE';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  profileImage?: string;
  isActive: boolean;
  isVerified: boolean;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  name: string;
  email: string;
  role: Role;
  profileImage?: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  role: Role;
  authProvider: AuthProvider;
  isVerified: boolean;
  createdAt: string;
}

export interface UpdateProfileRequest {
  name: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword: string;
}

export interface GoogleAuthRequest {
  idToken: string;
}

export interface AuditLogEntry {
  id: number;
  adminName: string;
  adminEmail: string;
  action: string;
  targetType?: string;
  targetId?: number;
  details?: string;
  createdAt: string;
}

export interface MaintenanceStatus {
  enabled: boolean;
  message: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
  type: OtpType;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ResendOtpRequest {
  email: string;
  type: OtpType;
}
