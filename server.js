const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('./')); 
app.use('/uploads', express.static('uploads')); 

// Ensure uploads folder exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'edusync_live',
    port: 8889
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to MySQL Database.');

    // Auto-create Tables
    const createNoticesTable = `
        CREATE TABLE IF NOT EXISTS notices (
            id INT AUTO_INCREMENT PRIMARY KEY,
            classroom_id INT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
        )
    `;
    db.query(createNoticesTable);

    const createAssignmentsTable = `
        CREATE TABLE IF NOT EXISTS assignments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            classroom_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            due_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
        )
    `;
    db.query(createAssignmentsTable);

    const createSubmissionsTable = `
        CREATE TABLE IF NOT EXISTS assignment_submissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            assignment_id INT NOT NULL,
            student_id INT NOT NULL,
            file_path VARCHAR(255) NOT NULL,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
            FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `;
    db.query(createSubmissionsTable);
});

const JWT_SECRET = 'your_jwt_secret_key_123';

// AUTO-REMOVE EXPIRED SUBMISSIONS SYSTEM
function cleanupExpiredSubmissions() {
    const expiredQuery = `
        SELECT s.id, s.file_path 
        FROM assignment_submissions s
        JOIN assignments a ON s.assignment_id = a.id
        WHERE a.due_date < CURDATE()
    `;

    db.query(expiredQuery, (err, results) => {
        if (err || !results || results.length === 0) return;

        results.forEach(sub => {
            // 1. Delete physical file from uploads folder
            if (fs.existsSync(sub.file_path)) {
                fs.unlink(sub.file_path, (err) => {
                    if (err) console.error("Failed to delete file:", sub.file_path);
                });
            }

            // 2. Delete record from database
            db.query('DELETE FROM assignment_submissions WHERE id = ?', [sub.id]);
        });
        console.log(`🧹 Auto-cleanup: Removed ${results.length} expired assignment submissions.`);
    });
}

// Run cleanup every 1 hour
setInterval(cleanupExpiredSubmissions, 3600000);

// AUTHENTICATION ROUTES
app.post('/api/signup', async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ message: 'Please fill in all fields.' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hashedPassword, role], (err) => {
            if (err) return res.status(400).json({ message: 'Email already exists or DB error.' });
            res.status(201).json({ message: 'User registered successfully!' });
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
        if (err || results.length === 0) return res.status(400).json({ message: 'Invalid credentials.' });

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ message: 'Login successful!', token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    });
});

// CLASSROOM MANAGEMENT ROUTES
app.post('/api/classrooms/create', (req, res) => {
    const { name, teacher_id } = req.body;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    db.query('INSERT INTO classrooms (name, code, teacher_id) VALUES (?, ?, ?)', [name, code, teacher_id], (err) => {
        if (err) return res.status(500).json({ message: 'Failed to create classroom.' });
        res.status(201).json({ message: 'Classroom created successfully!', code });
    });
});

app.post('/api/classrooms/join', (req, res) => {
    let { code, student_id } = req.body;
    code = code.trim().toUpperCase();

    db.query('SELECT * FROM classrooms WHERE UPPER(code) = ?', [code], (err, results) => {
        if (err || results.length === 0) return res.status(404).json({ message: 'Invalid class code.' });

        db.query('INSERT INTO enrollments (student_id, classroom_id) VALUES (?, ?)', [student_id, results[0].id], (err) => {
            if (err) return res.status(400).json({ message: 'Already joined or DB error.' });
            res.json({ message: 'Successfully joined classroom!' });
        });
    });
});

app.get('/api/classrooms/user/:id/:role', (req, res) => {
    const { id, role } = req.params;
    const query = role === 'teacher' 
        ? 'SELECT * FROM classrooms WHERE teacher_id = ?' 
        : 'SELECT c.id, c.name, c.code, u.name as teacher_name FROM classrooms c JOIN enrollments e ON c.id = e.classroom_id JOIN users u ON c.teacher_id = u.id WHERE e.student_id = ?';

    db.query(query, [id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch classrooms.' });
        res.json(results);
    });
});

// NOTICE BOARD ROUTES
app.post('/api/notices/create', (req, res) => {
    const { classroom_id, content } = req.body;
    db.query('INSERT INTO notices (classroom_id, content) VALUES (?, ?)', [classroom_id, content], (err) => {
        if (err) return res.status(500).json({ message: 'Failed to post notice.' });
        res.status(201).json({ message: 'Notice posted successfully!' });
    });
});

app.get('/api/notices/:classroom_id', (req, res) => {
    db.query('SELECT * FROM notices WHERE classroom_id = ? ORDER BY created_at DESC', [req.params.classroom_id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch notices.' });
        res.json(results);
    });
});

app.put('/api/notices/update', (req, res) => {
    db.query('UPDATE notices SET content = ? WHERE id = ?', [req.body.content, req.body.id], (err) => {
        if (err) return res.status(500).json({ message: 'Failed to update notice.' });
        res.json({ message: 'Notice updated successfully!' });
    });
});

app.delete('/api/notices/delete/:id', (req, res) => {
    db.query('DELETE FROM notices WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ message: 'Failed to delete notice.' });
        res.json({ message: 'Notice deleted successfully!' });
    });
});

// ASSIGNMENT & SUBMISSION ROUTES
app.post('/api/assignments/create', (req, res) => {
    const { classroom_id, title, description, due_date } = req.body;
    db.query('INSERT INTO assignments (classroom_id, title, description, due_date) VALUES (?, ?, ?, ?)', [classroom_id, title, description, due_date], (err) => {
        if (err) return res.status(500).json({ message: 'Failed to create assignment.' });
        res.status(201).json({ message: 'Assignment created successfully!' });
    });
});

app.get('/api/assignments/:classroom_id', (req, res) => {
    db.query('SELECT * FROM assignments WHERE classroom_id = ? ORDER BY created_at DESC', [req.params.classroom_id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch assignments.' });
        res.json(results);
    });
});

// Submit File (With Due Date Check)
app.post('/api/assignments/submit', upload.single('submissionFile'), (req, res) => {
    const { assignment_id, student_id } = req.body;
    const file_path = req.file ? req.file.path : null;

    if (!assignment_id || !student_id || !file_path) {
        return res.status(400).json({ message: 'File missing or invalid request.' });
    }

    db.query('SELECT due_date FROM assignments WHERE id = ?', [assignment_id], (err, results) => {
        if (err || results.length === 0) return res.status(400).json({ message: 'Assignment not found.' });

        const dueDate = new Date(results[0].due_date);
        dueDate.setHours(23, 59, 59, 999);

        if (new Date() > dueDate) {
            if (fs.existsSync(file_path)) fs.unlinkSync(file_path);
            return res.status(400).json({ message: 'Submission closed! Due date has passed.' });
        }

        db.query('INSERT INTO assignment_submissions (assignment_id, student_id, file_path) VALUES (?, ?, ?)', [assignment_id, student_id, file_path], (err) => {
            if (err) return res.status(500).json({ message: 'Submission error.' });
            res.status(201).json({ message: 'Assignment submitted successfully!' });
        });
    });
});

// Get My Submission (For Student Confirmation)
app.get('/api/assignments/my-submission/:assignment_id/:student_id', (req, res) => {
    const { assignment_id, student_id } = req.params;
    const query = 'SELECT * FROM assignment_submissions WHERE assignment_id = ? AND student_id = ? ORDER BY submitted_at DESC LIMIT 1';
    
    db.query(query, [assignment_id, student_id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch submission.' });
        res.json(results[0] || null);
    });
});

// Get All Submissions (For Teacher View)
app.get('/api/assignments/submissions/:assignment_id', (req, res) => {
    const query = `
        SELECT s.id, s.file_path, s.submitted_at, u.name as student_name, u.email as student_email
        FROM assignment_submissions s
        JOIN users u ON s.student_id = u.id
        WHERE s.assignment_id = ?
        ORDER BY s.submitted_at DESC
    `;
    db.query(query, [req.params.assignment_id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Failed to fetch submissions.' });
        res.json(results);
    });
});

// Socket.io Real-time Chat
io.on('connection', (socket) => {
    socket.on('joinRoom', ({ classId }) => socket.join(String(classId)));
    socket.on('chatMessage', (data) => io.to(String(data.classId)).emit('message', data));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
