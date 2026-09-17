package etec.project.hospitalAppointmentManagement.Service;

import etec.project.hospitalAppointmentManagement.dto.request.ChangePasswordRequest;
import etec.project.hospitalAppointmentManagement.dto.request.UpdateProfileRequest;
import etec.project.hospitalAppointmentManagement.dto.response.AdminUserResponse;
import etec.project.hospitalAppointmentManagement.dto.response.PatientStrikeResponse;
import etec.project.hospitalAppointmentManagement.dto.response.UserProfileResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface UserService {
    UserProfileResponse getMyProfile(Long userId);
    UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request);
    void changePassword(Long userId, ChangePasswordRequest request);
    String uploadProfileImage(Long userId, MultipartFile file);
    void deleteProfileImage(Long userId);

    // Admin action: clears a patient's no-show strikes and restores their ability to book.
    void unlockBooking(Long userId);

    // Admin action: manually restricts an account from booking, same effect as hitting the strike limit.
    void lockBooking(Long userId);

    // Admin view: every patient with at least one recorded no-show strike.
    List<PatientStrikeResponse> getNoShowList();

    // Admin view: every registered account (User Management).
    List<AdminUserResponse> getAllUsers();

    // Admin action: permanently deletes a patient account and their appointment history. Refuses ADMIN accounts.
    void deleteUser(Long userId);
}
