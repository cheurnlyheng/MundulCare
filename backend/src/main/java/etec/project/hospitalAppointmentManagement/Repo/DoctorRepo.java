package etec.project.hospitalAppointmentManagement.Repo;

import etec.project.hospitalAppointmentManagement.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepo extends JpaRepository<Doctor, Long> {

    Optional<Doctor> findByLicenseNumber(String licenseNumber);

    boolean existsByLicenseNumber(String licenseNumber);

    boolean existsByEmail(String email);

    List<Doctor> findByIsActiveTrue();

    @Query("SELECT DISTINCT d FROM Doctor d JOIN d.specialties s WHERE d.isActive = true AND s.id = :specialtyId")
    List<Doctor> findBySpecialtyId(@Param("specialtyId") Long specialtyId);

    @Query("SELECT DISTINCT d FROM Doctor d LEFT JOIN d.specialties s WHERE d.isActive = true AND (LOWER(d.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(d.bio) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Doctor> searchByNameOrBio(@Param("search") String search);

    @Query("SELECT DISTINCT d FROM Doctor d JOIN d.specialties s WHERE d.isActive = true AND s.id = :specialtyId AND (LOWER(d.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(d.bio) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Doctor> searchBySpecialtyAndNameOrBio(@Param("specialtyId") Long specialtyId, @Param("search") String search);

    @Query("SELECT DISTINCT d FROM Doctor d JOIN d.specialties s WHERE d.isActive = true AND LOWER(s.name) IN :specialtyNames")
    List<Doctor> findBySpecialtyNamesIgnoreCase(@Param("specialtyNames") List<String> specialtyNames);
}
