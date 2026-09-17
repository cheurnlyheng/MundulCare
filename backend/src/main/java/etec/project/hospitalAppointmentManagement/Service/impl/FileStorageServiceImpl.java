package etec.project.hospitalAppointmentManagement.Service.impl;

import etec.project.hospitalAppointmentManagement.Service.FileStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageServiceImpl implements FileStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024; // 5MB

    // The public URL prefix is always "/uploads/**" (see WebConfig) regardless of where the
    // files actually live on disk - that's a separate, configurable concern below.
    private static final String UPLOAD_URL_PREFIX = "uploads";

    // Where files are actually written. Must match WebConfig's app.upload.dir so what's
    // written here is what gets served. Defaults to a relative folder for local dev; point
    // it at a persistent volume in production, since most hosts wipe local disk on redeploy.
    @Value("${app.upload.dir:uploads}")
    private String uploadRoot;

    @Override
    public String store(MultipartFile file, String subfolder) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("No file was uploaded.");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new RuntimeException("Image is too large. Maximum allowed size is 5MB.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new RuntimeException("Only JPEG, PNG, or WEBP images are allowed.");
        }

        try {
            Path targetDir = Paths.get(uploadRoot, subfolder).toAbsolutePath().normalize();
            Files.createDirectories(targetDir);

            String extension = switch (contentType.toLowerCase()) {
                case "image/png" -> ".png";
                case "image/webp" -> ".webp";
                default -> ".jpg";
            };
            String filename = UUID.randomUUID() + extension;
            Path targetFile = targetDir.resolve(filename);

            Files.copy(file.getInputStream(), targetFile);

            return "/" + UPLOAD_URL_PREFIX + "/" + subfolder + "/" + filename;
        } catch (IOException e) {
            log.error("Failed to store uploaded file: {}", e.getMessage());
            throw new RuntimeException("Failed to store uploaded image. Please try again.");
        }
    }

    @Override
    public void delete(String publicUrlPath) {
        if (!StringUtils.hasText(publicUrlPath) || !publicUrlPath.startsWith("/" + UPLOAD_URL_PREFIX + "/")) {
            return; // nothing to delete, or not one of our managed files
        }
        try {
            // Strip the leading "/uploads/" prefix to resolve the file on disk
            String relativePath = publicUrlPath.substring(("/" + UPLOAD_URL_PREFIX + "/").length());
            List<String> segments = List.of(relativePath.split("/"));
            Path targetFile = Paths.get(uploadRoot, segments.toArray(new String[0])).toAbsolutePath().normalize();
            Files.deleteIfExists(targetFile);
        } catch (IOException e) {
            log.warn("Failed to delete stored file {}: {}", publicUrlPath, e.getMessage());
        }
    }
}
