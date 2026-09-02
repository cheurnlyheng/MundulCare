package etec.project.hospitalAppointmentManagement.dto.request;

import etec.project.hospitalAppointmentManagement.enums.AppointmentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAppointmentStatusRequest {

    @NotNull(message = "Status is required (CONFIRMED, REJECTED, CANCELLED, COMPLETED)")
    private AppointmentStatus status;

    private String rejectionReason; // Optional reason when rejecting
}
