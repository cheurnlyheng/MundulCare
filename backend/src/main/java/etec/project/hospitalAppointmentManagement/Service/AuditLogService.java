package etec.project.hospitalAppointmentManagement.Service;

import etec.project.hospitalAppointmentManagement.dto.response.AuditLogResponse;
import etec.project.hospitalAppointmentManagement.entity.User;

import java.util.List;

public interface AuditLogService {
    void log(User admin, String action, String targetType, Long targetId, String details);
    List<AuditLogResponse> getAllLogs();
}
