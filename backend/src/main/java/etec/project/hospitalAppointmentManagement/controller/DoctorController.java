package etec.project.hospitalAppointmentManagement.controller;

import etec.project.hospitalAppointmentManagement.Repo.UserRepo;
import etec.project.hospitalAppointmentManagement.Service.AuditLogService;
import etec.project.hospitalAppointmentManagement.Service.DoctorService;
import etec.project.hospitalAppointmentManagement.dto.request.DoctorRequest;
import etec.project.hospitalAppointmentManagement.dto.response.ApiResponse;
import etec.project.hospitalAppointmentManagement.dto.response.DoctorResponse;
import etec.project.hospitalAppointmentManagement.entity.User;
import etec.project.hospitalAppointmentManagement.exception.NotFound;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
@Tag(name = "Doctors", description = "Endpoints for Doctor Listings, Profiles, and Management")
public class DoctorController {

    private final DoctorService doctorService;
    private final AuditLogService auditLogService;
    private final UserRepo userRepo;

    @GetMapping
    @Operation(
            summary = "List and filter doctors",
            description = "Fetch all active doctors. Filter by specialtyId or search by doctor name/bio."
    )
    public ResponseEntity<ApiResponse<List<DoctorResponse>>> getAllDoctors(
            @RequestParam(required = false) Long specialtyId,
            @RequestParam(required = false) String search
    ) {
        List<DoctorResponse> doctors = doctorService.getAllDoctors(specialtyId, search);
        return ResponseEntity.ok(ApiResponse.success("Doctors retrieved successfully", doctors));
    }

    @GetMapping("/admin/all")
    @Operation(
            summary = "List all doctors including inactive ones (Admin)",
            description = "Used by the admin management dashboard so deactivated doctors stay visible and can be reactivated."
    )
    public ResponseEntity<ApiResponse<List<DoctorResponse>>> getAllDoctorsForAdmin() {
        List<DoctorResponse> doctors = doctorService.getAllDoctorsForAdmin();
        return ResponseEntity.ok(ApiResponse.success("Doctors retrieved successfully", doctors));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get doctor profile by ID", description = "Returns full profile and weekly availability schedules.")
    public ResponseEntity<ApiResponse<DoctorResponse>> getDoctorById(@PathVariable Long id) {
        DoctorResponse doctor = doctorService.getDoctorById(id);
        return ResponseEntity.ok(ApiResponse.success("Doctor retrieved successfully", doctor));
    }

    @PostMapping
    @Operation(summary = "Create doctor profile (Admin)", description = "Registers doctor information, specialties, and schedules.")
    public ResponseEntity<ApiResponse<DoctorResponse>> createDoctor(
            Authentication authentication,
            @Valid @RequestBody DoctorRequest request
    ) {
        DoctorResponse response = doctorService.createDoctor(request);
        auditLogService.log(getAdmin(authentication), "CREATED_DOCTOR", "DOCTOR", response.getId(),
                "Registered new doctor: " + response.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Doctor created successfully", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update doctor profile (Admin)")
    public ResponseEntity<ApiResponse<DoctorResponse>> updateDoctor(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody DoctorRequest request
    ) {
        DoctorResponse response = doctorService.updateDoctor(id, request);
        auditLogService.log(getAdmin(authentication), "UPDATED_DOCTOR", "DOCTOR", id,
                "Updated doctor profile: " + response.getName());
        return ResponseEntity.ok(ApiResponse.success("Doctor updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete doctor profile (Admin)")
    public ResponseEntity<ApiResponse<String>> deleteDoctor(Authentication authentication, @PathVariable Long id) {
        DoctorResponse doctor = doctorService.getDoctorById(id);
        doctorService.deleteDoctor(id);
        auditLogService.log(getAdmin(authentication), "DELETED_DOCTOR", "DOCTOR", id,
                "Deleted doctor: " + doctor.getName() + " (license " + doctor.getLicenseNumber() + ")");
        return ResponseEntity.ok(ApiResponse.success("Doctor deleted successfully", null));
    }

    @PostMapping(value = "/{id}/profile-image", consumes = "multipart/form-data")
    @Operation(summary = "Upload/replace a doctor's profile photo (Admin)")
    public ResponseEntity<ApiResponse<String>> uploadProfileImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    ) {
        String url = doctorService.uploadProfileImage(id, file);
        return ResponseEntity.ok(ApiResponse.success("Doctor photo updated successfully", url));
    }

    @DeleteMapping("/{id}/profile-image")
    @Operation(summary = "Remove a doctor's profile photo (Admin)")
    public ResponseEntity<ApiResponse<String>> deleteProfileImage(@PathVariable Long id) {
        doctorService.deleteProfileImage(id);
        return ResponseEntity.ok(ApiResponse.success("Doctor photo removed successfully"));
    }

    private User getAdmin(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Unauthorized. Please log in first.");
        }
        return userRepo.findByEmail(authentication.getName())
                .orElseThrow(() -> new NotFound("User account not found: " + authentication.getName()));
    }
}
