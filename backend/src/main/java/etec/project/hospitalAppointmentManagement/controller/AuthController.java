package etec.project.hospitalAppointmentManagement.controller;

import etec.project.hospitalAppointmentManagement.Service.AuthService;
import etec.project.hospitalAppointmentManagement.dto.request.*;
import etec.project.hospitalAppointmentManagement.dto.response.ApiResponse;
import etec.project.hospitalAppointmentManagement.dto.response.AuthResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Endpoints for User Registration, Login, OTP Verification, and Password Management")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Creates a patient account (unverified) and sends a 6-digit OTP code to the email.")
    public ResponseEntity<ApiResponse<String>> register(@Valid @RequestBody RegisterRequest request) {
        String message = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(message));
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Verify account with OTP", description = "Validates the 6-digit OTP code sent after registration, marks account as verified, and returns a JWT token.")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyEmailOtp(@Valid @RequestBody VerifyOtpRequest request) {
        AuthResponse response = authService.verifyEmailOtp(request);
        return ResponseEntity.ok(ApiResponse.success("Account verified successfully!", response));
    }

    @PostMapping("/login")
    @Operation(summary = "User Login", description = "Authenticates with email and password, checks account verification, and returns a JWT token.")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful!", response));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Forgot Password", description = "Generates and sends a 6-digit password reset OTP to the user's registered email.")
    public ResponseEntity<ApiResponse<String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String message = authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset Password", description = "Validates the password reset OTP and updates the account password with BCrypt encryption.")
    public ResponseEntity<ApiResponse<String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        String message = authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @PostMapping("/resend-otp")
    @Operation(summary = "Resend OTP Code", description = "Generates and sends a fresh 6-digit OTP code to the user's email after previous code expiry.")
    public ResponseEntity<ApiResponse<String>> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        String message = authService.resendOtp(request);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @PostMapping("/google")
    @Operation(summary = "Sign in or sign up with Google", description = "Verifies a Google ID token and returns a JWT, creating a new PATIENT account on first sign-in.")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(@Valid @RequestBody GoogleAuthRequest request) {
        AuthResponse response = authService.googleLogin(request);
        return ResponseEntity.ok(ApiResponse.success("Signed in with Google successfully!", response));
    }
}
