package com.library.controller;

import com.library.dto.ApiResponse;
import com.library.dto.PaginationResponse;
import com.library.entity.BorrowRecord;
import com.library.entity.User;
import com.library.service.BorrowRecordService;
import com.library.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private BorrowRecordService borrowRecordService;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Object>> getProfile(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        
        // Create response data matching Node.js format
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("name", user.getName());
        userData.put("email", user.getEmail());
        userData.put("role", user.getRole().name().toLowerCase());
        userData.put("isActive", user.getIsActive());
        userData.put("createdAt", user.getCreatedAt());
        userData.put("updatedAt", user.getUpdatedAt());
        
        // Set data directly on response to match Node.js format
        ApiResponse<Object> response = new ApiResponse<>(true, null, null);
        // Copy all user properties to the response root level
        response.setData(userData);
        
        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<Object>> updateProfile(
            @Valid @RequestBody Map<String, String> updateData, 
            Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            
            String name = updateData.get("name");
            String email = updateData.get("email");
            
            User updatedUser = userService.updateProfile(user, name, email);
            
            ApiResponse<Object> response = ApiResponse.success("Profile updated successfully");
            response.setUser(updatedUser);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/borrow-history")
    public ResponseEntity<ApiResponse<Object>> getBorrowHistory(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String status,
            Authentication authentication) {

        User user = (User) authentication.getPrincipal();
        Pageable pageable = PageRequest.of(page - 1, limit);
        
        BorrowRecord.Status statusEnum = null;
        if (status != null) {
            try {
                statusEnum = BorrowRecord.Status.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Invalid status"));
            }
        }

        Page<BorrowRecord> historyPage = borrowRecordService.getUserBorrowHistory(user, statusEnum, pageable);
        
        PaginationResponse pagination = new PaginationResponse(
            page, 
            historyPage.getTotalPages(), 
            historyPage.getTotalElements(), 
            limit
        );

        ApiResponse<Object> response = ApiResponse.success("Borrow history retrieved successfully");
        response.setData(historyPage.getContent());
        response.setPagination(pagination);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/active-borrows")
    public ResponseEntity<ApiResponse<Object>> getActiveBorrows(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<BorrowRecord> activeBorrows = borrowRecordService.getUserActiveBorrows(user);
        
        ApiResponse<Object> response = ApiResponse.success("Active borrows retrieved successfully");
        response.setData(Map.of(
            "data", activeBorrows,
            "count", activeBorrows.size()
        ));

        return ResponseEntity.ok(response);
    }

    @PostMapping("/renew/{borrowId}")
    public ResponseEntity<ApiResponse<Object>> renewBook(@PathVariable Long borrowId, Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            BorrowRecord borrowRecord = borrowRecordService.renewBook(borrowId, user);
            
            ApiResponse<Object> response = ApiResponse.success("Book renewed successfully");
            response.setData(Map.of("borrowRecord", borrowRecord));
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Object>> getUserStats(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Map<String, Object> stats = borrowRecordService.getUserStats(user);
        
        ApiResponse<Object> response = ApiResponse.success("User statistics retrieved successfully");
        response.setData(Map.of("stats", stats));

        return ResponseEntity.ok(response);
    }
}
