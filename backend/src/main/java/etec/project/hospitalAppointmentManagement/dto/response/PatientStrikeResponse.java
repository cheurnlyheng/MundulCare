package etec.project.hospitalAppointmentManagement.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientStrikeResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private int noShowCount;
    private int cancelCount;
    private boolean bookingLocked;
}
