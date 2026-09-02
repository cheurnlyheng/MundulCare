package etec.project.hospitalAppointmentManagement.Repo;

import etec.project.hospitalAppointmentManagement.entity.Specialty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface SpecialtyRepo extends JpaRepository<Specialty, Long> {
    Optional<Specialty> findByName(String name);
    boolean existsByName(String name);
    List<Specialty> findByNameIn(Collection<String> names);

    @Modifying
    @Query(value = "DELETE FROM doctor_specialties WHERE specialty_id = :specialtyId", nativeQuery = true)
    void unlinkSpecialtyFromAllDoctors(@Param("specialtyId") Long specialtyId);
}
