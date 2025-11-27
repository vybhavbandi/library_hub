package com.library.service;

import com.library.entity.User;
import com.library.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Optional;

@Service
@Transactional
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmailAndIsActive(email, true)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    public User createUser(String name, String email, String password) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("User already exists with email: " + email);
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(User.Role.USER);
        user.setRefreshTokens(new HashSet<>());

        return userRepository.save(user);
    }

    public User createAdmin(String name, String email, String password) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("User already exists with email: " + email);
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(User.Role.ADMIN);
        user.setRefreshTokens(new HashSet<>());

        return userRepository.save(user);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmailAndIsActive(email, true);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public User updateUser(User user) {
        return userRepository.save(user);
    }

    public void addRefreshToken(User user, String refreshToken) {
        if (user.getRefreshTokens() == null) {
            user.setRefreshTokens(new HashSet<>());
        }
        
        // Clean up old tokens (keep only last 5)
        if (user.getRefreshTokens().size() >= 5) {
            user.getRefreshTokens().clear();
        }
        
        user.getRefreshTokens().add(refreshToken);
        userRepository.save(user);
    }

    public void removeRefreshToken(User user, String refreshToken) {
        if (user.getRefreshTokens() != null) {
            user.getRefreshTokens().remove(refreshToken);
            userRepository.save(user);
        }
    }

    public void removeAllRefreshTokens(User user) {
        if (user.getRefreshTokens() != null) {
            user.getRefreshTokens().clear();
            userRepository.save(user);
        }
    }

    public boolean hasValidRefreshToken(User user, String refreshToken) {
        return user.getRefreshTokens() != null && user.getRefreshTokens().contains(refreshToken);
    }

    public User updateProfile(User user, String name, String email) {
        if (name != null && !name.trim().isEmpty()) {
            user.setName(name.trim());
        }
        
        if (email != null && !email.trim().isEmpty() && !email.equals(user.getEmail())) {
            if (userRepository.existsByEmail(email)) {
                throw new RuntimeException("Email already in use by another account");
            }
            user.setEmail(email.trim());
        }
        
        return userRepository.save(user);
    }

    public void deactivateUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setIsActive(false);
        user.getRefreshTokens().clear();
        userRepository.save(user);
    }

    public long getTotalUserCount() {
        return userRepository.countByRoleAndIsActive(User.Role.USER, true);
    }
}
