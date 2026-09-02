package etec.project.hospitalAppointmentManagement.Service.impl;

import etec.project.hospitalAppointmentManagement.Repo.AuditLogRepo;
import etec.project.hospitalAppointmentManagement.Service.AuditLogService;
import etec.project.hospitalAppointmentManagement.dto.response.AuditLogResponse;
import etec.project.hospitalAppointmentManagement.entity.AuditLog;
import etec.project.hospitalAppointmentManagement.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepo auditLogRepo;

    @Override
    public void log(User admin, String action, String targetType, Long targetId, String details) {
        try {
            AuditLog entry = AuditLog.builder()
                    .adminId(admin.getId())
                    .adminName(admin.getName())
                    .adminEmail(admin.getEmail())
                    .action(action)
                    .targetType(targetType)
                    .targetId(targetId)
                    .details(details)
                    .build();
            auditLogRepo.save(entry);
        } catch (Exception e) {
            // Never let audit logging break the actual admin action it's recording
            log.error("Failed to write audit log entry [{}]: {}", action, e.getMessage());
        }
    }

    @Override
    public List<AuditLogResponse> getAllLogs() {
        return auditLogRepo.findAllByOrderByCreatedAtDesc().stream()
                .map(a -> AuditLogResponse.builder()
                        .id(a.getId())
                        .adminName(a.getAdminName())
                        .adminEmail(a.getAdminEmail())
                        .action(a.getAction())
                        .targetType(a.getTargetType())
                        .targetId(a.getTargetId())
                        .details(a.getDetails())
                        .createdAt(a.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }
}
