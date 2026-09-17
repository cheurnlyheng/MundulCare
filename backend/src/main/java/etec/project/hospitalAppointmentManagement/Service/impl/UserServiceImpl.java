package etec.project.hospitalAppointmentManagement.Service.impl;

import etec.project.hospitalAppointmentManagement.Repo.AppointmentRepo;
import etec.project.hospitalAppointmentManagement.Repo.OtpRepo;
import etec.project.hospitalAppointmentManagement.Repo.UserRepo;
import etec.project.hospitalAppointmentManagement.Service.FileStorageService;
import etec.project.hospitalAppointmentManagement.Service.UserService;
import etec.project.hospitalAppointmentManagement.dto.request.ChangePasswordRequest;
import etec.project.hospitalAppointmentManagement.dto.request.UpdateProfileRequest;
import etec.project.hospitalAppointmentManagement.dto.response.AdminUserResponse;
import etec.project.hospitalAppointmentManagement.dto.response.PatientStrikeResponse;
import etec.project.hospitalAppointmentManagement.dto.response.UserProfileResponse;
import etec.project.hospitalAppointmentManagement.entity.User;
import etec.project.hospitalAppointmentManagement.enums.Role;
import etec.project.hospitalAppointmentManagement.exception.NotFound;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private static final String PROFILE_IMAGE_SUBFOLDER = "profile-images";

    private final UserRepo userRepo;
    private final AppointmentRepo appointmentRepo;
    private final OtpRepo otpRepo;
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

        if (user.isHasPassword()) {
            if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
                throw new RuntimeException("Please enter your current password.");
            }
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new RuntimeException("Current password is incorrect.");
            }

            if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
                throw new RuntimeException("New password must be different from your current password.");
            }
        }
        // First time a GOOGLE account sets a password: no current password to check or compare against

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setHasPassword(true);
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

    @Override
    @Transactional
    public void unlockBooking(Long userId) {
        User user = findUser(userId);
        user.setBookingLocked(false);
        user.setNoShowCount(0);
        user.setCancelCount(0);
        userRepo.save(user);
    }

    @Override
    @Transactional
    public void lockBooking(Long userId) {
        User user = findUser(userId);
        if (user.getRole() == Role.ADMIN) {
            throw new RuntimeException("Administrator accounts cannot be locked.");
        }
        user.setBookingLocked(true);
        userRepo.save(user);
    }

    @Override
    public List<PatientStrikeResponse> getNoShowList() {
        return userRepo.findBlacklistCandidates()
                .stream()
                .map(user -> PatientStrikeResponse.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .phone(user.getPhone())
                        .noShowCount(user.getNoShowCount())
                        .cancelCount(user.getCancelCount())
                        .bookingLocked(user.isBookingLocked())
                        .build())
                .toList();
    }

    @Override
    public List<AdminUserResponse> getAllUsers() {
        return userRepo.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(user -> AdminUserResponse.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .phone(user.getPhone())
                        .role(user.getRole())
                        .authProvider(user.getAuthProvider())
                        .isVerified(user.isVerified())
                        .noShowCount(user.getNoShowCount())
                        .cancelCount(user.getCancelCount())
                        .bookingLocked(user.isBookingLocked())
                        .createdAt(user.getCreatedAt())
                        .build())
                .toList();
    }

    @Override
    @Transactional
    public void deleteUser(Long userId) {
        User user = findUser(userId);
        if (user.getRole() == Role.ADMIN) {
            throw new RuntimeException("Administrator accounts cannot be deleted.");
        }
        otpRepo.deleteByUserId(userId);
        appointmentRepo.deleteByPatientUserId(userId);
        userRepo.delete(user);
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
                .hasPassword(user.isHasPassword())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
