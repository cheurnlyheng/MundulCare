export interface Specialty {
  id: number;
  name: string;
  description: string;
}

export interface SpecialtyRequest {
  name: string;
  description?: string;
}

export interface DoctorSchedule {
  id?: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface DoctorRequest {
  name: string;
  email: string;
  phone?: string;
  licenseNumber: string;
  bio?: string;
  experienceYears: number;
  consultationFee: number;
  address?: string;
  isActive?: boolean;
  specialtyIds: number[];
  schedules?: DoctorSchedule[];
}

export interface Doctor {
  id: number;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  licenseNumber: string;
  bio?: string;
  experienceYears: number;
  consultationFee: number;
  address?: string;
  isActive: boolean;
  specialties: Specialty[];
  schedules: DoctorSchedule[];
}

export interface SymptomMatchRequest {
  symptoms: string;
}

export interface SymptomMatchResponse {
  detectedSpecialty: string;
  clinicalExplanation: string;
  matchingDoctors: Doctor[];
}
