package com.library.service;

import com.library.entity.BorrowRecord;
import com.library.entity.User;
import com.library.repository.BorrowRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class BorrowRecordService {

    @Autowired
    private BorrowRecordRepository borrowRecordRepository;

    public Page<BorrowRecord> getUserBorrowHistory(User user, BorrowRecord.Status status, Pageable pageable) {
        if (status != null) {
            return borrowRecordRepository.findByUserAndStatusOrderByBorrowedAtDesc(user, status, pageable);
        } else {
            return borrowRecordRepository.findByUserOrderByBorrowedAtDesc(user, pageable);
        }
    }

    public List<BorrowRecord> getUserActiveBorrows(User user) {
        List<BorrowRecord.Status> activeStatuses = List.of(
            BorrowRecord.Status.BORROWED, 
            BorrowRecord.Status.OVERDUE, 
            BorrowRecord.Status.RENEWED
        );
        return borrowRecordRepository.findByUserAndStatusIn(user, activeStatuses);
    }

    public BorrowRecord renewBook(Long borrowId, User user) {
        BorrowRecord borrowRecord = borrowRecordRepository.findById(borrowId)
                .orElseThrow(() -> new RuntimeException("Borrow record not found"));

        if (!borrowRecord.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You can only renew your own borrows");
        }

        List<BorrowRecord.Status> renewableStatuses = List.of(
            BorrowRecord.Status.BORROWED, 
            BorrowRecord.Status.RENEWED
        );
        
        if (!renewableStatuses.contains(borrowRecord.getStatus())) {
            throw new RuntimeException("Borrow record not found or cannot be renewed");
        }

        borrowRecord.renew();
        return borrowRecordRepository.save(borrowRecord);
    }

    public Map<String, Object> getUserStats(User user) {
        long totalBorrows = borrowRecordRepository.countByUser(user);
        long activeBorrows = borrowRecordRepository.countByUserAndStatus(user, BorrowRecord.Status.BORROWED) +
                           borrowRecordRepository.countByUserAndStatus(user, BorrowRecord.Status.RENEWED);
        long overdueBorrows = borrowRecordRepository.countByUserAndStatus(user, BorrowRecord.Status.OVERDUE);
        long returnedBooks = borrowRecordRepository.countByUserAndStatus(user, BorrowRecord.Status.RETURNED);
        BigDecimal totalFines = borrowRecordRepository.getTotalFinesByUser(user);

        // Get favorite genres
        List<Object[]> genreStats = borrowRecordRepository.findUserFavoriteGenres(user, PageRequest.of(0, 5));
        List<Map<String, Object>> favoriteGenres = genreStats.stream()
                .map(row -> Map.of(
                    "_id", row[0] != null ? row[0] : "Unknown",
                    "count", row[1]
                ))
                .collect(Collectors.toList());

        return Map.of(
            "totalBorrows", totalBorrows,
            "activeBorrows", activeBorrows,
            "overdueBorrows", overdueBorrows,
            "returnedBooks", returnedBooks,
            "totalFines", totalFines != null ? totalFines : BigDecimal.ZERO,
            "favoriteGenres", favoriteGenres
        );
    }

    // Admin methods
    public long getActiveBorrowingsCount() {
        List<BorrowRecord.Status> activeStatuses = List.of(
            BorrowRecord.Status.BORROWED, 
            BorrowRecord.Status.RENEWED
        );
        return borrowRecordRepository.countByStatusIn(activeStatuses);
    }

    public long getOverdueBorrowingsCount() {
        return borrowRecordRepository.countByStatus(BorrowRecord.Status.OVERDUE);
    }

    public BigDecimal getTotalFines() {
        BigDecimal total = borrowRecordRepository.getTotalFines();
        return total != null ? total : BigDecimal.ZERO;
    }

    public Page<BorrowRecord> getRecentBorrows(Pageable pageable) {
        List<BorrowRecord.Status> activeStatuses = List.of(
            BorrowRecord.Status.BORROWED, 
            BorrowRecord.Status.OVERDUE, 
            BorrowRecord.Status.RENEWED
        );
        return borrowRecordRepository.findByStatusInOrderByBorrowedAtDesc(activeStatuses, pageable);
    }

    public List<Map<String, Object>> getPopularBooks() {
        Page<Object[]> popularBooks = borrowRecordRepository.findMostBorrowedBooks(PageRequest.of(0, 5));
        
        return popularBooks.getContent().stream()
                .map(row -> Map.of(
                    "book", Map.of(
                        "id", row[0],
                        "title", row[1],
                        "author", row[2]
                    ),
                    "borrowCount", row[3]
                ))
                .collect(Collectors.toList());
    }
}
