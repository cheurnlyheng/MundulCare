package etec.project.hospitalAppointmentManagement.Service.impl;

import etec.project.hospitalAppointmentManagement.Repo.AppointmentRepo;
import etec.project.hospitalAppointmentManagement.Repo.DoctorRepo;
import etec.project.hospitalAppointmentManagement.Repo.DoctorScheduleRepo;
import etec.project.hospitalAppointmentManagement.Repo.SpecialtyRepo;
import etec.project.hospitalAppointmentManagement.Service.DoctorService;
import etec.project.hospitalAppointmentManagement.Service.FileStorageService;
import etec.project.hospitalAppointmentManagement.dto.request.DoctorRequest;
import etec.project.hospitalAppointmentManagement.dto.request.DoctorScheduleDto;
import etec.project.hospitalAppointmentManagement.dto.response.DoctorResponse;
import etec.project.hospitalAppointmentManagement.dto.response.SpecialtyResponse;
import etec.project.hospitalAppointmentManagement.entity.Doctor;
import etec.project.hospitalAppointmentManagement.entity.DoctorSchedule;
import etec.project.hospitalAppointmentManagement.entity.Specialty;
import etec.project.hospitalAppointmentManagement.exception.NotFound;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepo doctorRepo;
    private final SpecialtyRepo specialtyRepo;
    private final DoctorScheduleRepo doctorScheduleRepo;
    private final AppointmentRepo appointmentRepo;
    private final FileStorageService fileStorageService;

    private static final String DOCTOR_IMAGE_SUBFOLDER = "doctor-images";

    @Override
    public List<DoctorResponse> getAllDoctors(Long specialtyId, String search) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        List<Doctor> doctors;

        if (specialtyId != null && cleanSearch != null) {
            doctors = doctorRepo.searchBySpecialtyAndNameOrBio(specialtyId, cleanSearch);
        } else if (specialtyId != null) {
            doctors = doctorRepo.findBySpecialtyId(specialtyId);
        } else if (cleanSearch != null) {
            doctors = doctorRepo.searchByNameOrBio(cleanSearch);
        } else {
            doctors = doctorRepo.findByIsActiveTrue();
        }

        return doctors.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public List<DoctorResponse> getAllDoctorsForAdmin() {
        return doctorRepo.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public DoctorResponse getDoctorById(Long id) {
        Doctor doctor = doctorRepo.findById(id)
                .orElseThrow(() -> new NotFound("Doctor not found with ID: " + id));
        return mapToResponse(doctor);
    }

    @Override
    @Transactional
    public DoctorResponse createDoctor(DoctorRequest request) {
        if (doctorRepo.existsByLicenseNumber(request.getLicenseNumber().trim())) {
            throw new RuntimeException("Doctor with license number already exists: " + request.getLicenseNumber());
        }

        if (doctorRepo.existsByEmail(request.getEmail().trim())) {
            throw new RuntimeException("Doctor with email already exists: " + request.getEmail());
        }

        // Fetch assigned specialties
        List<Specialty> specialties = specialtyRepo.findAllById(request.getSpecialtyIds());
        if (specialties.isEmpty()) {
            throw new RuntimeException("Invalid specialties provided.");
        }

        Doctor doctor = Doctor.builder()
                .name(request.getName().trim())
                .email(request.getEmail().trim())
                .phone(request.getPhone())
                .profileImage(request.getProfileImage())
                .licenseNumber(request.getLicenseNumber().trim())
                .bio(request.getBio())
                .experienceYears(request.getExperienceYears())
                .consultationFee(request.getConsultationFee())
                .address(request.getAddress())
                .isActive(request.getIsActive() == null || request.getIsActive())
                .specialties(new HashSet<>(specialties))
                .build();

        doctor = doctorRepo.save(doctor);

        // Save schedules if provided
        if (request.getSchedules() != null && !request.getSchedules().isEmpty()) {
            final Doctor savedDoctor = doctor;
            List<DoctorSchedule> schedules = request.getSchedules().stream()
                    .map(dto -> DoctorSchedule.builder()
                            .doctor(savedDoctor)
                            .dayOfWeek(dto.getDayOfWeek().toUpperCase())
                            .startTime(dto.getStartTime())
                            .endTime(dto.getEndTime())
                            .isAvailable(dto.getIsAvailable() == null || dto.getIsAvailable())
                            .build())
                    .collect(Collectors.toList());
            doctorScheduleRepo.saveAll(schedules);
        }

        return mapToResponse(doctor);
    }

    @Override
    @Transactional
    public DoctorResponse updateDoctor(Long id, DoctorRequest request) {
        Doctor doctor = doctorRepo.findById(id)
                .orElseThrow(() -> new NotFound("Doctor not found with ID: " + id));

        // License uniqueness check
        if (!doctor.getLicenseNumber().equalsIgnoreCase(request.getLicenseNumber().trim()) &&
                doctorRepo.existsByLicenseNumber(request.getLicenseNumber().trim())) {
            throw new RuntimeException("License number already in use: " + request.getLicenseNumber());
        }

        // Email uniqueness check
        if (!doctor.getEmail().equalsIgnoreCase(request.getEmail().trim()) &&
                doctorRepo.existsByEmail(request.getEmail().trim())) {
            throw new RuntimeException("Email already in use: " + request.getEmail());
        }

        List<Specialty> specialties = specialtyRepo.findAllById(request.getSpecialtyIds());
        if (specialties.isEmpty()) {
            throw new RuntimeException("Invalid specialties provided.");
        }

        doctor.setName(request.getName().trim());
        doctor.setEmail(request.getEmail().trim());
        doctor.setPhone(request.getPhone());
        // profileImage is intentionally NOT touched here - it's only changed via the
        // dedicated upload/delete-profile-image endpoints, so a plain info edit here
        // (which never sends the current photo back) can't silently wipe it out.
        doctor.setLicenseNumber(request.getLicenseNumber().trim());
        doctor.setBio(request.getBio());
        doctor.setExperienceYears(request.getExperienceYears());
        doctor.setConsultationFee(request.getConsultationFee());
        doctor.setAddress(request.getAddress());
        doctor.setSpecialties(new HashSet<>(specialties));
        if (request.getIsActive() != null) {
            doctor.setActive(request.getIsActive());
        }

        doctor = doctorRepo.save(doctor);

        // Update schedules
        if (request.getSchedules() != null) {
            doctorScheduleRepo.deleteByDoctorId(doctor.getId());
            final Doctor savedDoctor = doctor;
            List<DoctorSchedule> schedules = request.getSchedules().stream()
                    .map(dto -> DoctorSchedule.builder()
                            .doctor(savedDoctor)
                            .dayOfWeek(dto.getDayOfWeek().toUpperCase())
                            .startTime(dto.getStartTime())
                            .endTime(dto.getEndTime())
                            .isAvailable(dto.getIsAvailable() == null || dto.getIsAvailable())
                            .build())
                    .collect(Collectors.toList());
            doctorScheduleRepo.saveAll(schedules);
        }

        return mapToResponse(doctor);
    }

    @Override
    @Transactional
    public void deleteDoctor(Long id) {
        if (!doctorRepo.existsById(id)) {
            throw new NotFound("Doctor not found with ID: " + id);
        }
        doctorScheduleRepo.deleteByDoctorId(id);
        appointmentRepo.deleteByDoctorId(id);
        doctorRepo.deleteById(id);
    }

    @Override
    @Transactional
    public String uploadProfileImage(Long doctorId, org.springframework.web.multipart.MultipartFile file) {
        Doctor doctor = doctorRepo.findById(doctorId)
                .orElseThrow(() -> new NotFound("Doctor not found with ID: " + doctorId));
        String oldImage = doctor.getProfileImage();

        String newImageUrl = fileStorageService.store(file, DOCTOR_IMAGE_SUBFOLDER);
        doctor.setProfileImage(newImageUrl);
        doctorRepo.save(doctor);

        if (oldImage != null) {
            fileStorageService.delete(oldImage);
        }
        return newImageUrl;
    }

    @Override
    @Transactional
    public void deleteProfileImage(Long doctorId) {
        Doctor doctor = doctorRepo.findById(doctorId)
                .orElseThrow(() -> new NotFound("Doctor not found with ID: " + doctorId));
        String oldImage = doctor.getProfileImage();
        if (oldImage == null) {
            return;
        }
        doctor.setProfileImage(null);
        doctorRepo.save(doctor);
        fileStorageService.delete(oldImage);
    }

    private DoctorResponse mapToResponse(Doctor doctor) {
        List<SpecialtyResponse> specialtyResponses = doctor.getSpecialties().stream()
                .map(s -> SpecialtyResponse.builder()
                        .id(s.getId())
                        .name(s.getName())
                        .description(s.getDescription())
                        .build())
                .collect(Collectors.toList());

        List<DoctorSchedule> schedules = doctorScheduleRepo.findByDoctorId(doctor.getId());
        List<DoctorScheduleDto> scheduleDtos = schedules.stream()
                .map(sch -> DoctorScheduleDto.builder()
                        .id(sch.getId())
                        .dayOfWeek(sch.getDayOfWeek())
                        .startTime(sch.getStartTime())
                        .endTime(sch.getEndTime())
                        .isAvailable(sch.isAvailable())
                        .build())
                .collect(Collectors.toList());

        return DoctorResponse.builder()
                .id(doctor.getId())
                .name(doctor.getName())
                .email(doctor.getEmail())
                .phone(doctor.getPhone())
                .profileImage(doctor.getProfileImage())
                .licenseNumber(doctor.getLicenseNumber())
                .bio(doctor.getBio())
                .experienceYears(doctor.getExperienceYears())
                .consultationFee(doctor.getConsultationFee())
                .address(doctor.getAddress())
                .isActive(doctor.isActive())
                .specialties(specialtyResponses)
                .schedules(scheduleDtos)
                .build();
    }
}
