package com.library.controller;

import com.library.dto.ApiResponse;
import com.library.entity.Book;
import com.library.entity.User;
import com.library.entity.Wishlist;
import com.library.repository.BookRepository;
import com.library.repository.WishlistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private BookRepository bookRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<Object>> getWishlist(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        List<Wishlist> wishlist = wishlistRepository.findByUserOrderByCreatedAtDesc(user);
        
        ApiResponse<Object> response = ApiResponse.success("Wishlist retrieved successfully");
        response.setData(Map.of("wishlist", wishlist, "count", wishlist.size()));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{bookId}")
    public ResponseEntity<ApiResponse<Object>> addToWishlist(
            @PathVariable Long bookId,
            Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            
            if (wishlistRepository.existsByUserAndBookId(user, bookId)) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Book already in wishlist"));
            }
            
            Book book = bookRepository.findById(bookId)
                    .orElseThrow(() -> new RuntimeException("Book not found"));
            
            Wishlist wishlist = new Wishlist(user, book);
            wishlistRepository.save(wishlist);
            
            ApiResponse<Object> response = ApiResponse.success("Book added to wishlist");
            response.setData(Map.of("wishlist", wishlist));
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{bookId}")
    @Transactional
    public ResponseEntity<ApiResponse<Object>> removeFromWishlist(
            @PathVariable Long bookId,
            Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            
            if (!wishlistRepository.existsByUserAndBookId(user, bookId)) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Book not in wishlist"));
            }
            
            wishlistRepository.deleteByUserAndBookId(user, bookId);
            return ResponseEntity.ok(ApiResponse.success("Book removed from wishlist"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @GetMapping("/check/{bookId}")
    public ResponseEntity<ApiResponse<Object>> checkInWishlist(
            @PathVariable Long bookId,
            Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        boolean inWishlist = wishlistRepository.existsByUserAndBookId(user, bookId);
        
        ApiResponse<Object> response = ApiResponse.success("Check completed");
        response.setData(Map.of("inWishlist", inWishlist));
        return ResponseEntity.ok(response);
    }
}
