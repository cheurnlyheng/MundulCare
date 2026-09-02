package etec.project.hospitalAppointmentManagement.controller;

import etec.project.hospitalAppointmentManagement.Repo.UserRepo;
import etec.project.hospitalAppointmentManagement.Service.AuditLogService;
import etec.project.hospitalAppointmentManagement.Service.SpecialtyService;
import etec.project.hospitalAppointmentManagement.dto.request.SpecialtyRequest;
import etec.project.hospitalAppointmentManagement.dto.response.ApiResponse;
import etec.project.hospitalAppointmentManagement.dto.response.SpecialtyResponse;
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

import java.util.List;

@RestController
@RequestMapping("/api/specialties")
@RequiredArgsConstructor
@Tag(name = "Specialties", description = "Endpoints for Medical Specialties (Cardiology, Dermatology, etc.)")
public class SpecialtyController {
    private final SpecialtyService specialtyService;
    private final AuditLogService auditLogService;
    private final UserRepo userRepo;

    @GetMapping
    @Operation(summary = "List all specialties", description = "Returns all available medical specialties.")
    public ResponseEntity<ApiResponse<List<SpecialtyResponse>>> getAllSpecialties() {
        List<SpecialtyResponse> specialties = specialtyService.getAllSpecialties();
        return ResponseEntity.ok(ApiResponse.success("Specialties retrieved successfully", specialties));
    }
    @GetMapping("/{id}")
    @Operation(summary = "Get specialty by ID")
    public ResponseEntity<ApiResponse<SpecialtyResponse>> getSpecialtyById(@PathVariable Long id) {
        SpecialtyResponse specialty = specialtyService.getSpecialtyById(id);
        return ResponseEntity.ok(ApiResponse.success("Specialty retrieved successfully", specialty));
    }
    @PostMapping
    @Operation(summary = "Create a new specialty (Admin)")
    public ResponseEntity<ApiResponse<SpecialtyResponse>> createSpecialty(
            Authentication authentication,
            @Valid @RequestBody SpecialtyRequest request
    ) {
        SpecialtyResponse response = specialtyService.createSpecialty(request);
        auditLogService.log(getAdmin(authentication), "CREATED_SPECIALTY", "SPECIALTY", response.getId(),
                "Created department: " + response.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Specialty created successfully", response));
    }
    @PutMapping("/{id}")
    @Operation(summary = "Update a specialty (Admin)")
    public ResponseEntity<ApiResponse<SpecialtyResponse>> updateSpecialty(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody SpecialtyRequest request
    ) {
        SpecialtyResponse response = specialtyService.updateSpecialty(id, request);
        auditLogService.log(getAdmin(authentication), "UPDATED_SPECIALTY", "SPECIALTY", id,
                "Updated department: " + response.getName());
        return ResponseEntity.ok(ApiResponse.success("Specialty updated successfully", response));
    }
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a specialty (Admin)")
    public ResponseEntity<ApiResponse<String>> deleteSpecialty(Authentication authentication, @PathVariable Long id) {
        SpecialtyResponse specialty = specialtyService.getSpecialtyById(id);
        specialtyService.deleteSpecialty(id);
        auditLogService.log(getAdmin(authentication), "DELETED_SPECIALTY", "SPECIALTY", id,
                "Deleted department: " + specialty.getName());
        return ResponseEntity.ok(ApiResponse.success("Specialty deleted successfully", null));
    }

    private User getAdmin(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Unauthorized. Please log in first.");
        }
        return userRepo.findByEmail(authentication.getName())
                .orElseThrow(() -> new NotFound("User account not found: " + authentication.getName()));
    }
}
