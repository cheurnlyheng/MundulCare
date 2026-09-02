package etec.project.hospitalAppointmentManagement.Service;

import etec.project.hospitalAppointmentManagement.dto.request.BookAppointmentRequest;
import etec.project.hospitalAppointmentManagement.dto.request.UpdateAppointmentStatusRequest;
import etec.project.hospitalAppointmentManagement.dto.response.AppointmentResponse;

import java.util.List;

public interface AppointmentService {

    AppointmentResponse bookAppointment(Long userId, BookAppointmentRequest request);

    List<AppointmentResponse> getMyAppointments(Long userId);

    List<AppointmentResponse> getAllAppointments();

    AppointmentResponse cancelAppointment(Long appointmentId, Long userId);

    AppointmentResponse updateStatus(Long appointmentId, UpdateAppointmentStatusRequest request);
}
