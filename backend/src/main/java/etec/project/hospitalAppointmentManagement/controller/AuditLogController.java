package etec.project.hospitalAppointmentManagement.controller;

import etec.project.hospitalAppointmentManagement.Service.AuditLogService;
import etec.project.hospitalAppointmentManagement.dto.response.ApiResponse;
import etec.project.hospitalAppointmentManagement.dto.response.AuditLogResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
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

    @GetMapping("/export/csv")
    @Operation(summary = "Export all audit log entries as CSV (Admin)")
    public ResponseEntity<byte[]> exportCsv() {
        List<AuditLogResponse> logs = auditLogService.getAllLogs();

        StringBuilder csv = new StringBuilder();
        csv.append("ID,Admin Name,Admin Email,Action,Target Type,Target ID,Details,Timestamp\n");
        for (AuditLogResponse entry : logs) {
            csv.append(entry.getId()).append(',')
                    .append(csvEscape(entry.getAdminName())).append(',')
                    .append(csvEscape(entry.getAdminEmail())).append(',')
                    .append(csvEscape(entry.getAction())).append(',')
                    .append(csvEscape(entry.getTargetType())).append(',')
                    .append(entry.getTargetId() == null ? "" : entry.getTargetId()).append(',')
                    .append(csvEscape(entry.getDetails())).append(',')
                    .append(entry.getCreatedAt())
                    .append('\n');
        }

        byte[] body = csv.toString().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"audit-logs.csv\"")
                .body(body);
    }

    private String csvEscape(String value) {
        if (value == null) {
            return "";
        }
        String escaped = value.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }
}
