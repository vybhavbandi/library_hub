package com.library.controller;

import com.library.dto.ApiResponse;
import com.library.dto.AuthRequest;
import com.library.dto.RegisterRequest;
import com.library.entity.User;
import com.library.security.JwtTokenProvider;
import com.library.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        System.out.println("🔥 TEST ENDPOINT HIT!");
        return ResponseEntity.ok("Auth controller is working!");
    }

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserService userService;

    @Autowired
    private JwtTokenProvider tokenProvider;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Object>> register(@Valid @RequestBody RegisterRequest request) {
        try {
            User user = userService.createUser(request.getName(), request.getEmail(), request.getPassword());
            
            String accessToken = tokenProvider.generateAccessToken(user.getEmail());
            String refreshToken = tokenProvider.generateRefreshToken(user.getEmail());
            
            userService.addRefreshToken(user, refreshToken);
            
            ApiResponse<Object> response = ApiResponse.success("User registered successfully");
            response.setAccessToken(accessToken);
            response.setRefreshToken(refreshToken);
            response.setUser(user);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Object>> login(@RequestBody AuthRequest request) {
        System.out.println("🚀 LOGIN ENDPOINT REACHED!");
        System.out.println("🚀 Request received: " + request);
        
        if (request == null) {
            System.out.println("❌ Request is null!");
            return ResponseEntity.badRequest().body(ApiResponse.error("Request is null"));
        }
        
        if (request.getEmail() == null) {
            System.out.println("❌ Email is null!");
            return ResponseEntity.badRequest().body(ApiResponse.error("Email is required"));
        }
        
        if (request.getPassword() == null) {
            System.out.println("❌ Password is null!");
            return ResponseEntity.badRequest().body(ApiResponse.error("Password is required"));
        }
        try {
            System.out.println("=== LOGIN ATTEMPT ===");
            System.out.println("Email: " + request.getEmail());
            System.out.println("Password length: " + request.getPassword().length());
            
            // Check if user exists first
            User user = userService.findByEmail(request.getEmail()).orElse(null);
            if (user == null) {
                System.out.println("❌ User not found: " + request.getEmail());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("User not found"));
            }
            
            System.out.println("✅ User found: " + user.getEmail());
            System.out.println("✅ User active: " + user.getIsActive());
            System.out.println("✅ User role: " + user.getRole());
            System.out.println("✅ Stored password hash: " + user.getPassword().substring(0, 20) + "...");
            
            // Test password encoding
            boolean passwordMatches = passwordEncoder.matches(request.getPassword(), user.getPassword());
            System.out.println("✅ Password matches: " + passwordMatches);
            
            if (!passwordMatches) {
                System.out.println("❌ Password does not match!");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Invalid password"));
            }
            
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            User authenticatedUser = (User) authentication.getPrincipal();
            
            String accessToken = tokenProvider.generateAccessToken(authenticatedUser.getEmail());
            String refreshToken = tokenProvider.generateRefreshToken(authenticatedUser.getEmail());
            
            userService.addRefreshToken(authenticatedUser, refreshToken);
            
            ApiResponse<Object> response = ApiResponse.success("Login successful");
            response.setAccessToken(accessToken);
            response.setRefreshToken(refreshToken);
            response.setUser(authenticatedUser);
            
            System.out.println("✅ Login successful for: " + authenticatedUser.getEmail());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.out.println("❌ Login failed: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid email or password: " + e.getMessage()));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Object>> refreshToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        
        if (refreshToken == null || refreshToken.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Refresh token required"));
        }

        try {
            if (!tokenProvider.validateRefreshToken(refreshToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Invalid refresh token"));
            }

            String email = tokenProvider.getEmailFromRefreshToken(refreshToken);
            User user = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (!userService.hasValidRefreshToken(user, refreshToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(ApiResponse.error("Invalid refresh token"));
            }

            String newAccessToken = tokenProvider.generateAccessToken(user.getEmail());
            
            ApiResponse<Object> response = ApiResponse.success("Token refreshed successfully");
            response.setAccessToken(newAccessToken);
            response.setUser(user);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Token refresh failed"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Object>> logout(@RequestBody(required = false) Map<String, String> request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.getPrincipal() instanceof User) {
                User user = (User) authentication.getPrincipal();
                
                if (request != null && request.containsKey("refreshToken")) {
                    userService.removeRefreshToken(user, request.get("refreshToken"));
                } else {
                    userService.removeAllRefreshTokens(user);
                }
            }
            
            return ResponseEntity.ok(ApiResponse.success("Logout successful"));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.success("Logout successful"));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<User>> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User user = (User) authentication.getPrincipal();
            ApiResponse<User> response = ApiResponse.success("User retrieved successfully");
            response.setUser(user);
            return ResponseEntity.ok(response);
        }
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("User not authenticated"));
    }
}
