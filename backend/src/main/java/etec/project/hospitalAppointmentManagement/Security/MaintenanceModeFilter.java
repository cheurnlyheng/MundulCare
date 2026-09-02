package etec.project.hospitalAppointmentManagement.Security;

import com.fasterxml.jackson.databind.ObjectMapper;
import etec.project.hospitalAppointmentManagement.Service.SystemSettingsService;
import etec.project.hospitalAppointmentManagement.dto.response.ApiResponse;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

// When maintenance mode is on, blocks everything except auth (so admins can still log in),
// the maintenance-status check itself, admin endpoints (so an admin can turn it back off), and static assets.
@Component
@RequiredArgsConstructor
public class MaintenanceModeFilter extends OncePerRequestFilter {

    private final SystemSettingsService systemSettingsService;
    private final ObjectMapper objectMapper;

    private static final Set<String> ALLOWLIST_PREFIXES = Set.of(
            "/api/auth/",
            "/api/settings/maintenance",
            "/api/admin/",
            "/uploads/",
            "/swagger-ui",
            "/v3/api-docs",
            "/error"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        boolean allowlisted = ALLOWLIST_PREFIXES.stream().anyMatch(path::startsWith);

        if (!allowlisted && systemSettingsService.isMaintenanceModeActive() && !isAdmin()) {
            response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(objectMapper.writeValueAsString(
                    ApiResponse.error(systemSettingsService.getMaintenanceStatus().getMessage())));
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_ADMIN"));
    }
}
