package etec.project.hospitalAppointmentManagement.Repo;

import etec.project.hospitalAppointmentManagement.entity.User;
import etec.project.hospitalAppointmentManagement.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepo extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findFirstByRole(Role role);

    // The blacklist view: anyone with a recorded strike of either kind, or who is locked outright.
    @Query("SELECT u FROM User u WHERE u.noShowCount > 0 OR u.cancelCount > 0 OR u.bookingLocked = true " +
            "ORDER BY u.bookingLocked DESC, (u.noShowCount + u.cancelCount) DESC")
    List<User> findBlacklistCandidates();

    List<User> findAllByOrderByCreatedAtDesc();
}
