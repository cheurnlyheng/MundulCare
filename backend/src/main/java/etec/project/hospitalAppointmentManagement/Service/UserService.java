package etec.project.hospitalAppointmentManagement.Service;

import etec.project.hospitalAppointmentManagement.dto.request.ChangePasswordRequest;
import etec.project.hospitalAppointmentManagement.dto.request.UpdateProfileRequest;
import etec.project.hospitalAppointmentManagement.dto.response.UserProfileResponse;
import org.springframework.web.multipart.MultipartFile;

public interface UserService {
    UserProfileResponse getMyProfile(Long userId);
    UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request);
    void changePassword(Long userId, ChangePasswordRequest request);
    String uploadProfileImage(Long userId, MultipartFile file);
    void deleteProfileImage(Long userId);
}
