package etec.project.hospitalAppointmentManagement.Service.impl;

import etec.project.hospitalAppointmentManagement.Repo.AppointmentRepo;
import etec.project.hospitalAppointmentManagement.Repo.DoctorRepo;
import etec.project.hospitalAppointmentManagement.Repo.UserRepo;
import etec.project.hospitalAppointmentManagement.Service.AppointmentService;
import etec.project.hospitalAppointmentManagement.Service.EmailService;
import etec.project.hospitalAppointmentManagement.dto.request.BookAppointmentRequest;
import etec.project.hospitalAppointmentManagement.dto.request.UpdateAppointmentStatusRequest;
import etec.project.hospitalAppointmentManagement.dto.response.AppointmentResponse;
import etec.project.hospitalAppointmentManagement.entity.Appointment;
import etec.project.hospitalAppointmentManagement.entity.Doctor;
import etec.project.hospitalAppointmentManagement.entity.User;
import etec.project.hospitalAppointmentManagement.enums.AppointmentStatus;
import etec.project.hospitalAppointmentManagement.enums.Role;
import etec.project.hospitalAppointmentManagement.exception.NotFound;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepo appointmentRepo;
    private final DoctorRepo doctorRepo;
    private final UserRepo userRepo;
    private final EmailService emailService;

    @Override
    @Transactional
    public AppointmentResponse bookAppointment(Long userId, BookAppointmentRequest request) {
        User patient = userRepo.findById(userId)
                .orElseThrow(() -> new NotFound("Patient account not found with ID: " + userId));

        Doctor doctor = doctorRepo.findById(request.getDoctorId())
                .orElseThrow(() -> new NotFound("Doctor not found with ID: " + request.getDoctorId()));

        if (!doctor.isActive()) {
            throw new RuntimeException("This doctor is currently not accepting appointments.");
        }

        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new RuntimeException("Start time must be before end time.");
        }

        // Double-booking conflict check
        boolean isBooked = appointmentRepo.isDoctorSlotBooked(
                doctor.getId(),
                request.getAppointmentDate(),
                request.getStartTime(),
                request.getEndTime()
        );

        if (isBooked) {
            throw new RuntimeException("This time slot is already booked for " + doctor.getName() +
                    ". Please choose a different time slot or date.");
        }

        String phone = (request.getPatientPhone() != null && !request.getPatientPhone().trim().isEmpty())
                ? request.getPatientPhone().trim()
                : patient.getPhone();

        Appointment appointment = Appointment.builder()
                .doctor(doctor)
                .patientUser(patient)
                .patientName(patient.getName())
                .patientEmail(patient.getEmail())
                .patientPhone(phone)
                .appointmentDate(request.getAppointmentDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .reason(request.getReason().trim())
                .status(AppointmentStatus.PENDING)
                .build();

        appointment = appointmentRepo.save(appointment);

        // Send automated notification emails to Admin (for review) and Patient (receipt)
        try {
            Optional<User> adminUser = userRepo.findFirstByRole(Role.ADMIN);
            if (adminUser.isPresent()) {
                emailService.sendAdminBookingNotification(appointment, adminUser.get().getEmail());
            } else {
                log.warn("No ADMIN user found - skipping admin booking notification email.");
            }
            emailService.sendPatientBookingConfirmation(appointment);
        } catch (Exception e) {
            log.error("Failed to send booking notification emails: {}", e.getMessage());
        }

        return mapToResponse(appointment);
    }

    @Override
    public List<AppointmentResponse> getMyAppointments(Long userId) {
        List<Appointment> appointments = appointmentRepo.findByPatientUserIdOrderByAppointmentDateDescStartTimeDesc(userId);
        return appointments.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<AppointmentResponse> getAllAppointments() {
        List<Appointment> appointments = appointmentRepo.findAllByOrderByAppointmentDateDescStartTimeDesc();
        return appointments.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AppointmentResponse cancelAppointment(Long appointmentId, Long userId) {
        Appointment appointment = appointmentRepo.findById(appointmentId)
                .orElseThrow(() -> new NotFound("Appointment not found with ID: " + appointmentId));

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new NotFound("User not found with ID: " + userId));

        // Ensure user owns this appointment or is Admin
        if (!appointment.getPatientUser().getId().equals(userId) && user.getRole() != Role.ADMIN) {
            throw new RuntimeException("You are not authorized to cancel this appointment.");
        }

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new RuntimeException("Appointment is already cancelled.");
        }

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel an already completed appointment.");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment = appointmentRepo.save(appointment);

        // Send cancellation email to Doctor
        try {
            emailService.sendDoctorCancellationNotification(appointment);
        } catch (Exception e) {
            log.error("Failed to send doctor cancellation email: {}", e.getMessage());
        }

        return mapToResponse(appointment);
    }

    @Override
    @Transactional
    public AppointmentResponse updateStatus(Long appointmentId, UpdateAppointmentStatusRequest request) {
        Appointment appointment = appointmentRepo.findById(appointmentId)
                .orElseThrow(() -> new NotFound("Appointment not found with ID: " + appointmentId));

        appointment.setStatus(request.getStatus());
        if (request.getRejectionReason() != null && !request.getRejectionReason().trim().isEmpty()) {
            appointment.setRejectionReason(request.getRejectionReason().trim());
        }

        appointment = appointmentRepo.save(appointment);

        // Notify both Patient and Doctor of the Admin's decision
        try {
            emailService.sendPatientStatusUpdate(appointment);
            emailService.sendDoctorStatusUpdate(appointment);
        } catch (Exception e) {
            log.error("Failed to send status update emails: {}", e.getMessage());
        }

        return mapToResponse(appointment);
    }

    private AppointmentResponse mapToResponse(Appointment appointment) {
        return AppointmentResponse.builder()
                .id(appointment.getId())
                .doctorId(appointment.getDoctor().getId())
                .doctorName(appointment.getDoctor().getName())
                .doctorEmail(appointment.getDoctor().getEmail())
                .doctorAddress(appointment.getDoctor().getAddress())
                .consultationFee(appointment.getDoctor().getConsultationFee())
                .patientUserId(appointment.getPatientUser().getId())
                .patientName(appointment.getPatientName())
                .patientEmail(appointment.getPatientEmail())
                .patientPhone(appointment.getPatientPhone())
                .appointmentDate(appointment.getAppointmentDate())
                .startTime(appointment.getStartTime())
                .endTime(appointment.getEndTime())
                .reason(appointment.getReason())
                .status(appointment.getStatus())
                .rejectionReason(appointment.getRejectionReason())
                .createdAt(appointment.getCreatedAt())
                .build();
    }
}
