package etec.project.hospitalAppointmentManagement.Service;

import etec.project.hospitalAppointmentManagement.dto.request.*;
import etec.project.hospitalAppointmentManagement.dto.response.AuthResponse;

public interface AuthService {

    String register(RegisterRequest request);

    AuthResponse verifyEmailOtp(VerifyOtpRequest request);

    AuthResponse login(LoginRequest request);

    String forgotPassword(ForgotPasswordRequest request);

    String resetPassword(ResetPasswordRequest request);

    String resendOtp(ResendOtpRequest request);

    AuthResponse googleLogin(GoogleAuthRequest request);
}
