package etec.project.hospitalAppointmentManagement.Service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    // Stores the file under uploads/{subfolder}/ and returns a public URL path (e.g. /uploads/profile-images/{uuid}.jpg)
    String store(MultipartFile file, String subfolder);

    // Deletes a previously stored file given its public URL path. Safe to call with null/blank.
    void delete(String publicUrlPath);
}
