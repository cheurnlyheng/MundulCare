package etec.project.hospitalAppointmentManagement.Service;

import etec.project.hospitalAppointmentManagement.dto.request.SpecialtyRequest;
import etec.project.hospitalAppointmentManagement.dto.response.SpecialtyResponse;

import java.util.List;

public interface SpecialtyService {
    List<SpecialtyResponse> getAllSpecialties();
    SpecialtyResponse getSpecialtyById(Long id);
    SpecialtyResponse createSpecialty(SpecialtyRequest request);
    SpecialtyResponse updateSpecialty(Long id, SpecialtyRequest request);
    void deleteSpecialty(Long id);
}
