package etec.project.hospitalAppointmentManagement.dto.response;

import etec.project.hospitalAppointmentManagement.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
 private String token;
 @Builder.Default
    private String tokenType = "Bearer";
 private Long userId;
 private String name;
 private String email;
 private Role role;
 private String profileImage;
}
