package etec.project.hospitalAppointmentManagement.entity;

import etec.project.hospitalAppointmentManagement.enums.AuthProvider;
import etec.project.hospitalAppointmentManagement.enums.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table (name = "users")
public class User {
    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;
    @Column (nullable = false)
    private String name;
    @Column (nullable = false, unique = true)
    private String email;
    @Column (nullable = false)
    private String password;

    private String phone;

    @Enumerated(EnumType.STRING)
    @Column (nullable = false)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider", nullable = false)
    @Builder.Default
    private AuthProvider authProvider = AuthProvider.LOCAL;

    private String profileImage;

    @Column (nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column (nullable = false)
    @Builder.Default
    private boolean isVerified = false;

    @Column(name = "failed_login_attempts", nullable = false)
    @Builder.Default
    private int failedLoginAttempts = 0;

    @Column(name = "lock_time")
    private LocalDateTime lockTime;

    // No-show strike tracking: a patient marked NO_SHOW twice is auto-locked out of
    // booking (not login) until an admin manually clears it - distinct from lockTime,
    // which is a temporary, self-expiring lock for failed login attempts.
    @Column(name = "no_show_count", nullable = false)
    @Builder.Default
    private int noShowCount = 0;

    // Self-cancellation strike tracking: a patient who cancels their own bookings 3 times
    // is auto-locked the same way a repeat no-show is - cancelling too often is still a
    // pattern of wasted doctor slots, even though each individual cancellation is harmless.
    @Column(name = "cancel_count", nullable = false)
    @Builder.Default
    private int cancelCount = 0;

    @Column(name = "booking_locked", nullable = false)
    @Builder.Default
    private boolean bookingLocked = false;

    // True once this account has a real, self-chosen password. LOCAL accounts always start
    // true (they set one at registration). GOOGLE accounts start false since their stored
    // password is a random placeholder they never see - until they explicitly set one via
    // the "Set Password" flow, after which they behave exactly like a LOCAL account
    // (changing it again requires the current one, same as everyone else).
    @Column(name = "has_password", nullable = false)
    @Builder.Default
    private boolean hasPassword = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;



}
