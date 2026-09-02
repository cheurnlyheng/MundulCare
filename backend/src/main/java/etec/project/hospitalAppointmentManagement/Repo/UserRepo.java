package etec.project.hospitalAppointmentManagement.Repo;

import etec.project.hospitalAppointmentManagement.entity.User;
import etec.project.hospitalAppointmentManagement.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepo extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findFirstByRole(Role role);
}
