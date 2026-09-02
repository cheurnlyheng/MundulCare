package etec.project.hospitalAppointmentManagement.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import etec.project.hospitalAppointmentManagement.enums.AppointmentStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResponse {

    private Long id;

    // Doctor info
    private Long doctorId;
    private String doctorName;
    private String doctorEmail;
    private String doctorAddress;
    private Double consultationFee;

    // Patient info
    private Long patientUserId;
    private String patientName;
    private String patientEmail;
    private String patientPhone;

    // Appointment info
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate appointmentDate;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;

    private String reason;
    private AppointmentStatus status;
    private String rejectionReason;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}
