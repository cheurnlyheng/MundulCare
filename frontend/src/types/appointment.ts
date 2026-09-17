export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'REJECTED' | 'NO_SHOW';

export interface BookAppointmentRequest {
  doctorId: number;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  patientPhone?: string;
  reason: string;
}

export interface UpdateAppointmentStatusRequest {
  status: AppointmentStatus;
  rejectionReason?: string;
}

export interface PatientStrike {
  id: number;
  name: string;
  email: string;
  phone?: string;
  noShowCount: number;
  cancelCount: number;
  bookingLocked: boolean;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'DOCTOR' | 'PATIENT';
  authProvider: 'LOCAL' | 'GOOGLE';
  isVerified: boolean;
  noShowCount: number;
  cancelCount: number;
  bookingLocked: boolean;
  createdAt: string;
}

export interface AppointmentResponse {
  id: number;
  doctorId: number;
  doctorName: string;
  doctorEmail: string;
  doctorAddress?: string;
  consultationFee: number;
  patientUserId: number;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  patientNoShowCount: number;
  patientCancelCount: number;
  patientBookingLocked: boolean;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: AppointmentStatus;
  rejectionReason?: string;
  createdAt: string;
}
