package com.library.controller;

import com.library.dto.ApiResponse;
import com.library.dto.PaginationResponse;
import com.library.entity.Book;
import com.library.entity.BorrowRecord;
import com.library.entity.User;
import com.library.repository.UserRepository;
import com.library.service.BookService;
import com.library.service.BorrowRecordService;
import com.library.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private BookService bookService;

    @Autowired
    private UserService userService;

    @Autowired
    private BorrowRecordService borrowRecordService;

    @Autowired
    private UserRepository userRepository;

    // Dashboard endpoints
    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<Object>> getDashboardStats() {
        long totalBooks = bookService.getTotalBookCount();
        long totalUsers = userService.getTotalUserCount();
        long activeBorrowings = borrowRecordService.getActiveBorrowingsCount();
        long overdueBorrowings = borrowRecordService.getOverdueBorrowingsCount();
        BigDecimal totalFines = borrowRecordService.getTotalFines();
        
        Page<BorrowRecord> recentBorrows = borrowRecordService.getRecentBorrows(PageRequest.of(0, 10));
        List<Map<String, Object>> popularBooks = borrowRecordService.getPopularBooks();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalBooks", totalBooks);
        stats.put("totalUsers", totalUsers);
        stats.put("activeBorrowings", activeBorrowings);
        stats.put("overdueBorrowings", overdueBorrowings);
        stats.put("totalFines", totalFines);
        stats.put("recentBorrows", recentBorrows.getContent());
        stats.put("popularBooks", popularBooks);

        ApiResponse<Object> response = new ApiResponse<>(true, null, null);
        // Set stats directly on response to match Node.js format
        stats.forEach((key, value) -> {
            switch (key) {
                case "totalBooks" -> response.setData(Map.of("totalBooks", value));
                case "totalUsers" -> {
                    Map<String, Object> data = response.getData() != null ? 
                        new HashMap<>((Map<String, Object>) response.getData()) : new HashMap<>();
                    data.put("totalUsers", value);
                    response.setData(data);
                }
                case "activeBorrowings" -> {
                    Map<String, Object> data = response.getData() != null ? 
                        new HashMap<>((Map<String, Object>) response.getData()) : new HashMap<>();
                    data.put("activeBorrowings", value);
                    response.setData(data);
                }
                case "overdueBorrowings" -> {
                    Map<String, Object> data = response.getData() != null ? 
                        new HashMap<>((Map<String, Object>) response.getData()) : new HashMap<>();
                    data.put("overdueBorrowings", value);
                    response.setData(data);
                }
                case "totalFines" -> {
                    Map<String, Object> data = response.getData() != null ? 
                        new HashMap<>((Map<String, Object>) response.getData()) : new HashMap<>();
                    data.put("totalFines", value);
                    response.setData(data);
                }
                case "recentBorrows" -> {
                    Map<String, Object> data = response.getData() != null ? 
                        new HashMap<>((Map<String, Object>) response.getData()) : new HashMap<>();
                    data.put("recentBorrows", value);
                    response.setData(data);
                }
                case "popularBooks" -> {
                    Map<String, Object> data = response.getData() != null ? 
                        new HashMap<>((Map<String, Object>) response.getData()) : new HashMap<>();
                    data.put("popularBooks", value);
                    response.setData(data);
                }
            }
        });
        
        // Simpler approach - just return all stats
        response.setData(stats);
        response.setSuccess(true);

        return ResponseEntity.ok(response);
    }

    // Book management endpoints
    @GetMapping("/books")
    public ResponseEntity<ApiResponse<Object>> getAllBooksForAdmin(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "false") boolean includeInactive,
            @RequestParam(defaultValue = "title") String sortBy,
            @RequestParam(defaultValue = "asc") String sortOrder) {

        Pageable pageable = PageRequest.of(page - 1, limit);
        Page<Book> booksPage = bookService.getAllBooksForAdmin(includeInactive, pageable);
        
        PaginationResponse pagination = new PaginationResponse(
            page, 
            booksPage.getTotalPages(), 
            booksPage.getTotalElements(), 
            limit
        );

        ApiResponse<Object> response = ApiResponse.success("Books retrieved successfully");
        response.setData(Map.of("books", booksPage.getContent()));
        response.setPagination(pagination);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/books")
    public ResponseEntity<ApiResponse<Object>> createBook(@Valid @RequestBody Book book) {
        try {
            Book createdBook = bookService.createBook(book);
            
            ApiResponse<Object> response = ApiResponse.success("Book created successfully");
            response.setData(Map.of("book", createdBook));
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/books/{id}")
    public ResponseEntity<ApiResponse<Object>> updateBook(@PathVariable Long id, @Valid @RequestBody Book book) {
        try {
            Book updatedBook = bookService.updateBook(id, book);
            
            ApiResponse<Object> response = ApiResponse.success("Book updated successfully");
            response.setData(Map.of("book", updatedBook));
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/books/{id}")
    public ResponseEntity<ApiResponse<Object>> deleteBook(@PathVariable Long id) {
        try {
            bookService.deleteBook(id);
            return ResponseEntity.ok(ApiResponse.success("Book deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // User management endpoints
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<Object>> getAllUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "false") boolean includeInactive) {

        Pageable pageable = PageRequest.of(page - 1, limit);
        Page<User> usersPage;
        
        if (includeInactive) {
            // Include all users
            if (role != null) {
                User.Role roleEnum = User.Role.valueOf(role.toUpperCase());
                usersPage = userRepository.findAll(pageable);
            } else {
                usersPage = userRepository.findAll(pageable);
            }
        } else {
            // Only active users
            if (role != null) {
                User.Role roleEnum = User.Role.valueOf(role.toUpperCase());
                usersPage = userRepository.findByRoleAndIsActive(roleEnum, true, pageable);
            } else {
                usersPage = userRepository.findByIsActive(true, pageable);
            }
        }
        
        PaginationResponse pagination = new PaginationResponse(
            page, 
            usersPage.getTotalPages(), 
            usersPage.getTotalElements(), 
            limit
        );

        ApiResponse<Object> response = ApiResponse.success("Users retrieved successfully");
        response.setData(Map.of("users", usersPage.getContent()));
        response.setPagination(pagination);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Object>> updateUser(
            @PathVariable Long id, 
            @RequestBody Map<String, Object> updateData,
            Authentication authentication) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            User user = userService.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Prevent admin from deactivating themselves
            if (user.getId().equals(currentUser.getId()) && 
                updateData.containsKey("isActive") && 
                Boolean.FALSE.equals(updateData.get("isActive"))) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Cannot deactivate your own account"));
            }

            // Update role if provided
            if (updateData.containsKey("role")) {
                String roleStr = (String) updateData.get("role");
                user.setRole(User.Role.valueOf(roleStr.toUpperCase()));
            }

            // Update active status if provided
            if (updateData.containsKey("isActive")) {
                user.setIsActive((Boolean) updateData.get("isActive"));
            }

            User updatedUser = userService.updateUser(user);
            
            ApiResponse<Object> response = ApiResponse.success("User updated successfully");
            response.setUser(updatedUser);
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Object>> deleteUser(@PathVariable Long id, Authentication authentication) {
        try {
            User currentUser = (User) authentication.getPrincipal();
            
            if (currentUser.getId().equals(id)) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Cannot delete your own account"));
            }

            userService.deactivateUser(id);
            return ResponseEntity.ok(ApiResponse.success("User deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
