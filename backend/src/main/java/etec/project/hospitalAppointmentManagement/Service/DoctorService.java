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

    // Activate/deactivate only - doesn't touch specialties, so it works even for a doctor
    // left with zero specialties (e.g. after their only department was deleted).
    DoctorResponse setActiveStatus(Long id, boolean active);

    void deleteDoctor(Long id);
    String uploadProfileImage(Long doctorId, MultipartFile file);
    void deleteProfileImage(Long doctorId);
}
