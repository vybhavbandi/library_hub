package com.library.controller;

import com.library.dto.ApiResponse;
import com.library.dto.PaginationResponse;
import com.library.entity.Book;
import com.library.entity.BorrowRecord;
import com.library.entity.User;
import com.library.service.BookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/books")
public class BookController {

    @Autowired
    private BookService bookService;

    @GetMapping
    public ResponseEntity<ApiResponse<Object>> getAllBooks(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "12") int limit,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) Integer publishedYear,
            @RequestParam(defaultValue = "title") String sortBy,
            @RequestParam(defaultValue = "asc") String sortOrder) {

        Sort.Direction direction = sortOrder.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(direction, sortBy));

        Page<Book> booksPage = bookService.getAllBooks(genre, publishedYear, pageable);
        
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

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Object>> searchBooks(
            @RequestParam String q,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "12") int limit,
            @RequestParam(required = false) String genre,
            @RequestParam(required = false) String author,
            @RequestParam(required = false) Integer yearFrom,
            @RequestParam(required = false) Integer yearTo,
            @RequestParam(required = false) Boolean available,
            @RequestParam(defaultValue = "title") String sortBy,
            @RequestParam(defaultValue = "asc") String sortOrder) {

        Sort.Direction direction = sortOrder.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page - 1, limit, Sort.by(direction, sortBy));

        Page<Book> booksPage = bookService.searchBooks(q, genre, author, yearFrom, yearTo, available, pageable);

        PaginationResponse pagination = new PaginationResponse(
            page,
            booksPage.getTotalPages(),
            booksPage.getTotalElements(),
            limit
        );

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("books", booksPage.getContent());
        responseData.put("searchQuery", q);

        ApiResponse<Object> response = ApiResponse.success("Search completed successfully");
        response.setData(responseData);
        response.setPagination(pagination);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Object>> getBookById(@PathVariable Long id) {
        return bookService.getBookById(id)
                .map(book -> {
                    ApiResponse<Object> response = ApiResponse.success("Book retrieved successfully");
                    response.setData(book);
                    return ResponseEntity.ok(response);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/borrow")
    public ResponseEntity<ApiResponse<Object>> borrowBook(@PathVariable Long id, Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            BorrowRecord borrowRecord = bookService.borrowBook(id, user);
            
            ApiResponse<Object> response = ApiResponse.success("Book borrowed successfully");
            response.setData(Map.of("borrowRecord", borrowRecord));
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{id}/reserve")
    public ResponseEntity<ApiResponse<Object>> reserveBook(@PathVariable Long id, Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            String message = bookService.reserveBook(id, user);
            
            Book book = bookService.getBookById(id)
                    .orElseThrow(() -> new RuntimeException("Book not found"));
            
            ApiResponse<Object> response = ApiResponse.success(message);
            response.setData(Map.of("book", book));
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PostMapping("/{id}/return")
    public ResponseEntity<ApiResponse<Object>> returnBook(@PathVariable Long id, Authentication authentication) {
        try {
            User user = (User) authentication.getPrincipal();
            BorrowRecord borrowRecord = bookService.returnBook(id, user);
            
            ApiResponse<Object> response = ApiResponse.success("Book returned successfully");
            response.setData(Map.of("borrowRecord", borrowRecord));
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
