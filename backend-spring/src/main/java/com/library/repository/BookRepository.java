package com.library.repository;

import com.library.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    
    Optional<Book> findByIdAndIsActive(Long id, Boolean isActive);
    
    Page<Book> findByIsActive(Boolean isActive, Pageable pageable);
    
    Page<Book> findByGenreIgnoreCaseAndIsActive(String genre, Boolean isActive, Pageable pageable);
    
    Page<Book> findByPublishedYearAndIsActive(Integer publishedYear, Boolean isActive, Pageable pageable);
    
    Page<Book> findByGenreIgnoreCaseAndPublishedYearAndIsActive(String genre, Integer publishedYear, Boolean isActive, Pageable pageable);
    
    @Query("SELECT b FROM Book b WHERE b.isActive = true AND " +
           "(LOWER(b.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(b.author) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(b.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Book> searchBooks(@Param("query") String query, Pageable pageable);
    
    @Query("SELECT b FROM Book b WHERE b.isActive = true AND " +
           "(LOWER(b.title) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(b.author) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(b.description) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:genre IS NULL OR LOWER(b.genre) = LOWER(:genre)) AND " +
           "(:author IS NULL OR LOWER(b.author) LIKE LOWER(CONCAT('%', :author, '%'))) AND " +
           "(:yearFrom IS NULL OR b.publishedYear >= :yearFrom) AND " +
           "(:yearTo IS NULL OR b.publishedYear <= :yearTo) AND " +
           "(:available IS NULL OR " +
           " (CASE WHEN :available = true THEN b.availableCopies > 0 ELSE b.availableCopies = 0 END))")
    Page<Book> searchBooksWithAdvancedFilters(@Param("query") String query,
                                            @Param("genre") String genre,
                                            @Param("author") String author,
                                            @Param("yearFrom") Integer yearFrom,
                                            @Param("yearTo") Integer yearTo,
                                            @Param("available") Boolean available,
                                            Pageable pageable);
    
    @Query("SELECT COUNT(b) FROM Book b WHERE b.isActive = true")
    long countActiveBooks();
    
    boolean existsByIsbn(String isbn);
    
    boolean existsByIsbnAndIdNot(String isbn, Long id);
}
