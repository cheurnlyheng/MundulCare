package etec.project.hospitalAppointmentManagement.Config;

import etec.project.hospitalAppointmentManagement.Repo.DoctorRepo;
import etec.project.hospitalAppointmentManagement.Repo.DoctorScheduleRepo;
import etec.project.hospitalAppointmentManagement.Repo.SpecialtyRepo;
import etec.project.hospitalAppointmentManagement.entity.Doctor;
import etec.project.hospitalAppointmentManagement.entity.DoctorSchedule;
import etec.project.hospitalAppointmentManagement.entity.Specialty;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final SpecialtyRepo specialtyRepo;
    private final DoctorRepo doctorRepo;
    private final DoctorScheduleRepo doctorScheduleRepo;

    @Override
    public void run(String... args) {
        // Only seed demo data on a fresh, empty database. Once doctors exist, admin edits
        // made through the UI must persist across restarts instead of being overwritten.
        if (doctorRepo.count() > 0) {
            log.info("Doctors already exist in the database - skipping demo data seeding.");
            return;
        }
        seedSpecialtiesAndDoctors();
    }

    private void seedSpecialtiesAndDoctors() {
        // 1. Ensure all core Specialties exist
        Specialty cardiology = getOrCreateSpecialty("Cardiology", "Heart and cardiovascular health, hypertension, chest tightness, and circulation.");
        Specialty dermatology = getOrCreateSpecialty("Dermatology", "Skin, hair, nails, eczema, acne, rashes, and allergic reactions.");
        Specialty pediatrics = getOrCreateSpecialty("Pediatrics", "Comprehensive medical care for infants, children, and adolescents.");
        Specialty neurology = getOrCreateSpecialty("Neurology", "Brain, spinal cord, nerves, chronic migraines, severe headaches, and dizziness.");
        Specialty orthopedics = getOrCreateSpecialty("Orthopedics", "Bones, joints, ligaments, fractures, back pain, knee stiffness, and sports injuries.");
        Specialty dentistry = getOrCreateSpecialty("Dentistry", "Oral health, toothache, teeth cleaning, cavity filling, root canal, and gum care.");
        Specialty general = getOrCreateSpecialty("General Medicine", "Primary healthcare, fever, flu, cold, sneezing, stomach ache, fatigue, and general health.");

        // 2. Upsert Doctors with rich, professional descriptions
        upsertDoctor("Dr. Sothea Chan", "sotheachan_mundulcare@mmprojectstar.com", "+855 12 100 200", "MD-KH-2018-010",
                "Lead Family Physician & Primary Care Specialist. Expert in diagnosing seasonal flu, colds, allergies, gastrointestinal distress, and general health evaluations.",
                14, 25.00, "Room 101, Outpatient Clinic, Building A", Set.of(general));

        upsertDoctor("Dr. Sovannara Kim", "sovannarakim_mundulcare@mmprojectstar.com", "+855 12 111 222", "MD-KH-2021-042",
                "Senior Cardiologist & Cardiovascular Health Consultant. Specializes in ECG diagnostics, blood pressure management, and preventative heart care.",
                12, 35.00, "Room 301, Cardiology Department, Building A", Set.of(cardiology));

        upsertDoctor("Dr. Elena Vance", "elenavance_mundulcare@mmprojectstar.com", "+855 12 333 444", "MD-KH-2023-118",
                "Consultant Dermatologist & Allergy Specialist. Focuses on clinical dermatology, skin rash treatments, acute hives, acne management, and eczema.",
                8, 28.00, "Room 105, Skin & Allergy Center, Building B", Set.of(dermatology));

        upsertDoctor("Dr. Rithy Chhay", "rithychhay_mundulcare@mmprojectstar.com", "+855 12 555 666", "MD-KH-2019-089",
                "Chief Neurologist specializing in chronic migraine therapies, dizziness assessment, nerve health, and comprehensive neurological evaluations.",
                15, 45.00, "Room 402, Neuroscience Wing, Building A", Set.of(neurology));

        upsertDoctor("Dr. Bunroeun Seng", "bunroeunseng_mundulcare@mmprojectstar.com", "+855 12 666 777", "MD-KH-2020-075",
                "Orthopedic Surgeon & Joint Care Specialist. Focused on chronic lower back pain, knee joint therapy, sports injuries, and posture alignment.",
                11, 40.00, "Room 205, Orthopedics & Joint Clinic, Building B", Set.of(orthopedics));

        upsertDoctor("Dr. Voleak Pich", "voleakpich_mundulcare@mmprojectstar.com", "+855 12 888 999", "MD-KH-2022-190",
                "Dental Surgeon & Oral Health Specialist. Providing expert care in gentle tooth extractions, cavity repairs, dental restorations, and gum treatments.",
                9, 30.00, "Room 110, Dental Care Center, Building B", Set.of(dentistry));

        upsertDoctor("Dr. Mary Johnson", "maryjohnson_mundulcare@mmprojectstar.com", "+855 12 777 888", "MD-KH-2024-205",
                "Dedicated Pediatrician caring for infant wellness, childhood seasonal illnesses, growth tracking, and pediatric checkups.",
                6, 20.00, "Room 201, Children's Health Center, Building A", Set.of(pediatrics));
    }

    private Specialty getOrCreateSpecialty(String name, String description) {
        return specialtyRepo.findByName(name).orElseGet(() ->
                specialtyRepo.save(Specialty.builder()
                        .name(name)
                        .description(description)
                        .build())
        );
    }

    private void upsertDoctor(String name, String email, String phone, String license, String bio,
                              int exp, Double fee, String address, Set<Specialty> specialties) {
        Optional<Doctor> existingOpt = doctorRepo.findByLicenseNumber(license);
        Doctor doc;

        if (existingOpt.isPresent()) {
            doc = existingOpt.get();
            doc.setName(name);
            doc.setEmail(email);
            doc.setPhone(phone);
            doc.setBio(bio);
            doc.setExperienceYears(exp);
            doc.setConsultationFee(fee);
            doc.setAddress(address);
            doc.setSpecialties(specialties);
            doctorRepo.save(doc);
        } else {
            doc = doctorRepo.save(Doctor.builder()
                    .name(name)
                    .email(email)
                    .phone(phone)
                    .licenseNumber(license)
                    .bio(bio)
                    .experienceYears(exp)
                    .consultationFee(fee)
                    .address(address)
                    .isActive(true)
                    .specialties(specialties)
                    .build());

            // Add standard weekly schedule
            doctorScheduleRepo.save(DoctorSchedule.builder()
                    .doctor(doc)
                    .dayOfWeek("MONDAY")
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(12, 0))
                    .isAvailable(true)
                    .build());

            doctorScheduleRepo.save(DoctorSchedule.builder()
                    .doctor(doc)
                    .dayOfWeek("WEDNESDAY")
                    .startTime(LocalTime.of(14, 0))
                    .endTime(LocalTime.of(17, 0))
                    .isAvailable(true)
                    .build());

            doctorScheduleRepo.save(DoctorSchedule.builder()
                    .doctor(doc)
                    .dayOfWeek("FRIDAY")
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(16, 0))
                    .isAvailable(true)
                    .build());
        }
    }
}
