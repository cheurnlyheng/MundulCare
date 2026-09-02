package etec.project.hospitalAppointmentManagement.Service;

import etec.project.hospitalAppointmentManagement.entity.Appointment;
import etec.project.hospitalAppointmentManagement.enums.OtpType;

public interface EmailService {

    String generateOtp();

    void sendOtpEmail(String toEmail, String otp, OtpType type);

    // 1. Email sent to the Admin when a patient books a new appointment
    void sendAdminBookingNotification(Appointment appointment, String adminEmail);

    // 2. Email sent to the Patient after booking
    void sendPatientBookingConfirmation(Appointment appointment);

    // 3. Email sent to the Doctor if patient cancels
    void sendDoctorCancellationNotification(Appointment appointment);

    // 4. Email sent to the Patient when Admin approves/rejects/completes
    void sendPatientStatusUpdate(Appointment appointment);

    // 5. Email sent to the Doctor when Admin approves/rejects/completes
    void sendDoctorStatusUpdate(Appointment appointment);
}
