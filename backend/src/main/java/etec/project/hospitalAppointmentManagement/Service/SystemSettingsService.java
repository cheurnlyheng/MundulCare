package etec.project.hospitalAppointmentManagement.Service;

import etec.project.hospitalAppointmentManagement.dto.response.MaintenanceStatusResponse;

public interface SystemSettingsService {
    MaintenanceStatusResponse getMaintenanceStatus();
    MaintenanceStatusResponse updateMaintenanceMode(boolean enabled, String message);
    boolean isMaintenanceModeActive();
}
