package etec.project.hospitalAppointmentManagement.dto.response;

import etec.project.hospitalAppointmentManagement.enums.AuthProvider;
import etec.project.hospitalAppointmentManagement.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private Role role;
    private AuthProvider authProvider;
    private boolean isVerified;
    private int noShowCount;
    private int cancelCount;
    private boolean bookingLocked;
    private LocalDateTime createdAt;
}
