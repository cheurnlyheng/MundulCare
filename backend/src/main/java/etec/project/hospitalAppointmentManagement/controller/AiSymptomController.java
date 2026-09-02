package etec.project.hospitalAppointmentManagement.controller;

import etec.project.hospitalAppointmentManagement.Service.AiSymptomService;
import etec.project.hospitalAppointmentManagement.dto.request.SymptomMatchRequest;
import etec.project.hospitalAppointmentManagement.dto.response.ApiResponse;
import etec.project.hospitalAppointmentManagement.dto.response.SymptomMatchResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@Tag(name = "AI Symptom Assistant", description = "Endpoints for AI-powered symptom analysis and Doctor recommendation")
public class AiSymptomController {

    private final AiSymptomService aiSymptomService;

    @PostMapping("/symptom-match")
    @Operation(
            summary = "Analyze symptoms and recommend doctors",
            description = "Analyzes patient symptom descriptions, matches appropriate medical specialties, and returns available doctors."
    )
    public ResponseEntity<ApiResponse<SymptomMatchResponse>> matchSymptoms(@Valid @RequestBody SymptomMatchRequest request) {
        SymptomMatchResponse response = aiSymptomService.matchSymptoms(request);
        return ResponseEntity.ok(ApiResponse.success("Symptoms analyzed successfully", response));
    }
}
