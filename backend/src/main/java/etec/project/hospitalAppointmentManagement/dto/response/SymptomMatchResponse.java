package etec.project.hospitalAppointmentManagement.dto.response;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SymptomMatchResponse {

    private String detectedSpecialty; // e.g. "Cardiology"
    private String clinicalExplanation; // Friendly explanation of why this specialist is recommended
    private List<DoctorResponse> matchingDoctors; // Real doctors fetched from database
}
