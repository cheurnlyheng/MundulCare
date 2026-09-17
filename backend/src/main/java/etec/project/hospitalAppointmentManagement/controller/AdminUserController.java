package etec.project.hospitalAppointmentManagement.controller;

import etec.project.hospitalAppointmentManagement.Repo.UserRepo;
import etec.project.hospitalAppointmentManagement.Service.AuditLogService;
import etec.project.hospitalAppointmentManagement.Service.UserService;
import etec.project.hospitalAppointmentManagement.dto.response.AdminUserResponse;
import etec.project.hospitalAppointmentManagement.dto.response.ApiResponse;
import etec.project.hospitalAppointmentManagement.dto.response.PatientStrikeResponse;
import etec.project.hospitalAppointmentManagement.entity.User;
import etec.project.hospitalAppointmentManagement.exception.NotFound;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@Tag(name = "Admin User Management", description = "Admin actions on patient accounts")
public class AdminUserController {

    private final UserService userService;
    private final AuditLogService auditLogService;
    private final UserRepo userRepo;

    @GetMapping
    @Operation(summary = "List every registered account (Admin User Management)")
    public ResponseEntity<ApiResponse<List<AdminUserResponse>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", userService.getAllUsers()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Permanently delete a patient account and their appointment history (Admin)")
    public ResponseEntity<ApiResponse<String>> deleteUser(Authentication authentication, @PathVariable Long id) {
        String targetName = findTarget(id).getName();
        userService.deleteUser(id);
        auditLogService.log(getUser(authentication), "DELETED_USER", "USER", id,
                "Permanently deleted account for " + targetName + " and their appointment history");
        return ResponseEntity.ok(ApiResponse.success("Account deleted successfully."));
    }

    @PutMapping("/{id}/lock-booking")
    @Operation(summary = "Manually restrict a patient account from booking new appointments (Admin)")
    public ResponseEntity<ApiResponse<String>> lockBooking(Authentication authentication, @PathVariable Long id) {
        String targetName = findTarget(id).getName();
        userService.lockBooking(id);
        auditLogService.log(getUser(authentication), "LOCKED_PATIENT_BOOKING", "USER", id,
                "Manually restricted booking access for " + targetName);
        return ResponseEntity.ok(ApiResponse.success("Booking access restricted for this patient."));
    }

    @GetMapping("/no-show-list")
    @Operation(summary = "List every patient with at least one recorded no-show strike (Admin)")
    public ResponseEntity<ApiResponse<List<PatientStrikeResponse>>> getNoShowList() {
        return ResponseEntity.ok(ApiResponse.success("No-show list retrieved successfully", userService.getNoShowList()));
    }

    @PutMapping("/{id}/unlock-booking")
    @Operation(summary = "Clear a patient's no-show strikes and restore booking access (Admin)")
    public ResponseEntity<ApiResponse<String>> unlockBooking(Authentication authentication, @PathVariable Long id) {
        String targetName = findTarget(id).getName();
        userService.unlockBooking(id);
        auditLogService.log(getUser(authentication), "UNLOCKED_PATIENT_BOOKING", "USER", id,
                "Cleared no-show strikes and restored booking access for " + targetName);
        return ResponseEntity.ok(ApiResponse.success("Booking access restored for this patient."));
    }

    private User getUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Unauthorized. Please log in first.");
        }
        return userRepo.findByEmail(authentication.getName())
                .orElseThrow(() -> new NotFound("User account not found: " + authentication.getName()));
    }

    private User findTarget(Long id) {
        return userRepo.findById(id)
                .orElseThrow(() -> new NotFound("User account not found with ID: " + id));
    }
}
