package etec.project.hospitalAppointmentManagement;

import org.flywaydb.core.Flyway;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
@EnableScheduling
public class HospitalAppointmentManagementApplication {

	public static void main(String[] args) {
		// This network has no working IPv6 route, but DNS still returns IPv6 addresses for
		// external hosts (e.g. Google's API). The JVM tries those first and hangs until its
		// connect timeout instead of failing fast like curl does - forcing IPv4-only avoids
		// every outbound HTTPS call (Gemini, Google OAuth) silently stalling on a dead route.
		System.setProperty("java.net.preferIPv4Stack", "true");

		// This Spring Boot version ships no Flyway auto-configuration (confirmed absent from
		// every spring-boot-* artifact on the classpath), so migrations are run manually here,
		// before the Spring context (and therefore Hibernate's ddl-auto=validate check) exists.
		SpringApplication app = new SpringApplication(HospitalAppointmentManagementApplication.class);
		app.addListeners((ApplicationListener<ApplicationEnvironmentPreparedEvent>) event -> {
			ConfigurableEnvironment env = event.getEnvironment();
			if (!env.getProperty("spring.flyway.enabled", Boolean.class, true)) {
				return;
			}
			Flyway.configure()
					.dataSource(
							env.getRequiredProperty("spring.datasource.url"),
							env.getRequiredProperty("spring.datasource.username"),
							env.getRequiredProperty("spring.datasource.password"))
					.baselineOnMigrate(env.getProperty("spring.flyway.baseline-on-migrate", Boolean.class, false))
					.baselineVersion(env.getProperty("spring.flyway.baseline-version", "1"))
					.load()
					.migrate();
		});
		app.run(args);
	}

}
