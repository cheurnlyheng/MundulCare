package etec.project.hospitalAppointmentManagement.Service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import etec.project.hospitalAppointmentManagement.Repo.OtpRepo;
import etec.project.hospitalAppointmentManagement.Repo.UserRepo;
import etec.project.hospitalAppointmentManagement.Security.JwtUtils;
import etec.project.hospitalAppointmentManagement.Service.AuthService;
import etec.project.hospitalAppointmentManagement.Service.EmailService;
import etec.project.hospitalAppointmentManagement.dto.request.*;
import etec.project.hospitalAppointmentManagement.dto.response.AuthResponse;
import etec.project.hospitalAppointmentManagement.entity.OtpVerification;
import etec.project.hospitalAppointmentManagement.entity.User;
import etec.project.hospitalAppointmentManagement.enums.AuthProvider;
import etec.project.hospitalAppointmentManagement.enums.OtpType;
import etec.project.hospitalAppointmentManagement.enums.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepo userRepo;
    private final OtpRepo otpRepo;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${google.client.id:}")
    private String googleClientId;

    // 1. REGISTER
    @Override
    public String register(RegisterRequest request) {
        Optional<User> existingUserOpt = userRepo.findByEmail(request.getEmail());

        User user;
        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();
            if (user.isVerified()) {
                throw new RuntimeException("Email already registered: " + request.getEmail());
            }

            checkOtpCooldown(user.getEmail(), OtpType.EMAIL_VERIFICATION);

            user.setName(request.getName());
            user.setPhone(request.getPhone());
            user.setPassword(passwordEncoder.encode(request.getPassword()));
            userRepo.save(user);
        } else {
            user = User.builder()
                    .name(request.getName())
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(request.getPassword()))
                    .phone(request.getPhone())
                    .role(Role.PATIENT)
                    .isActive(true)
                    .isVerified(false)
                    .build();

            userRepo.save(user);
        }

        otpRepo.invalidatePreviousOtps(user.getEmail(), OtpType.EMAIL_VERIFICATION);

        String otp = emailService.generateOtp();

        OtpVerification otpVerification = OtpVerification.builder()
                .user(user)
                .email(user.getEmail())
                .otp(otp)
                .type(OtpType.EMAIL_VERIFICATION)
                .expiresAt(LocalDateTime.now().plusMinutes(5)) // 5 minute expiration
                .isUsed(false)
                .build();

        otpRepo.save(otpVerification);

        emailService.sendOtpEmail(user.getEmail(), otp, OtpType.EMAIL_VERIFICATION);

        return "Registration successful! Please check your email for the 6-digit verification code.";
    }

    // 2. VERIFY EMAIL OTP
    @Override
    public AuthResponse verifyEmailOtp(VerifyOtpRequest request) {
        OtpVerification otpVerification = otpRepo.findTopByEmailAndTypeAndIsUsedFalseOrderByCreatedAtDesc(
                request.getEmail(),
                OtpType.EMAIL_VERIFICATION
        ).orElseThrow(() -> new RuntimeException("No active verification code found. Please request a new one."));

        if (!otpVerification.getOtp().equals(request.getOtp())) {
            throw new RuntimeException("Invalid OTP code. Please use the latest code sent to your email.");
        }

        if (otpVerification.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }

        otpVerification.setUsed(true);
        otpRepo.save(otpVerification);

        User user = userRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found."));
        user.setVerified(true);
        userRepo.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtils.generateToken(userDetails, user.getId(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .profileImage(user.getProfileImage())
                .authProvider(user.getAuthProvider())
                .build();
    }

    // 3. LOGIN
    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password."));

        if (user.getLockTime() != null) {
            if (user.getLockTime().isAfter(LocalDateTime.now())) {
                long remainingMinutes = java.time.Duration.between(LocalDateTime.now(), user.getLockTime()).toMinutes() + 1;
                throw new RuntimeException("Account is locked due to 5 failed attempts. Please try again in " + remainingMinutes + " minutes, or reset your password.");
            } else {
                user.setLockTime(null);
                user.setFailedLoginAttempts(0);
                userRepo.save(user);
            }
        }

        if (!user.isVerified()) {
            throw new RuntimeException("Account is not verified. Please verify your email before logging in.");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            if (user.getFailedLoginAttempts() > 0) {
                user.setFailedLoginAttempts(0);
                user.setLockTime(null);
                userRepo.save(user);
            }
        } catch (Exception e) {
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);

            if (attempts >= 5) {
                user.setLockTime(LocalDateTime.now().plusMinutes(15));
                userRepo.save(user);
                throw new RuntimeException("Account has been locked for 15 minutes due to 5 failed login attempts.");
            } else {
                userRepo.save(user);
                int remaining = 5 - attempts;
                throw new RuntimeException("Invalid email or password. You have " + remaining + " attempts remaining.");
            }
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtils.generateToken(userDetails, user.getId(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .profileImage(user.getProfileImage())
                .authProvider(user.getAuthProvider())
                .build();
    }

    // 4. FORGOT PASSWORD
    @Override
    public String forgotPassword(ForgotPasswordRequest request) {
        User user = userRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("No user found with email: " + request.getEmail()));

        checkOtpCooldown(user.getEmail(), OtpType.PASSWORD_RESET);

        otpRepo.invalidatePreviousOtps(user.getEmail(), OtpType.PASSWORD_RESET);

        String otp = emailService.generateOtp();

        OtpVerification otpVerification = OtpVerification.builder()
                .user(user)
                .email(user.getEmail())
                .otp(otp)
                .type(OtpType.PASSWORD_RESET)
                .expiresAt(LocalDateTime.now().plusMinutes(5)) // 5 minute expiration
                .isUsed(false)
                .build();

        otpRepo.save(otpVerification);

        emailService.sendOtpEmail(user.getEmail(), otp, OtpType.PASSWORD_RESET);

        return "Password reset OTP has been sent to your email.";
    }

    // 5. RESET PASSWORD
    @Override
    public String resetPassword(ResetPasswordRequest request) {
        OtpVerification otpVerification = otpRepo.findTopByEmailAndTypeAndIsUsedFalseOrderByCreatedAtDesc(
                request.getEmail(),
                OtpType.PASSWORD_RESET
        ).orElseThrow(() -> new RuntimeException("No active reset code found. Please request a new one."));

        if (!otpVerification.getOtp().equals(request.getOtp())) {
            throw new RuntimeException("Invalid OTP code. Please use the latest code sent to your email.");
        }

        if (otpVerification.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }

        otpVerification.setUsed(true);
        otpRepo.save(otpVerification);

        User user = userRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found."));

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new RuntimeException("New password must be different from your current password.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepo.save(user);

        return "Password has been reset successfully! You can now log in with your new password.";
    }

    // 6. RESEND OTP
    @Override
    public String resendOtp(ResendOtpRequest request) {
        User user = userRepo.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("No user found with email: " + request.getEmail()));

        if (request.getType() == OtpType.EMAIL_VERIFICATION && user.isVerified()) {
            throw new RuntimeException("Account is already verified. You can log in.");
        }

        checkOtpCooldown(user.getEmail(), request.getType());

        otpRepo.invalidatePreviousOtps(user.getEmail(), request.getType());

        String otp = emailService.generateOtp();

        OtpVerification otpVerification = OtpVerification.builder()
                .user(user)
                .email(user.getEmail())
                .otp(otp)
                .type(request.getType())
                .expiresAt(LocalDateTime.now().plusMinutes(5)) // 5 minute expiration
                .isUsed(false)
                .build();

        otpRepo.save(otpVerification);

        emailService.sendOtpEmail(user.getEmail(), otp, request.getType());

        return "A new 6-digit code has been sent to your email.";
    }

    // 7. GOOGLE SIGN-IN / SIGN-UP
    @Override
    @Transactional
    public AuthResponse googleLogin(GoogleAuthRequest request) {
        Map<String, String> claims = verifyGoogleIdToken(request.getIdToken());
        String email = claims.get("email");

        User user = userRepo.findByEmail(email).orElse(null);
        if (user == null) {
            user = User.builder()
                    .name(claims.get("name"))
                    .email(email)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role(Role.PATIENT)
                    .authProvider(AuthProvider.GOOGLE)
                    .profileImage(claims.get("picture"))
                    .isActive(true)
                    .isVerified(true)
                    .hasPassword(false)
                    .build();
            user = userRepo.save(user);
        } else if ((user.getProfileImage() == null || user.getProfileImage().isBlank()) && claims.get("picture") != null) {
            // Account already existed (e.g. registered with email/password first) - backfill
            // their Google photo since they don't have one of their own set yet.
            user.setProfileImage(claims.get("picture"));
            user = userRepo.save(user);
        }

        if (user.getLockTime() != null && user.getLockTime().isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Account is locked due to failed login attempts. Please try again later, or reset your password.");
        }
        if (!user.isActive()) {
            throw new RuntimeException("This account has been deactivated. Please contact support.");
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtUtils.generateToken(userDetails, user.getId(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .profileImage(user.getProfileImage())
                .authProvider(user.getAuthProvider())
                .build();
    }

    private Map<String, String> verifyGoogleIdToken(String idToken) {
        String response;
        try {
            response = restTemplate.getForObject(
                    "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken, String.class);
        } catch (Exception e) {
            throw new RuntimeException("Invalid or expired Google sign-in token.");
        }

        JsonNode node;
        try {
            node = objectMapper.readTree(response);
        } catch (Exception e) {
            throw new RuntimeException("Failed to read Google sign-in response.");
        }

        if (googleClientId != null && !googleClientId.isBlank()) {
            String audience = node.path("aud").asText("");
            if (!googleClientId.equals(audience)) {
                throw new RuntimeException("This Google sign-in token was not issued for this application.");
            }
        }

        String email = node.path("email").asText(null);
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Your Google account does not have an accessible email address.");
        }
        if (!node.path("email_verified").asBoolean(false)) {
            throw new RuntimeException("Your Google account email is not verified.");
        }

        Map<String, String> claims = new HashMap<>();
        claims.put("email", email);
        claims.put("name", node.path("name").asText(email));
        claims.put("picture", node.hasNonNull("picture") ? node.path("picture").asText() : null);
        return claims;
    }

    private void checkOtpCooldown(String email, OtpType type) {
        otpRepo.findTopByEmailAndTypeOrderByCreatedAtDesc(email, type)
                .ifPresent(lastOtp -> {
                    if (lastOtp.getCreatedAt() != null &&
                        lastOtp.getCreatedAt().isAfter(LocalDateTime.now().minusMinutes(1))) {
                        throw new RuntimeException("Please wait 1 minute before requesting another OTP code.");
                    }
                });
    }
}
