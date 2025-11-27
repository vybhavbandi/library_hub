package com.library.config;

import com.library.entity.Book;
import com.library.entity.BorrowRecord;
import com.library.entity.User;
import com.library.repository.BookRepository;
import com.library.repository.BorrowRecordRepository;
import com.library.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private BorrowRecordRepository borrowRecordRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            initializeData();
        }
    }

    private void initializeData() {
        System.out.println("🌱 Initializing sample data...");

        // Create users
        User admin = createUser("Admin User", "admin@library.com", "admin123", User.Role.ADMIN);
        User john = createUser("John Doe", "john@example.com", "password123", User.Role.USER);
        User jane = createUser("Jane Smith", "jane@example.com", "password123", User.Role.USER);
        User bob = createUser("Bob Johnson", "bob@example.com", "password123", User.Role.USER);

        System.out.println("✅ Created 4 users (1 admin, 3 regular users)");

        // Create books
        List<Book> books = List.of(
            createBook("The Pragmatic Programmer", "Andrew Hunt, David Thomas", "9780201616224", 
                      "Programming", 1999, "Your journey to mastery. A classic guide to pragmatic programming approaches and best practices.", 
                      5, 3, Set.of("programming", "software development", "best practices"), 
                      "https://images-na.ssl-images-amazon.com/images/P/020161622X.01.L.jpg"),
            
            createBook("Clean Code", "Robert C. Martin", "9780132350884", 
                      "Programming", 2008, "A handbook of agile software craftsmanship. Learn to write clean, maintainable code.", 
                      4, 4, Set.of("programming", "clean code", "software craftsmanship"), 
                      "https://images-na.ssl-images-amazon.com/images/P/0132350884.01.L.jpg"),
            
            createBook("JavaScript: The Good Parts", "Douglas Crockford", "9780596517748", 
                      "Programming", 2008, "Unearthing the excellence in JavaScript. A guide to the beautiful, elegant parts of JavaScript.", 
                      3, 2, Set.of("javascript", "programming", "web development"), 
                      "https://images-na.ssl-images-amazon.com/images/P/0596517742.01.L.jpg"),
            
            createBook("Design Patterns", "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides", "9780201633610", 
                      "Programming", 1994, "Elements of reusable object-oriented software. The classic Gang of Four design patterns book.", 
                      3, 3, Set.of("design patterns", "object-oriented", "software architecture"), 
                      "https://images-na.ssl-images-amazon.com/images/P/0201633612.01.L.jpg"),
            
            createBook("You Don't Know JS: Scope & Closures", "Kyle Simpson", "9781449335588", 
                      "Programming", 2014, "Deep dive into JavaScript scope and closures. Part of the acclaimed You Don't Know JS series.", 
                      4, 4, Set.of("javascript", "scope", "closures"), 
                      "https://images-na.ssl-images-amazon.com/images/P/1449335586.01.L.jpg"),
            
            createBook("Eloquent JavaScript", "Marijn Haverbeke", "9781593279509", 
                      "Programming", 2018, "A modern introduction to programming. Learn JavaScript from the ground up with practical examples.", 
                      5, 4, Set.of("javascript", "programming", "beginner"), 
                      "https://images-na.ssl-images-amazon.com/images/P/1593279507.01.L.jpg"),
            
            createBook("React: Up & Running", "Stoyan Stefanov", "9781491931820", 
                      "Web Development", 2016, "Building web applications with React. Learn to build modern web apps with React.", 
                      3, 3, Set.of("react", "web development", "frontend"), 
                      "https://images-na.ssl-images-amazon.com/images/P/1491931825.01.L.jpg"),
            
            createBook("Node.js in Action", "Mike Cantelon, Marc Harter, T.J. Holowaychuk, Nathan Rajlich", "9781617290572", 
                      "Web Development", 2017, "Server-side development with Node.js. Build scalable network applications with Node.js.", 
                      4, 3, Set.of("nodejs", "backend", "javascript"), 
                      "https://images-na.ssl-images-amazon.com/images/P/1617290572.01.L.jpg"),
            
            createBook("Learning React", "Alex Banks, Eve Porcello", "9781491954621", 
                      "Web Development", 2017, "Functional web development with React and Redux. Modern approaches to React development.", 
                      3, 2, Set.of("react", "redux", "functional programming"), 
                      "https://images-na.ssl-images-amazon.com/images/P/1491954620.01.L.jpg"),
            
            createBook("MongoDB: The Definitive Guide", "Kristina Chodorow", "9781449344689", 
                      "Database", 2013, "Powerful and scalable data storage. Master MongoDB for modern applications.", 
                      2, 2, Set.of("mongodb", "database", "nosql"), 
                      "https://images-na.ssl-images-amazon.com/images/P/1449344682.01.L.jpg"),
            
            createBook("Algorithms", "Robert Sedgewick, Kevin Wayne", "9780321573513", 
                      "Computer Science", 2011, "Essential information about algorithms and data structures. Comprehensive guide to algorithms.", 
                      4, 4, Set.of("algorithms", "data structures", "computer science"), 
                      "https://images-na.ssl-images-amazon.com/images/P/032157351X.01.L.jpg"),
            
            createBook("System Design Interview", "Alex Xu", "9798664653403", 
                      "Computer Science", 2020, "An insider's guide to system design interviews. Prepare for technical interviews at top tech companies.", 
                      3, 1, Set.of("system design", "interviews", "software engineering"), 
                      "https://images-na.ssl-images-amazon.com/images/P/B08CMF2CQF.01.L.jpg")
        );

        System.out.println("✅ Created 12 sample books");

        // Create some sample borrow records
        if (!books.isEmpty()) {
            // John borrows "The Pragmatic Programmer"
            BorrowRecord borrow1 = new BorrowRecord(john, books.get(0));
            borrow1.setBorrowedAt(LocalDateTime.now().minusDays(5));
            borrowRecordRepository.save(borrow1);

            // Jane borrows "JavaScript: The Good Parts"
            BorrowRecord borrow2 = new BorrowRecord(jane, books.get(2));
            borrow2.setBorrowedAt(LocalDateTime.now().minusDays(3));
            borrowRecordRepository.save(borrow2);

            // Bob has returned "Clean Code"
            BorrowRecord borrow3 = new BorrowRecord(bob, books.get(1));
            borrow3.setBorrowedAt(LocalDateTime.now().minusDays(20));
            borrow3.setReturnedAt(LocalDateTime.now().minusDays(6));
            borrow3.setStatus(BorrowRecord.Status.RETURNED);
            borrowRecordRepository.save(borrow3);

            System.out.println("✅ Created 3 sample borrow records");
        }

        System.out.println("🎉 Sample data initialization completed!");
        System.out.println("\n🔑 Admin Credentials:");
        System.out.println("   Email: admin@library.com");
        System.out.println("   Password: admin123");
        System.out.println("\n👤 Sample User Credentials:");
        System.out.println("   Email: john@example.com");
        System.out.println("   Password: password123");
    }

    private User createUser(String name, String email, String password, User.Role role) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(role);
        user.setRefreshTokens(new HashSet<>());
        return userRepository.save(user);
    }

    private Book createBook(String title, String author, String isbn, String genre, Integer publishedYear, 
                           String description, Integer totalCopies, Integer availableCopies, Set<String> tags, String coverImage) {
        Book book = new Book();
        book.setTitle(title);
        book.setAuthor(author);
        book.setIsbn(isbn);
        book.setGenre(genre);
        book.setPublishedYear(publishedYear);
        book.setDescription(description);
        book.setTotalCopies(totalCopies);
        book.setAvailableCopies(availableCopies);
        book.setTags(tags);
        book.setCoverImage(coverImage);
        return bookRepository.save(book);
    }
}
