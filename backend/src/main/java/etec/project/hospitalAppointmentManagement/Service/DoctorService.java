package etec.project.hospitalAppointmentManagement.Service;

import etec.project.hospitalAppointmentManagement.dto.request.DoctorRequest;
import etec.project.hospitalAppointmentManagement.dto.response.DoctorResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface DoctorService {
    List<DoctorResponse> getAllDoctors(Long specialtyId, String search);
    List<DoctorResponse> getAllDoctorsForAdmin();
    DoctorResponse getDoctorById(Long id);
    DoctorResponse createDoctor(DoctorRequest request);
    DoctorResponse updateDoctor(Long id, DoctorRequest request);
    void deleteDoctor(Long id);
    String uploadProfileImage(Long doctorId, MultipartFile file);
    void deleteProfileImage(Long doctorId);
}
