package etec.project.hospitalAppointmentManagement.Service;

import etec.project.hospitalAppointmentManagement.dto.request.SymptomMatchRequest;
import etec.project.hospitalAppointmentManagement.dto.response.SymptomMatchResponse;

public interface AiSymptomService {
    SymptomMatchResponse matchSymptoms(SymptomMatchRequest request);
}
