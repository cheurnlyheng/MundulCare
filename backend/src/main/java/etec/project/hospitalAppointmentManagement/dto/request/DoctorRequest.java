package etec.project.hospitalAppointmentManagement.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DoctorRequest {
    @NotBlank(message = "Doctor name is required")
    private String name;
    @NotBlank(message = "Doctor email is required")
    @Email(message = "Invalid email format")
    private String email; // Used to receive booking emails!
    private String phone;
    private String profileImage;
    @NotBlank(message = "License number is required")
    private String licenseNumber;
    private String bio;
    @Min(value = 0, message = "Experience years cannot be negative")
    private int experienceYears;
    @NotNull(message = "Consultation fee is required")
    @DecimalMin(value = "0.0", message = "Consultation fee cannot be negative")
    private Double consultationFee;
    private String address;
    // Whether the doctor is currently accepting appointments; defaults to true when omitted
    private Boolean isActive;
    // List of Specialty IDs assigned to this doctor (e.g. [1, 3])
    @NotEmpty(message = "At least one specialty is required")
    private List<Long> specialtyIds;
    // Doctor's weekly availability schedules
    private List<DoctorScheduleDto> schedules;
}
