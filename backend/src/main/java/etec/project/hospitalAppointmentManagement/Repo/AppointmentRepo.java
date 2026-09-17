package etec.project.hospitalAppointmentManagement.Repo;

import etec.project.hospitalAppointmentManagement.entity.Appointment;
import etec.project.hospitalAppointmentManagement.enums.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface AppointmentRepo extends JpaRepository<Appointment, Long> {
    // Get all appointments booked by a specific patient (for Patient Dashboard)
    List<Appointment> findByPatientUserIdOrderByAppointmentDateDescStartTimeDesc(Long userId);

    // One-active-appointment-at-a-time rule: true if the patient already has a
    // PENDING or CONFIRMED appointment with anyone, regardless of doctor.
    boolean existsByPatientUserIdAndStatusIn(Long patientUserId, Collection<AppointmentStatus> statuses);

    // Get all appointments assigned to a specific doctor
    List<Appointment> findByDoctorIdOrderByAppointmentDateDescStartTimeDesc(Long doctorId);

    // Get all appointments across the hospital (for Admin Portal), newest booking first
    List<Appointment> findAllByOrderByCreatedAtDesc();
    // Double-Booking Prevention Query:
    // Returns true if the doctor already has an overlapping active (PENDING or CONFIRMED) appointment
    @Query("SELECT COUNT(a) > 0 FROM Appointment a " +
            "WHERE a.doctor.id = :doctorId " +
            "AND a.appointmentDate = :date " +
            "AND a.status NOT IN ('CANCELLED', 'REJECTED') " +
            "AND ((a.startTime <= :startTime AND a.endTime > :startTime) " +
            "     OR (a.startTime < :endTime AND a.endTime >= :endTime) " +
            "     OR (a.startTime >= :startTime AND a.endTime <= :endTime))")
    boolean isDoctorSlotBooked(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    // Cascade cleanup when a doctor is force-deleted
    void deleteByDoctorId(Long doctorId);

    // Cascade cleanup when a patient account is force-deleted
    void deleteByPatientUserId(Long patientUserId);

}
