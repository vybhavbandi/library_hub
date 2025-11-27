package com.library.repository;

import com.library.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    Optional<User> findByEmailAndIsActive(String email, Boolean isActive);
    
    boolean existsByEmail(String email);
    
    Page<User> findByIsActive(Boolean isActive, Pageable pageable);
    
    Page<User> findByRoleAndIsActive(User.Role role, Boolean isActive, Pageable pageable);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.isActive = :isActive")
    long countByRoleAndIsActive(@Param("role") User.Role role, @Param("isActive") Boolean isActive);
    
    @Query("SELECT u FROM User u JOIN u.refreshTokens rt WHERE rt = :refreshToken")
    Optional<User> findByRefreshToken(@Param("refreshToken") String refreshToken);
}
