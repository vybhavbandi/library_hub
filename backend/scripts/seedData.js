import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Book from '../models/Book.js';
import User from '../models/User.js';
import BorrowRecord from '../models/BorrowRecord.js';

// Load environment variables
dotenv.config();

// Sample books data
const sampleBooks = [
  {
    title: "The Pragmatic Programmer",
    author: "Andrew Hunt, David Thomas",
    isbn: "9780201616224",
    genre: "Programming",
    publishedYear: 1999,
    description: "Your journey to mastery. A classic guide to pragmatic programming approaches and best practices.",
    totalCopies: 5,
    availableCopies: 3,
    tags: ["programming", "software development", "best practices"]
  },
  {
    title: "Clean Code",
    author: "Robert C. Martin",
    isbn: "9780132350884",
    genre: "Programming",
    publishedYear: 2008,
    description: "A handbook of agile software craftsmanship. Learn to write clean, maintainable code.",
    totalCopies: 4,
    availableCopies: 4,
    tags: ["programming", "clean code", "software craftsmanship"]
  },
  {
    title: "JavaScript: The Good Parts",
    author: "Douglas Crockford",
    isbn: "9780596517748",
    genre: "Programming",
    publishedYear: 2008,
    description: "Unearthing the excellence in JavaScript. A guide to the beautiful, elegant parts of JavaScript.",
    totalCopies: 3,
    availableCopies: 2,
    tags: ["javascript", "programming", "web development"]
  },
  {
    title: "Design Patterns",
    author: "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
    isbn: "9780201633610",
    genre: "Programming",
    publishedYear: 1994,
    description: "Elements of reusable object-oriented software. The classic Gang of Four design patterns book.",
    totalCopies: 3,
    availableCopies: 3,
    tags: ["design patterns", "object-oriented", "software architecture"]
  },
  {
    title: "You Don't Know JS: Scope & Closures",
    author: "Kyle Simpson",
    isbn: "9781449335588",
    genre: "Programming",
    publishedYear: 2014,
    description: "Deep dive into JavaScript scope and closures. Part of the acclaimed You Don't Know JS series.",
    totalCopies: 4,
    availableCopies: 4,
    tags: ["javascript", "scope", "closures"]
  },
  {
    title: "Eloquent JavaScript",
    author: "Marijn Haverbeke",
    isbn: "9781593279509",
    genre: "Programming",
    publishedYear: 2018,
    description: "A modern introduction to programming. Learn JavaScript from the ground up with practical examples.",
    totalCopies: 5,
    availableCopies: 4,
    tags: ["javascript", "programming", "beginner"]
  },
  {
    title: "React: Up & Running",
    author: "Stoyan Stefanov",
    isbn: "9781491931820",
    genre: "Web Development",
    publishedYear: 2016,
    description: "Building web applications with React. Learn to build modern web apps with React.",
    totalCopies: 3,
    availableCopies: 3,
    tags: ["react", "web development", "frontend"]
  },
  {
    title: "Node.js in Action",
    author: "Mike Cantelon, Marc Harter, T.J. Holowaychuk, Nathan Rajlich",
    isbn: "9781617290572",
    genre: "Web Development",
    publishedYear: 2017,
    description: "Server-side development with Node.js. Build scalable network applications with Node.js.",
    totalCopies: 4,
    availableCopies: 3,
    tags: ["nodejs", "backend", "javascript"]
  },
  {
    title: "Learning React",
    author: "Alex Banks, Eve Porcello",
    isbn: "9781491954621",
    genre: "Web Development",
    publishedYear: 2017,
    description: "Functional web development with React and Redux. Modern approaches to React development.",
    totalCopies: 3,
    availableCopies: 2,
    tags: ["react", "redux", "functional programming"]
  },
  {
    title: "MongoDB: The Definitive Guide",
    author: "Kristina Chodorow",
    isbn: "9781449344689",
    genre: "Database",
    publishedYear: 2013,
    description: "Powerful and scalable data storage. Master MongoDB for modern applications.",
    totalCopies: 2,
    availableCopies: 2,
    tags: ["mongodb", "database", "nosql"]
  },
  {
    title: "Algorithms",
    author: "Robert Sedgewick, Kevin Wayne",
    isbn: "9780321573513",
    genre: "Computer Science",
    publishedYear: 2011,
    description: "Essential information about algorithms and data structures. Comprehensive guide to algorithms.",
    totalCopies: 4,
    availableCopies: 4,
    tags: ["algorithms", "data structures", "computer science"]
  },
  {
    title: "System Design Interview",
    author: "Alex Xu",
    isbn: "9798664653403",
    genre: "Computer Science",
    publishedYear: 2020,
    description: "An insider's guide to system design interviews. Prepare for technical interviews at top tech companies.",
    totalCopies: 3,
    availableCopies: 1,
    tags: ["system design", "interviews", "software engineering"]
  }
];

// Sample users
const sampleUsers = [
  {
    name: "Admin User",
    email: "admin@library.com",
    password: "admin123",
    role: "admin"
  },
  {
    name: "John Doe",
    email: "john@example.com",
    password: "password123",
    role: "user"
  },
  {
    name: "Jane Smith",
    email: "jane@example.com",
    password: "password123",
    role: "user"
  },
  {
    name: "Bob Johnson",
    email: "bob@example.com",
    password: "password123",
    role: "user"
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      Book.deleteMany({}),
      User.deleteMany({}),
      BorrowRecord.deleteMany({})
    ]);

    // Create users
    console.log('👥 Creating users...');
    const createdUsers = await User.create(sampleUsers);
    console.log(`✅ Created ${createdUsers.length} users`);

    // Create books
    console.log('📚 Creating books...');
    const createdBooks = await Book.create(sampleBooks);
    console.log(`✅ Created ${createdBooks.length} books`);

    // Create some sample borrow records
    console.log('📋 Creating sample borrow records...');
    const regularUsers = createdUsers.filter(user => user.role === 'user');
    const borrowRecords = [];

    // Create a few active borrows
    if (regularUsers.length > 0 && createdBooks.length > 0) {
      // John borrows "The Pragmatic Programmer"
      borrowRecords.push({
        user: regularUsers[0]._id,
        book: createdBooks[0]._id,
        borrowedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        status: 'borrowed'
      });

      // Jane borrows "JavaScript: The Good Parts"
      borrowRecords.push({
        user: regularUsers[1]._id,
        book: createdBooks[2]._id,
        borrowedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        status: 'borrowed'
      });

      // Bob has returned "Clean Code"
      borrowRecords.push({
        user: regularUsers[2]._id,
        book: createdBooks[1]._id,
        borrowedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        returnedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // returned 6 days ago
        status: 'returned'
      });

      await BorrowRecord.create(borrowRecords);
      console.log(`✅ Created ${borrowRecords.length} borrow records`);

      // Update book availability based on active borrows
      await Book.findByIdAndUpdate(createdBooks[0]._id, { $inc: { availableCopies: -1 } });
      await Book.findByIdAndUpdate(createdBooks[2]._id, { $inc: { availableCopies: -1 } });
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${createdUsers.length}`);
    console.log(`   Books: ${createdBooks.length}`);
    console.log(`   Borrow Records: ${borrowRecords.length}`);
    console.log('\n🔑 Admin Credentials:');
    console.log('   Email: admin@library.com');
    console.log('   Password: admin123');
    console.log('\n👤 Sample User Credentials:');
    console.log('   Email: john@example.com');
    console.log('   Password: password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the seeding function
seedDatabase();
