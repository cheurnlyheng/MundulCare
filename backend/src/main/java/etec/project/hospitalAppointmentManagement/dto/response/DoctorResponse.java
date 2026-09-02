package etec.project.hospitalAppointmentManagement.dto.response;

import etec.project.hospitalAppointmentManagement.dto.request.DoctorScheduleDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DoctorResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String profileImage;
    private String licenseNumber;
    private String bio;
    private int experienceYears;
    private Double consultationFee;
    private String address;
    private Boolean isActive;
    private List<SpecialtyResponse> specialties;
    private List<DoctorScheduleDto> schedules;
}
