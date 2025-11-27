package com.library.repository;

import com.library.entity.BorrowRecord;
import com.library.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface BorrowRecordRepository extends JpaRepository<BorrowRecord, Long> {
    
    Page<BorrowRecord> findByUserOrderByBorrowedAtDesc(User user, Pageable pageable);
    
    Page<BorrowRecord> findByUserAndStatusOrderByBorrowedAtDesc(User user, BorrowRecord.Status status, Pageable pageable);
    
    List<BorrowRecord> findByUserAndStatusIn(User user, List<BorrowRecord.Status> statuses);
    
    Optional<BorrowRecord> findByUserAndBookIdAndStatusIn(User user, Long bookId, List<BorrowRecord.Status> statuses);
    
    long countByUserAndStatusIn(User user, List<BorrowRecord.Status> statuses);
    
    @Query("SELECT COUNT(br) FROM BorrowRecord br WHERE br.status IN :statuses")
    long countByStatusIn(@Param("statuses") List<BorrowRecord.Status> statuses);
    
    @Query("SELECT SUM(br.fineAmount) FROM BorrowRecord br")
    BigDecimal getTotalFines();
    
    @Query("SELECT br FROM BorrowRecord br WHERE br.status IN :statuses ORDER BY br.borrowedAt DESC")
    Page<BorrowRecord> findByStatusInOrderByBorrowedAtDesc(@Param("statuses") List<BorrowRecord.Status> statuses, Pageable pageable);
    
    @Query("SELECT br.book.id as bookId, br.book.title as title, br.book.author as author, COUNT(br) as borrowCount " +
           "FROM BorrowRecord br " +
           "GROUP BY br.book.id, br.book.title, br.book.author " +
           "ORDER BY COUNT(br) DESC")
    Page<Object[]> findMostBorrowedBooks(Pageable pageable);
    
    @Query("SELECT br.book.genre as genre, COUNT(br) as count " +
           "FROM BorrowRecord br " +
           "WHERE br.user = :user AND br.book.genre IS NOT NULL " +
           "GROUP BY br.book.genre " +
           "ORDER BY COUNT(br) DESC")
    List<Object[]> findUserFavoriteGenres(@Param("user") User user, Pageable pageable);
    
    // Statistics queries
    @Query("SELECT COUNT(br) FROM BorrowRecord br WHERE br.user = :user")
    long countByUser(@Param("user") User user);
    
    @Query("SELECT COUNT(br) FROM BorrowRecord br WHERE br.user = :user AND br.status = :status")
    long countByUserAndStatus(@Param("user") User user, @Param("status") BorrowRecord.Status status);
    
    @Query("SELECT COUNT(br) FROM BorrowRecord br WHERE br.status = :status")
    long countByStatus(@Param("status") BorrowRecord.Status status);
    
    @Query("SELECT SUM(br.fineAmount) FROM BorrowRecord br WHERE br.user = :user")
    BigDecimal getTotalFinesByUser(@Param("user") User user);
}
