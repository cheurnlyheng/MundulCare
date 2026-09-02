package etec.project.hospitalAppointmentManagement.Service.impl;

import etec.project.hospitalAppointmentManagement.Service.EmailService;
import etec.project.hospitalAppointmentManagement.entity.Appointment;
import etec.project.hospitalAppointmentManagement.enums.AppointmentStatus;
import etec.project.hospitalAppointmentManagement.enums.OtpType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Override
    public String generateOtp() {
        SecureRandom random = new SecureRandom();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    @Override
    public void sendOtpEmail(String toEmail, String otp, OtpType type) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);

            if (type == OtpType.EMAIL_VERIFICATION) {
                message.setSubject("Mundul Care - Account Verification");
                message.setText("Welcome to Mundul Care! Your account verification code is:\n" + otp +
                        "\n\nThis code will expire in 5 minutes.");
            } else if (type == OtpType.PASSWORD_RESET) {
                message.setSubject("Mundul Care - Password Reset Verification");
                message.setText("Your verification code for resetting password is:\n" + otp +
                        "\n\nThis code will expire in 5 minutes." +
                        "\n\nIf you did not request this code, please secure your account immediately.");
            }
            mailSender.send(message);
            log.info("OTP successfully sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP code to email {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }

    private String friendlyStatus(AppointmentStatus status) {
        return switch (status) {
            case CONFIRMED -> "Approved";
            case REJECTED -> "Declined";
            case COMPLETED -> "Completed";
            case CANCELLED -> "Cancelled";
            default -> status.name();
        };
    }

    @Override
    @Async
    public void sendAdminBookingNotification(Appointment appointment, String adminEmail) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(adminEmail);
            message.setSubject("MundulCare - New Appointment Pending Review: " + appointment.getPatientName());

            String content = "Dear Administrator,\n\n" +
                    "A new appointment request requires your review.\n\n" +
                    "APPOINTMENT DETAILS:\n" +
                    "• Patient Name: " + appointment.getPatientName() + "\n" +
                    "• Contact Phone: " + (appointment.getPatientPhone() != null ? appointment.getPatientPhone() : "N/A") + "\n" +
                    "• Patient Email: " + appointment.getPatientEmail() + "\n" +
                    "• Doctor: " + appointment.getDoctor().getName() + "\n" +
                    "• Appointment Date: " + appointment.getAppointmentDate() + "\n" +
                    "• Requested Time: " + appointment.getStartTime() + " - " + appointment.getEndTime() + "\n" +
                    "• Symptoms / Reason for Visit: " + appointment.getReason() + "\n\n" +
                    "Please log in to the Admin Portal to Approve or Reject this request.\n\n" +
                    "Best regards,\n" +
                    "MundulCare Hospital Automated System";

            message.setText(content);
            mailSender.send(message);
            log.info("Admin booking notification email sent to {}", adminEmail);
        } catch (Exception e) {
            log.error("Failed to send email to admin: {}", e.getMessage());
        }
    }

    @Override
    @Async
    public void sendPatientBookingConfirmation(Appointment appointment) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(appointment.getPatientEmail());
            message.setSubject("MundulCare - Appointment Booking Received");

            String content = "Dear " + appointment.getPatientName() + ",\n\n" +
                    "Thank you for choosing MundulCare Hospital! Your appointment request has been successfully received.\n" +
                    "Please wait for our staff to check doctor's availability. \n\n"+
                    "DETAILS:\n" +
                    "• Doctor: " + appointment.getDoctor().getName() + "\n" +
                    "• Clinic Location: " + (appointment.getDoctor().getAddress() != null ? appointment.getDoctor().getAddress() : "Hospital Main Building") + "\n" +
                    "• Date: " + appointment.getAppointmentDate() + "\n" +
                    "• Time: " + appointment.getStartTime() + " - " + appointment.getEndTime() + "\n" +
                    "• Consultation Fee: $" + String.format("%.2f", appointment.getDoctor().getConsultationFee()) + "\n" +
                    "• Status: PENDING (Our hospital staff will review your booking)\n\n" +
                    "You can track or cancel your appointment under 'My Appointments' on our website.\n\n" +
                    "Best regards,\n" +
                    "MundulCare Hospital Team";

            message.setText(content);
            mailSender.send(message);
            log.info("Patient booking confirmation email sent to {}", appointment.getPatientEmail());
        } catch (Exception e) {
            log.error("Failed to send email to patient: {}", e.getMessage());
        }
    }

    @Override
    @Async
    public void sendDoctorCancellationNotification(Appointment appointment) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(appointment.getDoctor().getEmail());
            message.setSubject("MundulCare - Appointment Cancelled: " + appointment.getPatientName());

            String content = "Dear " + appointment.getDoctor().getName() + ",\n\n" +
                    "Please be advised that patient " + appointment.getPatientName() + " has cancelled their appointment originally scheduled for " +
                    appointment.getAppointmentDate() + " at " + appointment.getStartTime() + " - " + appointment.getEndTime() + ".\n\n" +
                    "This time slot is now open.\n\n" +
                    "Best regards,\n" +
                    "MundulCare Hospital System";

            message.setText(content);
            mailSender.send(message);
            log.info("Doctor cancellation email sent to {}", appointment.getDoctor().getEmail());
        } catch (Exception e) {
            log.error("Failed to send cancellation email to doctor: {}", e.getMessage());
        }
    }

    @Override
    @Async
    public void sendPatientStatusUpdate(Appointment appointment) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(appointment.getPatientEmail());
            String friendlyStatus = friendlyStatus(appointment.getStatus());
            message.setSubject("MundulCare - Your Appointment Was " + friendlyStatus + " (" + appointment.getAppointmentDate() + ")");

            StringBuilder content = new StringBuilder();
            content.append("Dear ").append(appointment.getPatientName()).append(",\n\n");
            content.append("Our hospital administration team has reviewed your appointment request. Here is a summary:\n\n");
            content.append("----------------------------------------------------------------------\n");
            content.append("RESULT: ").append(friendlyStatus.toUpperCase()).append("\n");
            content.append("----------------------------------------------------------------------\n");
            content.append("• Doctor: ").append(appointment.getDoctor().getName()).append("\n");
            content.append("• Date: ").append(appointment.getAppointmentDate()).append("\n");
            content.append("• Time: ").append(appointment.getStartTime()).append(" - ").append(appointment.getEndTime()).append("\n");
            content.append("• Clinic Location: ").append(appointment.getDoctor().getAddress() != null ? appointment.getDoctor().getAddress() : "Hospital Main Building").append("\n");
            content.append("• Consultation Fee: $").append(String.format("%.2f", appointment.getDoctor().getConsultationFee())).append("\n");

            if (appointment.getRejectionReason() != null && !appointment.getRejectionReason().isBlank()) {
                content.append("• Admin Note: ").append(appointment.getRejectionReason()).append("\n");
            }
            content.append("----------------------------------------------------------------------\n\n");

            if (appointment.getStatus() == AppointmentStatus.CONFIRMED) {
                content.append("Please arrive 10 minutes early with any relevant medical records.\n\n");
            } else if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
                content.append("Thank you for visiting MundulCare Hospital. We wish you good health.\n\n");
            } else if (appointment.getStatus() == AppointmentStatus.REJECTED) {
                content.append("You're welcome to submit a new appointment request for a different date or time.\n\n");
            }

            content.append("You can view the full details anytime under 'My Appointments' on our website.\n\n");
            content.append("Best regards,\nMundulCare Hospital Team");

            message.setText(content.toString());
            mailSender.send(message);
            log.info("Patient status update email sent to {}", appointment.getPatientEmail());
        } catch (Exception e) {
            log.error("Failed to send status update email to patient: {}", e.getMessage());
        }
    }

    @Override
    @Async
    public void sendDoctorStatusUpdate(Appointment appointment) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(appointment.getDoctor().getEmail());
            String friendlyStatus = friendlyStatus(appointment.getStatus());
            message.setSubject("MundulCare - Appointment " + friendlyStatus + ": " + appointment.getPatientName());

            StringBuilder content = new StringBuilder();
            content.append("Dear ").append(appointment.getDoctor().getName()).append(",\n\n");
            content.append("The hospital administration team has made a decision on the following appointment request:\n\n");
            content.append("----------------------------------------------------------------------\n");
            content.append("RESULT: ").append(friendlyStatus.toUpperCase()).append("\n");
            content.append("----------------------------------------------------------------------\n");
            content.append("• Patient Name: ").append(appointment.getPatientName()).append("\n");
            content.append("• Contact Phone: ").append(appointment.getPatientPhone() != null ? appointment.getPatientPhone() : "N/A").append("\n");
            content.append("• Patient Email: ").append(appointment.getPatientEmail()).append("\n");
            content.append("• Date: ").append(appointment.getAppointmentDate()).append("\n");
            content.append("• Time: ").append(appointment.getStartTime()).append(" - ").append(appointment.getEndTime()).append("\n");

            if (appointment.getRejectionReason() != null && !appointment.getRejectionReason().isBlank()) {
                content.append("• Admin Note: ").append(appointment.getRejectionReason()).append("\n");
            }
            content.append("----------------------------------------------------------------------\n\n");

            if (appointment.getStatus() == AppointmentStatus.CONFIRMED) {
                content.append("Please be available at the scheduled time above.\n\n");
            }

            content.append("Best regards,\nMundulCare Hospital System");

            message.setText(content.toString());
            mailSender.send(message);
            log.info("Doctor status update email sent to {}", appointment.getDoctor().getEmail());
        } catch (Exception e) {
            log.error("Failed to send status update email to doctor: {}", e.getMessage());
        }
    }
}
