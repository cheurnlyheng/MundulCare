package etec.project.hospitalAppointmentManagement.dto.request;

import etec.project.hospitalAppointmentManagement.enums.OtpType;
import etec.project.hospitalAppointmentManagement.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class VerifyOtpRequest {
    @Email(message = "Invalid email format")
    @NotBlank(message = "Email cannot be empty")
    private String email;
    @NotBlank(message = "Otp cannot be empty")
    private String otp;

    @NotNull(message = "otp cannot be empty")
    private OtpType type;
}
