package etec.project.hospitalAppointmentManagement;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class HospitalAppointmentManagementApplication {

	public static void main(String[] args) {
		// This network has no working IPv6 route, but DNS still returns IPv6 addresses for
		// external hosts (e.g. Google's API). The JVM tries those first and hangs until its
		// connect timeout instead of failing fast like curl does - forcing IPv4-only avoids
		// every outbound HTTPS call (Gemini, Google OAuth) silently stalling on a dead route.
		System.setProperty("java.net.preferIPv4Stack", "true");
		SpringApplication.run(HospitalAppointmentManagementApplication.class, args);
	}

}
