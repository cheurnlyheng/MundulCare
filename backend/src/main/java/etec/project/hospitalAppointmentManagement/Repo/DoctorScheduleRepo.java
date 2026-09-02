package etec.project.hospitalAppointmentManagement.Repo;

import etec.project.hospitalAppointmentManagement.entity.DoctorSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoctorScheduleRepo extends JpaRepository<DoctorSchedule, Long> {
    // Get all available schedules for a specific doctor
    List<DoctorSchedule> findByDoctorIdAndIsAvailableTrue(Long doctorId);
    // Get all schedules of a doctor
    List<DoctorSchedule> findByDoctorId(Long doctorId);
    // Delete schedules by doctor (useful when updating full schedule)
    void deleteByDoctorId(Long doctorId);

}
