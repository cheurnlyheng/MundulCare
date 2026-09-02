package etec.project.hospitalAppointmentManagement.Security;

import etec.project.hospitalAppointmentManagement.Repo.UserRepo;
import etec.project.hospitalAppointmentManagement.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CustomerUserDetailsService implements UserDetailsService {
    private final UserRepo userRepo;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        boolean isAccountLocked = user.getLockTime() != null && user.getLockTime().isAfter(LocalDateTime.now());

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .disabled(!user.isActive())
                .accountLocked(isAccountLocked) // Only locked if brute-force lockTime is active
                .authorities("ROLE_" + user.getRole().name())
                .build();
    }
}
