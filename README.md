# Virtual Classroom Management System

[![Node.js](https://img.shields.io/badge/Node.js-v18.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-4.x-blue.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-black.svg)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-brightgreen.svg)](LICENSE)

An interactive, full-stack real-time web application designed to bridge the gap between teachers and students. **EduSync-Live** provides a seamless digital learning environment equipped with live video conferencing, instant real-time messaging, interactive notice boards, role-based authentication, and assignment management.

---

## Table of Contents
- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [Tech Stack & Tools](#-tech-stack--tools)
- [Project Directory Structure](#-project-directory-structure)
- [Database Architecture (SQL)](#-database-architecture-sql)
- [Getting Started & Installation](#-getting-started--installation)
- [Environment Variables](#-environment-variables)
- [Usage & Workflow](#-usage--workflow)
- [Contributing](#-contributing)
- [License](#-license)

---

## About the Project

The **EduSync Live** is built to simulate a physical classroom virtually. Teachers can create distinct classrooms, post announcements, assign homework, and conduct live video lectures. Students can join classes using unique class codes, view announcements, participate in live discussions via real-time chat, and join video sessions seamlessly.

---

## Key Features

### Teacher Role
- **Create Classroom:** Generate unique class codes for students to join.
- **Notice Board Broadcast:** Post real-time announcements to the entire class.
- **Assignment Creation:** Assign tasks with specific instructions and due dates.
- **Host Live Video Class:** Initiate live video conferencing directly from the classroom dashboard.

### Student Role
- **Join Classroom:** Easily join classes using the unique class code provided by the teacher.
- **Interactive Stream & Notices:** View ongoing class announcements and notices.
- **View Assignments:** Track upcoming tasks and submission deadlines.
- **Join Live Sessions:** One-click option to join active video lectures.

### Real-Time & Interactive Capabilities
- **Real-Time Messaging:** Instant group chat powered by **Socket.io**.
- **Integrated Video Calls:** Video conferencing powered by **Jitsi Meet API** (no external app installation required).
- **Responsive Design:** Fully responsive layout optimized for Desktop, Tablet, and Mobile devices.

---

## Tech Stack & Tools

### Frontend
- **HTML5:** Semantic markup structure.
- **CSS3:** Custom styles, Flexbox, CSS Grid, and Media Queries for responsive UI.
- **JavaScript (ES6+):** Dynamic UI rendering, DOM manipulation, and Socket.io client integration.

### Backend
- **Node.js:** JavaScript runtime environment.
- **Express.js:** Web framework for building RESTful APIs and server routing.
- **Socket.io:** Real-time bi-directional event-based communication.

### Database & Storage
- **MySQL:** Relational database for storing users, classes, notices, and assignments.
- **`mysql2` / `dotenv`:** Node packages for database connection and environment management.

### Tools & Services
- **Jitsi Meet API:** Live video conferencing integration.
- **VS Code:** Primary Code Editor.
- **Git & GitHub:** Version control and repository hosting.
- **LocalTunnel / Ngrok:** Local server tunneling for mobile testing.

---

## Project Directory Structure

```text
virtual-classroom/
├── css/
│   └── style.css            # Global & Responsive Stylesheets
├── js/
│   ├── main.js              # General UI Scripts & Authentication Helpers
│   ├── dashboard.js         # Dashboard Logic (Create/Join Class, Grid rendering)
│   └── classroom.js         # Classroom Stream, Chat, Jitsi API & Assignments
├── uploads/                 # File attachments & user uploads directory
├── index.html               # Landing / Home Page
├── login.html               # User Login Page
├── signup.html              # User Registration Page
├── dashboard.html           # Main User Dashboard
├── classroom.html           # Main Virtual Classroom Interface
├── db.js                    # Database Connection Configuration
├── server.js                # Express Server & Socket.io Event Handlers
├── schema.sql               # Database Tables Setup Script
├── .env                     # Environment Variables Configuration
├── .gitignore               # Ignored files (node_modules, .env, uploads)
└── package.json             # Project Dependencies and Scripts

```

## Database Architecture (SQL)

Run the following SQL queries in your MySQL Database (e.g., via phpMyAdmin, MAMP, or MySQL Workbench) to set up the schema:

```sql
CREATE DATABASE IF NOT EXISTS virtual_classroom;
USE virtual_classroom;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('teacher', 'student') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Classrooms Table
CREATE TABLE IF NOT EXISTS classrooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_name VARCHAR(255) NOT NULL,
    class_code VARCHAR(50) UNIQUE NOT NULL,
    teacher_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Classroom Enrollments (Students)
CREATE TABLE IF NOT EXISTS class_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classrooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Notices Table
CREATE TABLE IF NOT EXISTS notices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classrooms(id) ON DELETE CASCADE
);

-- 5. Assignments Table
CREATE TABLE IF NOT EXISTS assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    due_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classrooms(id) ON DELETE CASCADE
);
```

## Author

* **Chinmoy Chakma**
  * **Program:** M.Sc. in Computer Science & Engineering (CSE)
  * **Institution:** Jahangirnagar University
  * **GitHub:** [@Ch1nmoy](https://github.com/Ch1nmoy)

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
