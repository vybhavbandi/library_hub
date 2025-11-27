package com.library.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "borrow_records")
@EntityListeners(AuditingEntityListener.class)
public class BorrowRecord {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    @NotNull(message = "User is required")
    private User user;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "book_id", nullable = false)
    @NotNull(message = "Book is required")
    private Book book;
    
    @Column(nullable = false)
    private LocalDateTime borrowedAt = LocalDateTime.now();
    
    @Column(nullable = false)
    private LocalDateTime dueAt;
    
    private LocalDateTime returnedAt;
    
    @Min(value = 0, message = "Renewed count cannot be negative")
    @Max(value = 2, message = "Maximum 2 renewals allowed")
    @Column(nullable = false)
    private Integer renewedCount = 0;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.BORROWED;
    
    @Min(value = 0, message = "Fine amount cannot be negative")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal fineAmount = BigDecimal.ZERO;
    
    @Column(nullable = false)
    private Boolean finePaid = false;
    
    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    @Column(length = 500)
    private String notes;
    
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    // Constructors
    public BorrowRecord() {}
    
    public BorrowRecord(User user, Book book) {
        this.user = user;
        this.book = book;
        this.dueAt = LocalDateTime.now().plusDays(14); // Default 14 days
    }
    
    // Business methods
    public boolean isOverdue() {
        return status == Status.BORROWED && LocalDateTime.now().isAfter(dueAt);
    }
    
    public void renew() {
        if (renewedCount >= 2) {
            throw new IllegalStateException("Maximum renewals exceeded");
        }
        if (status != Status.BORROWED && status != Status.RENEWED) {
            throw new IllegalStateException("Can only renew active borrows");
        }
        
        this.dueAt = this.dueAt.plusDays(14);
        this.renewedCount++;
        this.status = Status.RENEWED;
    }
    
    public void returnBook() {
        this.returnedAt = LocalDateTime.now();
        this.status = Status.RETURNED;
        
        // Calculate fine if overdue
        if (returnedAt.isAfter(dueAt)) {
            long daysOverdue = java.time.Duration.between(dueAt, returnedAt).toDays();
            this.fineAmount = BigDecimal.valueOf(daysOverdue * 1.0); // $1 per day
        }
    }
    
    public void updateStatus() {
        if (returnedAt != null) {
            status = Status.RETURNED;
        } else if (LocalDateTime.now().isAfter(dueAt) && status == Status.BORROWED) {
            status = Status.OVERDUE;
            // Calculate fine
            long daysOverdue = java.time.Duration.between(dueAt, LocalDateTime.now()).toDays();
            this.fineAmount = BigDecimal.valueOf(daysOverdue * 1.0);
        }
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public Book getBook() {
        return book;
    }
    
    public void setBook(Book book) {
        this.book = book;
    }
    
    public LocalDateTime getBorrowedAt() {
        return borrowedAt;
    }
    
    public void setBorrowedAt(LocalDateTime borrowedAt) {
        this.borrowedAt = borrowedAt;
    }
    
    public LocalDateTime getDueAt() {
        return dueAt;
    }
    
    public void setDueAt(LocalDateTime dueAt) {
        this.dueAt = dueAt;
    }
    
    public LocalDateTime getReturnedAt() {
        return returnedAt;
    }
    
    public void setReturnedAt(LocalDateTime returnedAt) {
        this.returnedAt = returnedAt;
    }
    
    public Integer getRenewedCount() {
        return renewedCount;
    }
    
    public void setRenewedCount(Integer renewedCount) {
        this.renewedCount = renewedCount;
    }
    
    public Status getStatus() {
        return status;
    }
    
    public void setStatus(Status status) {
        this.status = status;
    }
    
    public BigDecimal getFineAmount() {
        return fineAmount;
    }
    
    public void setFineAmount(BigDecimal fineAmount) {
        this.fineAmount = fineAmount;
    }
    
    public Boolean getFinePaid() {
        return finePaid;
    }
    
    public void setFinePaid(Boolean finePaid) {
        this.finePaid = finePaid;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public enum Status {
        BORROWED, RETURNED, OVERDUE, RENEWED
    }
}
