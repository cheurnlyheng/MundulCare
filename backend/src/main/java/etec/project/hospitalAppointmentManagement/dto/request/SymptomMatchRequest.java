package etec.project.hospitalAppointmentManagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SymptomMatchRequest {

    @NotBlank(message = "Please describe your symptoms")
    @Size(min = 5, max = 1000, message = "Symptom description must be between 5 and 1000 characters")
    private String symptoms; // e.g. "I have severe chest pain and difficulty breathing"
}
