package etec.project.hospitalAppointmentManagement.Service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import etec.project.hospitalAppointmentManagement.Repo.DoctorRepo;
import etec.project.hospitalAppointmentManagement.Repo.SpecialtyRepo;
import etec.project.hospitalAppointmentManagement.Service.AiSymptomService;
import etec.project.hospitalAppointmentManagement.Service.DoctorService;
import etec.project.hospitalAppointmentManagement.dto.request.SymptomMatchRequest;
import etec.project.hospitalAppointmentManagement.dto.response.DoctorResponse;
import etec.project.hospitalAppointmentManagement.dto.response.SymptomMatchResponse;
import etec.project.hospitalAppointmentManagement.entity.Doctor;
import etec.project.hospitalAppointmentManagement.entity.Specialty;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiSymptomServiceImpl implements AiSymptomService {

    private final DoctorRepo doctorRepo;
    private final SpecialtyRepo specialtyRepo;
    private final DoctorService doctorService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    // The free tier caps each Flash model at 5 requests/min and 20/day *per model* -
    // gemini-3.6-flash is already over quota (429) and gemini-3.7-flash is currently
    // 503-ing under high demand. This task is one-sentence classification, not
    // something that needs the flagship model, so "flash-lite-latest" (the lightweight,
    // auto-updating alias) fits both the task and today's quota headroom better.
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=";

    @Override
    public SymptomMatchResponse matchSymptoms(SymptomMatchRequest request) {
        // 1. Dynamically retrieve all active hospital specialties from PostgreSQL
        List<String> availableSpecialties = specialtyRepo.findAll().stream()
                .map(Specialty::getName)
                .collect(Collectors.toList());

        if (availableSpecialties.isEmpty()) {
            availableSpecialties = List.of("General Medicine");
        }

        String detectedSpecialty;
        String explanation;

        // 2. Use Gemini Flash AI if an API key is configured
        if (geminiApiKey != null && !geminiApiKey.trim().isEmpty() && !geminiApiKey.equals("YOUR_GEMINI_API_KEY_HERE")) {
            try {
                Map<String, String> aiResult = callGeminiFlash(request.getSymptoms(), availableSpecialties);
                detectedSpecialty = aiResult.getOrDefault("specialty", "General Medicine");
                explanation = aiResult.getOrDefault("explanation", "");
            } catch (Exception e) {
                log.warn("Gemini API call failed, defaulting to General Medicine: {}", e.getMessage());
                detectedSpecialty = "General Medicine";
                explanation = "Our AI assistant is temporarily unavailable. We've connected you with our General Medicine team, who can evaluate your symptoms and refer you to a specialist if needed.";
            }
        } else {
            log.warn("Gemini API key is not configured - AI symptom matching is defaulting to General Medicine.");
            detectedSpecialty = "General Medicine";
            explanation = "Our AI assistant is not currently configured. We've connected you with our General Medicine team, who can evaluate your symptoms and refer you to a specialist if needed.";
        }

        // 3. Fetch active doctors matching the detected specialty from database
        List<Doctor> doctors = doctorRepo.findBySpecialtyNamesIgnoreCase(List.of(detectedSpecialty.toLowerCase()));

        // Fallback to General Medicine doctors if no active doctor exists for that specific specialty
        if (doctors.isEmpty()) {
            doctors = doctorRepo.findBySpecialtyNamesIgnoreCase(List.of("general medicine"));
            if (!detectedSpecialty.equalsIgnoreCase("General Medicine")) {
                explanation += " (Note: Our General Medicine practitioners are available to assist with your initial checkup.)";
            }
        }

        List<DoctorResponse> matchingDoctorResponses = doctors.stream()
                .map(d -> doctorService.getDoctorById(d.getId()))
                .collect(Collectors.toList());

        return SymptomMatchResponse.builder()
                .detectedSpecialty(detectedSpecialty)
                .clinicalExplanation(explanation)
                .matchingDoctors(matchingDoctorResponses)
                .build();
    }

    private Map<String, String> callGeminiFlash(String symptoms, List<String> availableSpecialties) throws Exception {
        String specialtyListString = String.join(", ", availableSpecialties);

        String prompt = "You are an empathetic medical triaging AI assistant for a hospital appointment platform.\n\n" +
                "The hospital currently has the following departments/specialties:\n" +
                "[" + specialtyListString + "]\n\n" +
                "Patient symptoms: \"" + symptoms + "\"\n\n" +
                "Triaging Guidelines:\n" +
                "1. If the symptoms clearly match one of our available hospital departments listed above, choose that exact specialty name from the list. Check this list carefully and completely before concluding a specialty is unavailable - the list can change over time as the hospital adds new departments.\n" +
                "2. If the symptoms are common or mild primary care complaints (e.g. sneezing, cold, flu, fever, cough, stomach ache, nausea, fatigue, mild headache), choose \"General Medicine\".\n" +
                "3. Only if the symptoms relate to a medical specialty that is genuinely NOT present anywhere in the list above:\n" +
                "   - Choose \"General Medicine\" as the routing specialty.\n" +
                "   - In the explanation, kindly explain that while the hospital does not currently have a dedicated department for that specific field, our General Medicine practitioners can conduct an initial assessment, provide symptom relief, and issue an external specialist referral.\n\n" +
                "Respond ONLY with a valid JSON object matching this structure with NO backticks or markdown:\n" +
                "{\"specialty\": \"Exact Specialty Name from available list\", \"explanation\": \"2-3 sentences patient-friendly clinical explanation of why this specialist is recommended.\"}";

        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> requestBody = Map.of("contents", List.of(content));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        String response = postWithRetry(entity);

        JsonNode root = objectMapper.readTree(response);
        String text = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText().trim();

        if (text.startsWith("```json")) {
            text = text.substring(7);
        }
        if (text.startsWith("```")) {
            text = text.substring(3);
        }
        if (text.endsWith("```")) {
            text = text.substring(0, text.length() - 3);
        }

        JsonNode jsonResult = objectMapper.readTree(text.trim());
        Map<String, String> result = new HashMap<>();
        result.put("specialty", jsonResult.path("specialty").asText("General Medicine"));
        result.put("explanation", jsonResult.path("explanation").asText());
        return result;
    }

    // Gemini's 5xx responses are explicitly documented as transient ("spikes in demand are
    // usually temporary") - one retry after a short pause avoids falling back to General
    // Medicine over a momentary blip. 4xx errors (bad key, bad request) are not retried,
    // since retrying can't fix those.
    private String postWithRetry(HttpEntity<Map<String, Object>> entity) throws Exception {
        final int maxAttempts = 2;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return restTemplate.postForObject(GEMINI_API_URL + geminiApiKey, entity, String.class);
            } catch (HttpServerErrorException e) {
                if (attempt == maxAttempts) throw e;
                log.warn("Gemini API returned {} (attempt {}/{}), retrying...", e.getStatusCode(), attempt, maxAttempts);
                Thread.sleep(1000);
            }
        }
        throw new IllegalStateException("unreachable");
    }

}
