package etec.project.hospitalAppointmentManagement.controller;

import etec.project.hospitalAppointmentManagement.Repo.UserRepo;
import etec.project.hospitalAppointmentManagement.Service.AppointmentService;
import etec.project.hospitalAppointmentManagement.Service.AuditLogService;
import etec.project.hospitalAppointmentManagement.dto.request.BookAppointmentRequest;
import etec.project.hospitalAppointmentManagement.dto.request.UpdateAppointmentStatusRequest;
import etec.project.hospitalAppointmentManagement.dto.response.ApiResponse;
import etec.project.hospitalAppointmentManagement.dto.response.AppointmentResponse;
import etec.project.hospitalAppointmentManagement.entity.User;
import etec.project.hospitalAppointmentManagement.exception.NotFound;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
@Tag(name = "Appointments", description = "Endpoints for Appointment Booking, Status Tracking, and Cancellation")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final AuditLogService auditLogService;
    private final UserRepo userRepo;

    @PostMapping("/book")
    @Operation(
            summary = "Book a new appointment",
            description = "Patient selects doctor, date, available time slot, and reason. Automatically dispatches notification emails."
    )
    public ResponseEntity<ApiResponse<AppointmentResponse>> bookAppointment(
            Authentication authentication,
            @Valid @RequestBody BookAppointmentRequest request
    ) {
        Long userId = getUserId(authentication);
        AppointmentResponse response = appointmentService.bookAppointment(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Appointment booked successfully! Confirmation emails sent.", response));
    }

    @GetMapping("/my-appointments")
    @Operation(summary = "Get current patient's appointments", description = "Lists all appointments booked by the logged-in user.")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getMyAppointments(Authentication authentication) {
        Long userId = getUserId(authentication);
        List<AppointmentResponse> appointments = appointmentService.getMyAppointments(userId);
        return ResponseEntity.ok(ApiResponse.success("Appointments retrieved successfully", appointments));
    }

    @PutMapping("/{id}/cancel")
    @Operation(summary = "Cancel an appointment", description = "Patient or Admin cancels an active appointment and notifies the doctor.")
    public ResponseEntity<ApiResponse<AppointmentResponse>> cancelAppointment(
            Authentication authentication,
            @PathVariable Long id
    ) {
        Long userId = getUserId(authentication);
        AppointmentResponse response = appointmentService.cancelAppointment(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Appointment cancelled successfully.", response));
    }

    @GetMapping("/all")
    @Operation(summary = "List all hospital appointments (Admin)", description = "Returns all appointments across all departments.")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getAllAppointments() {
        List<AppointmentResponse> appointments = appointmentService.getAllAppointments();
        return ResponseEntity.ok(ApiResponse.success("All appointments retrieved successfully", appointments));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update appointment status (Admin)", description = "Admin confirms, rejects (with reason), or completes an appointment.")
    public ResponseEntity<ApiResponse<AppointmentResponse>> updateStatus(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UpdateAppointmentStatusRequest request
    ) {
        AppointmentResponse response = appointmentService.updateStatus(id, request);
        auditLogService.log(getUser(authentication), "UPDATED_APPOINTMENT_STATUS", "APPOINTMENT", id,
                "Set appointment for " + response.getPatientName() + " with " + response.getDoctorName()
                        + " to " + request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Appointment status updated to " + request.getStatus(), response));
    }

    @GetMapping("/export/csv")
    @Operation(summary = "Export all appointments as CSV (Admin)")
    public ResponseEntity<byte[]> exportCsv() {
        List<AppointmentResponse> appointments = appointmentService.getAllAppointments();

        StringBuilder csv = new StringBuilder();
        csv.append("ID,Patient Name,Patient Email,Patient Phone,Doctor,Date,Start Time,End Time,Status,Reason,Rejection Reason,Consultation Fee,Created At\n");
        for (AppointmentResponse apt : appointments) {
            csv.append(apt.getId()).append(',')
                    .append(csvEscape(apt.getPatientName())).append(',')
                    .append(csvEscape(apt.getPatientEmail())).append(',')
                    .append(csvEscape(apt.getPatientPhone())).append(',')
                    .append(csvEscape(apt.getDoctorName())).append(',')
                    .append(apt.getAppointmentDate()).append(',')
                    .append(apt.getStartTime()).append(',')
                    .append(apt.getEndTime()).append(',')
                    .append(apt.getStatus()).append(',')
                    .append(csvEscape(apt.getReason())).append(',')
                    .append(csvEscape(apt.getRejectionReason())).append(',')
                    .append(apt.getConsultationFee()).append(',')
                    .append(apt.getCreatedAt())
                    .append('\n');
        }

        byte[] body = csv.toString().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"appointments.csv\"")
                .body(body);
    }

    private String csvEscape(String value) {
        if (value == null) {
            return "";
        }
        String escaped = value.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }

    private Long getUserId(Authentication authentication) {
        return getUser(authentication).getId();
    }

    private User getUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Unauthorized. Please log in first.");
        }
        return userRepo.findByEmail(authentication.getName())
                .orElseThrow(() -> new NotFound("User account not found: " + authentication.getName()));
    }
}
