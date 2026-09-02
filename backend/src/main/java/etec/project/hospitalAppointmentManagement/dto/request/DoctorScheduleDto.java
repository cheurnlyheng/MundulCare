package etec.project.hospitalAppointmentManagement.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoctorScheduleDto {
    private Long id;
    @NotBlank(message = "Day of week is required (e.g. MONDAY)")
    private String dayOfWeek;
    @NotNull(message = "Start time is required")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime; // e.g. "09:00"
    @NotNull(message = "End time is required")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime; // e.g. "17:00"
    @Builder.Default
    private Boolean isAvailable = true;
}
