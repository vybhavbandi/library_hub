package com.library.service;

import com.library.entity.Book;
import com.library.entity.BorrowRecord;
import com.library.entity.User;
import com.library.repository.BookRepository;
import com.library.repository.BorrowRecordRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class BookService {

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private BorrowRecordRepository borrowRecordRepository;

    public Page<Book> getAllBooks(Pageable pageable) {
        return bookRepository.findByIsActive(true, pageable);
    }

    public Page<Book> getAllBooks(String genre, Integer publishedYear, Pageable pageable) {
        if (genre != null && publishedYear != null) {
            return bookRepository.findByGenreIgnoreCaseAndPublishedYearAndIsActive(genre, publishedYear, true, pageable);
        } else if (genre != null) {
            return bookRepository.findByGenreIgnoreCaseAndIsActive(genre, true, pageable);
        } else if (publishedYear != null) {
            return bookRepository.findByPublishedYearAndIsActive(publishedYear, true, pageable);
        } else {
            return bookRepository.findByIsActive(true, pageable);
        }
    }

    public Page<Book> searchBooks(String query, String genre, String author, Integer yearFrom, Integer yearTo, Boolean available, Pageable pageable) {
        if (genre != null || author != null || yearFrom != null || yearTo != null || available != null) {
            return bookRepository.searchBooksWithAdvancedFilters(query, genre, author, yearFrom, yearTo, available, pageable);
        } else {
            return bookRepository.searchBooks(query, pageable);
        }
    }

    public Optional<Book> getBookById(Long id) {
        return bookRepository.findByIdAndIsActive(id, true);
    }

    public Book createBook(Book book) {
        if (book.getIsbn() != null && bookRepository.existsByIsbn(book.getIsbn())) {
            throw new RuntimeException("A book with this ISBN already exists");
        }
        
        if (book.getAvailableCopies() == null) {
            book.setAvailableCopies(book.getTotalCopies());
        }
        
        return bookRepository.save(book);
    }

    public Book updateBook(Long id, Book bookDetails) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        if (bookDetails.getIsbn() != null && 
            bookRepository.existsByIsbnAndIdNot(bookDetails.getIsbn(), id)) {
            throw new RuntimeException("A book with this ISBN already exists");
        }

        book.setTitle(bookDetails.getTitle());
        book.setAuthor(bookDetails.getAuthor());
        book.setIsbn(bookDetails.getIsbn());
        book.setGenre(bookDetails.getGenre());
        book.setPublishedYear(bookDetails.getPublishedYear());
        book.setDescription(bookDetails.getDescription());
        book.setCoverImage(bookDetails.getCoverImage());
        book.setTotalCopies(bookDetails.getTotalCopies());
        book.setAvailableCopies(bookDetails.getAvailableCopies());
        book.setLocation(bookDetails.getLocation());
        book.setTags(bookDetails.getTags());

        return bookRepository.save(book);
    }

    public void deleteBook(Long id) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        // Check if book has active borrows
        List<BorrowRecord.Status> activeStatuses = List.of(
            BorrowRecord.Status.BORROWED, 
            BorrowRecord.Status.OVERDUE, 
            BorrowRecord.Status.RENEWED
        );
        
        long activeBorrows = borrowRecordRepository.countByStatusIn(activeStatuses);
        if (activeBorrows > 0) {
            throw new RuntimeException("Cannot delete book with active borrows");
        }

        book.setIsActive(false);
        bookRepository.save(book);
    }

    public BorrowRecord borrowBook(Long bookId, User user) {
        Book book = getBookById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        if (!book.isAvailable()) {
            throw new RuntimeException("No copies available for borrowing");
        }

        // Check if user already has this book borrowed
        List<BorrowRecord.Status> activeStatuses = List.of(
            BorrowRecord.Status.BORROWED, 
            BorrowRecord.Status.OVERDUE, 
            BorrowRecord.Status.RENEWED
        );
        
        Optional<BorrowRecord> existingBorrow = borrowRecordRepository
                .findByUserAndBookIdAndStatusIn(user, bookId, activeStatuses);
        
        if (existingBorrow.isPresent()) {
            throw new RuntimeException("You already have this book borrowed");
        }

        // Check user's active borrows limit (max 5 books)
        long activeBorrows = borrowRecordRepository.countByUserAndStatusIn(user, activeStatuses);
        if (activeBorrows >= 5) {
            throw new RuntimeException("You have reached the maximum borrowing limit (5 books)");
        }

        // Create borrow record
        BorrowRecord borrowRecord = new BorrowRecord(user, book);
        borrowRecord = borrowRecordRepository.save(borrowRecord);

        // Update book availability
        book.borrowCopy();
        bookRepository.save(book);

        return borrowRecord;
    }

    public BorrowRecord returnBook(Long bookId, User user) {
        Book book = getBookById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        List<BorrowRecord.Status> activeStatuses = List.of(
            BorrowRecord.Status.BORROWED, 
            BorrowRecord.Status.OVERDUE, 
            BorrowRecord.Status.RENEWED
        );
        
        BorrowRecord borrowRecord = borrowRecordRepository
                .findByUserAndBookIdAndStatusIn(user, bookId, activeStatuses)
                .orElseThrow(() -> new RuntimeException("No active borrow record found for this book"));

        // Update borrow record
        borrowRecord.returnBook();
        borrowRecord = borrowRecordRepository.save(borrowRecord);

        // Update book availability
        book.returnCopy();
        bookRepository.save(book);

        return borrowRecord;
    }

    public String reserveBook(Long bookId, User user) {
        Book book = getBookById(bookId)
                .orElseThrow(() -> new RuntimeException("Book not found"));

        // For now, just return success message (reservation logic can be extended)
        return "Book reserved successfully (feature coming soon)";
    }

    public long getTotalBookCount() {
        return bookRepository.countActiveBooks();
    }

    // Admin methods
    public Page<Book> getAllBooksForAdmin(boolean includeInactive, Pageable pageable) {
        if (includeInactive) {
            return bookRepository.findAll(pageable);
        } else {
            return bookRepository.findByIsActive(true, pageable);
        }
    }
}
