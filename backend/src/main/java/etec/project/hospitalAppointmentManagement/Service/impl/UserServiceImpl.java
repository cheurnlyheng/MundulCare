package etec.project.hospitalAppointmentManagement.Service.impl;

import etec.project.hospitalAppointmentManagement.Repo.UserRepo;
import etec.project.hospitalAppointmentManagement.Service.FileStorageService;
import etec.project.hospitalAppointmentManagement.Service.UserService;
import etec.project.hospitalAppointmentManagement.dto.request.ChangePasswordRequest;
import etec.project.hospitalAppointmentManagement.dto.request.UpdateProfileRequest;
import etec.project.hospitalAppointmentManagement.dto.response.UserProfileResponse;
import etec.project.hospitalAppointmentManagement.entity.User;
import etec.project.hospitalAppointmentManagement.enums.AuthProvider;
import etec.project.hospitalAppointmentManagement.exception.NotFound;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private static final String PROFILE_IMAGE_SUBFOLDER = "profile-images";

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;

    @Override
    public UserProfileResponse getMyProfile(Long userId) {
        User user = findUser(userId);
        return mapToResponse(user);
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = findUser(userId);
        user.setName(request.getName().trim());
        user.setPhone(request.getPhone());
        user = userRepo.save(user);
        return mapToResponse(user);
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = findUser(userId);

        if (user.getAuthProvider() == AuthProvider.LOCAL) {
            if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
                throw new RuntimeException("Please enter your current password.");
            }
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new RuntimeException("Current password is incorrect.");
            }
        }
        // GOOGLE accounts skip the current-password check - they're setting a password for the first time

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepo.save(user);
    }

    @Override
    @Transactional
    public String uploadProfileImage(Long userId, MultipartFile file) {
        User user = findUser(userId);
        String oldImage = user.getProfileImage();

        String newImageUrl = fileStorageService.store(file, PROFILE_IMAGE_SUBFOLDER);
        user.setProfileImage(newImageUrl);
        userRepo.save(user);

        if (oldImage != null) {
            fileStorageService.delete(oldImage);
        }
        return newImageUrl;
    }

    @Override
    @Transactional
    public void deleteProfileImage(Long userId) {
        User user = findUser(userId);
        String oldImage = user.getProfileImage();
        if (oldImage == null) {
            return;
        }
        user.setProfileImage(null);
        userRepo.save(user);
        fileStorageService.delete(oldImage);
    }

    private User findUser(Long userId) {
        return userRepo.findById(userId)
                .orElseThrow(() -> new NotFound("User account not found with ID: " + userId));
    }

    private UserProfileResponse mapToResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .profileImage(user.getProfileImage())
                .role(user.getRole())
                .authProvider(user.getAuthProvider())
                .isVerified(user.isVerified())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
