package etec.project.hospitalAppointmentManagement.Repo;

import etec.project.hospitalAppointmentManagement.entity.OtpVerification;
import etec.project.hospitalAppointmentManagement.enums.OtpType;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface OtpRepo extends JpaRepository<OtpVerification, Long> {

    Optional<OtpVerification> findTopByEmailAndTypeOrderByCreatedAtDesc(
            String email,
            OtpType type
    );

    Optional<OtpVerification> findTopByEmailAndTypeAndIsUsedFalseOrderByCreatedAtDesc(
            String email,
            OtpType type
    );

    @Modifying
    @Transactional
    @Query("UPDATE OtpVerification o SET o.isUsed = true WHERE o.email = :email AND o.type = :type AND o.isUsed = false")
    void invalidatePreviousOtps(@Param("email") String email, @Param("type") OtpType type);

    // Cascade cleanup when a user account is force-deleted
    void deleteByUserId(Long userId);
}
