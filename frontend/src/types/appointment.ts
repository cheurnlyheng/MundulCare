export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'REJECTED';

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
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: AppointmentStatus;
  rejectionReason?: string;
  createdAt: string;
}
