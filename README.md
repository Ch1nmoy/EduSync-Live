# Virtual Classroom Management System

[![Node.js](https://img.shields.io/badge/Node.js-v18.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-4.x-blue.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.x-black.svg)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-brightgreen.svg)](LICENSE)

An interactive, full-stack real-time web application designed to bridge the gap between teachers and students. **Virtual Classroom** provides a seamless digital learning environment equipped with live video conferencing, instant real-time messaging, interactive notice boards, role-based authentication, and assignment management.

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

The **Virtual Classroom Management System** is built to simulate a physical classroom virtually. Teachers can create distinct classrooms, post announcements, assign homework, and conduct live video lectures. Students can join classes using unique class codes, view announcements, participate in live discussions via real-time chat, and join video sessions seamlessly.

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
