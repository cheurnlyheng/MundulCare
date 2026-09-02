package etec.project.hospitalAppointmentManagement.controller;

import etec.project.hospitalAppointmentManagement.Repo.UserRepo;
import etec.project.hospitalAppointmentManagement.Service.UserService;
import etec.project.hospitalAppointmentManagement.dto.request.ChangePasswordRequest;
import etec.project.hospitalAppointmentManagement.dto.request.UpdateProfileRequest;
import etec.project.hospitalAppointmentManagement.dto.response.ApiResponse;
import etec.project.hospitalAppointmentManagement.dto.response.UserProfileResponse;
import etec.project.hospitalAppointmentManagement.entity.User;
import etec.project.hospitalAppointmentManagement.exception.NotFound;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Profile", description = "Endpoints for the logged-in user's own profile, password, and photo")
public class UserController {

    private final UserService userService;
    private final UserRepo userRepo;

    @GetMapping("/me")
    @Operation(summary = "Get my profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile(Authentication authentication) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", userService.getMyProfile(userId)));
    }

    @PutMapping("/me")
    @Operation(summary = "Update my name/phone")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        Long userId = getUserId(authentication);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", userService.updateProfile(userId, request)));
    }

    @PutMapping("/me/password")
    @Operation(summary = "Change my password", description = "Requires current password for LOCAL accounts; not required for GOOGLE accounts setting a password for the first time.")
    public ResponseEntity<ApiResponse<String>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        Long userId = getUserId(authentication);
        userService.changePassword(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Password updated successfully."));
    }

    @PostMapping(value = "/me/profile-image", consumes = "multipart/form-data")
    @Operation(summary = "Upload/replace my profile photo")
    public ResponseEntity<ApiResponse<String>> uploadProfileImage(
            Authentication authentication,
            @RequestParam("file") MultipartFile file
    ) {
        Long userId = getUserId(authentication);
        String url = userService.uploadProfileImage(userId, file);
        return ResponseEntity.ok(ApiResponse.success("Profile photo updated successfully", url));
    }

    @DeleteMapping("/me/profile-image")
    @Operation(summary = "Remove my profile photo")
    public ResponseEntity<ApiResponse<String>> deleteProfileImage(Authentication authentication) {
        Long userId = getUserId(authentication);
        userService.deleteProfileImage(userId);
        return ResponseEntity.ok(ApiResponse.success("Profile photo removed successfully"));
    }

    private Long getUserId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Unauthorized. Please log in first.");
        }
        User user = userRepo.findByEmail(authentication.getName())
                .orElseThrow(() -> new NotFound("User account not found: " + authentication.getName()));
        return user.getId();
    }
}
