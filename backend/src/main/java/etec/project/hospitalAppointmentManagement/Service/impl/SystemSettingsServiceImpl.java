package etec.project.hospitalAppointmentManagement.Service.impl;

import etec.project.hospitalAppointmentManagement.Repo.SystemSettingsRepo;
import etec.project.hospitalAppointmentManagement.Service.SystemSettingsService;
import etec.project.hospitalAppointmentManagement.dto.response.MaintenanceStatusResponse;
import etec.project.hospitalAppointmentManagement.entity.SystemSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SystemSettingsServiceImpl implements SystemSettingsService {

    private static final Long SETTINGS_ID = 1L;
    private static final String DEFAULT_MESSAGE =
            "We're currently performing scheduled maintenance to improve your experience. Please check back shortly.";

    private final SystemSettingsRepo systemSettingsRepo;

    @Override
    public MaintenanceStatusResponse getMaintenanceStatus() {
        SystemSettings settings = getOrCreateSettings();
        return toResponse(settings);
    }

    @Override
    @Transactional
    public MaintenanceStatusResponse updateMaintenanceMode(boolean enabled, String message) {
        SystemSettings settings = getOrCreateSettings();
        settings.setMaintenanceMode(enabled);
        settings.setMaintenanceMessage(message != null && !message.isBlank() ? message.trim() : null);
        settings = systemSettingsRepo.save(settings);
        return toResponse(settings);
    }

    @Override
    public boolean isMaintenanceModeActive() {
        return getOrCreateSettings().isMaintenanceMode();
    }

    private SystemSettings getOrCreateSettings() {
        return systemSettingsRepo.findById(SETTINGS_ID)
                .orElseGet(() -> systemSettingsRepo.save(
                        SystemSettings.builder().id(SETTINGS_ID).maintenanceMode(false).build()));
    }

    private MaintenanceStatusResponse toResponse(SystemSettings settings) {
        return MaintenanceStatusResponse.builder()
                .enabled(settings.isMaintenanceMode())
                .message(settings.getMaintenanceMessage() != null ? settings.getMaintenanceMessage() : DEFAULT_MESSAGE)
                .build();
    }
}
