package etec.project.hospitalAppointmentManagement.Service.impl;

import etec.project.hospitalAppointmentManagement.Repo.SpecialtyRepo;
import etec.project.hospitalAppointmentManagement.Service.SpecialtyService;
import etec.project.hospitalAppointmentManagement.dto.request.SpecialtyRequest;
import etec.project.hospitalAppointmentManagement.dto.response.SpecialtyResponse;
import etec.project.hospitalAppointmentManagement.entity.Specialty;
import etec.project.hospitalAppointmentManagement.exception.NotFound;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SpecialtyServiceImpl implements SpecialtyService {
    private final SpecialtyRepo specialtyRepo;
    @Override
    public List<SpecialtyResponse> getAllSpecialties() {
        return specialtyRepo.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public SpecialtyResponse getSpecialtyById(Long id) {
        Specialty specialty = specialtyRepo.findById(id)
                .orElseThrow(() -> new NotFound("Specialty not found with ID: " + id));
        return mapToResponse(specialty);
    }

    @Override
    @Transactional
    public SpecialtyResponse createSpecialty(SpecialtyRequest request) {
        if (specialtyRepo.existsByName(request.getName().trim())) {
            throw new RuntimeException("Specialty already exists with name: " + request.getName());
        }
        Specialty specialty = Specialty.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .build();
        specialty = specialtyRepo.save(specialty);
        return mapToResponse(specialty);
    }

    @Override
    @Transactional
    public SpecialtyResponse updateSpecialty(Long id, SpecialtyRequest request) {
        Specialty specialty = specialtyRepo.findById(id)
                .orElseThrow(() -> new NotFound("Specialty not found with ID: " + id));
        // Check if new name already belongs to another specialty
        if (!specialty.getName().equalsIgnoreCase(request.getName().trim()) &&
                specialtyRepo.existsByName(request.getName().trim())) {
            throw new RuntimeException("Specialty already exists with name: " + request.getName());
        }
        specialty.setName(request.getName().trim());
        specialty.setDescription(request.getDescription());
        specialty = specialtyRepo.save(specialty);
        return mapToResponse(specialty);
    }

    @Override
    @Transactional
    public void deleteSpecialty(Long id) {
        if (!specialtyRepo.existsById(id)) {
            throw new NotFound("Specialty not found with ID: " + id);
        }
        specialtyRepo.unlinkSpecialtyFromAllDoctors(id);
        specialtyRepo.deleteById(id);
    }
    private SpecialtyResponse mapToResponse(Specialty specialty) {
        return SpecialtyResponse.builder()
                .id(specialty.getId())
                .name(specialty.getName())
                .description(specialty.getDescription())
                .build();
    }
}
