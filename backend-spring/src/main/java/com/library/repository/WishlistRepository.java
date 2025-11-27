package com.library.repository;

import com.library.entity.Wishlist;
import com.library.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    
    List<Wishlist> findByUserOrderByCreatedAtDesc(User user);
    
    Optional<Wishlist> findByUserAndBookId(User user, Long bookId);
    
    boolean existsByUserAndBookId(User user, Long bookId);
    
    void deleteByUserAndBookId(User user, Long bookId);
    
    long countByUser(User user);
}
