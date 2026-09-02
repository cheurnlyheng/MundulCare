package etec.project.hospitalAppointmentManagement.controller;

import etec.project.hospitalAppointmentManagement.Service.SystemSettingsService;
import etec.project.hospitalAppointmentManagement.dto.request.MaintenanceModeRequest;
import etec.project.hospitalAppointmentManagement.dto.response.ApiResponse;
import etec.project.hospitalAppointmentManagement.dto.response.MaintenanceStatusResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Tag(name = "System Settings", description = "Hospital-wide system settings such as maintenance mode")
public class SettingsController {

    private final SystemSettingsService systemSettingsService;

    @GetMapping("/api/settings/maintenance")
    @Operation(summary = "Get current maintenance mode status (public)")
    public ResponseEntity<ApiResponse<MaintenanceStatusResponse>> getMaintenanceStatus() {
        return ResponseEntity.ok(ApiResponse.success("Maintenance status retrieved", systemSettingsService.getMaintenanceStatus()));
    }

    @PutMapping("/api/admin/settings/maintenance")
    @Operation(summary = "Enable/disable maintenance mode (Admin)")
    public ResponseEntity<ApiResponse<MaintenanceStatusResponse>> updateMaintenanceStatus(
            @RequestBody MaintenanceModeRequest request
    ) {
        MaintenanceStatusResponse response = systemSettingsService.updateMaintenanceMode(request.isEnabled(), request.getMessage());
        return ResponseEntity.ok(ApiResponse.success("Maintenance mode updated", response));
    }
}
