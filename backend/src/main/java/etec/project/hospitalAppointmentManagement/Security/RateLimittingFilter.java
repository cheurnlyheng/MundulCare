package etec.project.hospitalAppointmentManagement.Security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimittingFilter extends OncePerRequestFilter {

    private static final int MAX_REQUESTS_PER_MINUTE = 10;
    private static final long WINDOW_TIME_MS = 60000; // 1 minute in ms

    private final Map<String, RequestTracker> ipRequestsMap = new ConcurrentHashMap<>();

    private static class RequestTracker {
        int count;
        long startTime;

        RequestTracker(int count, long startTime) {
            this.count = count;
            this.startTime = startTime;
        }
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();

        if (path.startsWith("/api/auth")) {
            String clientIp = getClientIp(request);
            long currentTime = System.currentTimeMillis();

            RequestTracker tracker = ipRequestsMap.compute(clientIp, (ip, currentTracker) -> {
                if (currentTracker == null || (currentTime - currentTracker.startTime) > WINDOW_TIME_MS) {
                    return new RequestTracker(1, currentTime);
                } else {
                    currentTracker.count++;
                    return currentTracker;
                }
            });

            if (tracker.count > MAX_REQUESTS_PER_MINUTE) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write(
                        "{\"success\":false,\"message\":\"Too many requests from IP " + clientIp + ". Please wait 1 minute before trying again.\",\"data\":null}"
                );
                return; // Stop the request here!
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
