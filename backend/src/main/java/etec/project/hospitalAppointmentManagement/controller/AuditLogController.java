package etec.project.hospitalAppointmentManagement.controller;

import etec.project.hospitalAppointmentManagement.Service.AuditLogService;
import etec.project.hospitalAppointmentManagement.dto.response.ApiResponse;
import etec.project.hospitalAppointmentManagement.dto.response.AuditLogResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
@Tag(name = "Admin Audit Log", description = "History of admin actions across the hospital portal")
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    @Operation(summary = "List all admin audit log entries (Admin)")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getAllLogs() {
        return ResponseEntity.ok(ApiResponse.success("Audit log retrieved successfully", auditLogService.getAllLogs()));
    }
}
