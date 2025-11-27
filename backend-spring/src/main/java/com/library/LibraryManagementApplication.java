package com.library;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class LibraryManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(LibraryManagementApplication.class, args);
        System.out.println("🚀 Library Management System Backend is running!");
        System.out.println("📚 API available at: http://localhost:8081");
        System.out.println("🔍 H2 Console: http://localhost:8081/h2-console");
        System.out.println("📊 Health Check: http://localhost:8081/actuator/health");
    }
}
