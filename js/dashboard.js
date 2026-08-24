document.addEventListener("DOMContentLoaded", () => {
    // Check if User is Logged In
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if (!token || !user) {
        alert("Access denied. Please login first.");
        window.location.href = "login.html";
        return;
    }

    // Display User Information
    document.getElementById("userName").innerText = `Welcome, ${user.name}`;
    document.getElementById("userRoleBadge").innerText = user.role;

    // Logout Functionality
    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "login.html";
    });

    // UI elements for Modal & Classroom Grid
    const modal = document.getElementById("classModal");
    const openModalBtn = document.getElementById("openModalBtn");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const modalTitle = document.getElementById("modalTitle");
    const classNameGroup = document.getElementById("classNameGroup");
    const classCodeGroup = document.getElementById("classCodeGroup");
    const classroomsList = document.getElementById("classroomsList");

    // Adjust UI based on User Role (Teacher vs Student)
    if (user.role === "teacher") {
        openModalBtn.innerText = "+ Create Class";
        modalTitle.innerText = "Create a New Classroom";
        classCodeGroup.style.display = "none";
    } else {
        openModalBtn.innerText = "+ Join Class";
        modalTitle.innerText = "Join Classroom via Code";
        classNameGroup.style.display = "none";
    }

    // Modal Visibility Control
    openModalBtn.addEventListener("click", () => modal.style.display = "flex");
    closeModalBtn.addEventListener("click", () => modal.style.display = "none");
    window.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
    });

    // Function to Load User's Classrooms from Backend
    async function loadClassrooms() {
        try {
            const res = await fetch(`http://localhost:3000/api/classrooms/user/${user.id}/${user.role}`);
            const classrooms = await res.json();

            if (!classrooms || classrooms.length === 0) {
                classroomsList.innerHTML = `<p class="empty-msg">No classrooms found. Create or join one to get started!</p>`;
                return;
            }

            // Render Classroom Cards Dynamic HTML
            classroomsList.innerHTML = classrooms.map(c => `
                <div class="class-card">
                    <div onclick="window.location.href='classroom.html?id=${c.id}&name=${encodeURIComponent(c.name)}'" style="cursor: pointer;">
                        <h3>${c.name}</h3>
                        <p>${user.role === 'teacher' ? 'Instructor: You' : 'Instructor: ' + (c.teacher_name || 'Teacher')}</p>
                        <span class="code-tag">CODE: ${c.code}</span>
                    </div>
                    ${user.role === 'teacher' ? `
                        <div class="card-actions" style="margin-top: 12px; display: flex; gap: 8px;">
                            <button onclick="editClass('${c.id}', '${c.name}', '${c.code}')" class="btn btn-secondary btn-sm">✏️ Edit</button>
                            <button onclick="deleteClass('${c.id}')" class="btn btn-secondary btn-sm" style="background: #ef4444; color: white;">🗑️ Delete</button>
                        </div>
                    ` : ''}
                </div>
            `).join('');

        } catch (err) {
            console.error("Failed to load classrooms", err);
        }
    }

    // Handle Form Action (Create/Join Class Submission)
    document.getElementById("classForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        if (user.role === "teacher") {
            const className = document.getElementById("className").value;

            try {
                const res = await fetch("http://localhost:3000/api/classrooms/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: className, teacher_id: user.id })
                });

                const data = await res.json();
                alert(data.message);
            } catch (err) {
                alert("Failed to create class!");
            }

        } else {
            const classCode = document.getElementById("classCode").value;

            try {
                const res = await fetch("http://localhost:3000/api/classrooms/join", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code: classCode, student_id: user.id })
                });

                const data = await res.json();
                alert(data.message);
            } catch (err) {
                alert("Failed to join class!");
            }
        }

        // Close modal, clear form, and refresh class list
        modal.style.display = "none";
        document.getElementById("classForm").reset();
        loadClassrooms();
    });

    // Initial Load of Classrooms
    loadClassrooms();
});

// Global functions for Edit and Delete Classroom (Teacher Only)
window.editClass = async (id, currentName, currentCode) => {
    const newName = prompt("Edit Class Name:", currentName);
    const newCode = prompt("Edit Class Code:", currentCode);

    if (newName && newCode) {
        const user = JSON.parse(localStorage.getItem("user"));
        try {
            const res = await fetch("http://localhost:3000/api/classrooms/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, name: newName, code: newCode, teacher_id: user.id })
            });

            const data = await res.json();
            alert(data.message);
            location.reload();
        } catch (err) {
            alert("Failed to update classroom!");
        }
    }
};

window.deleteClass = async (id) => {
    if (confirm("Are you sure you want to delete this classroom? All notices and data inside will be removed!")) {
        const user = JSON.parse(localStorage.getItem("user"));
        try {
            const res = await fetch(`http://localhost:3000/api/classrooms/delete/${id}/${user.id}`, {
                method: "DELETE"
            });

            const data = await res.json();
            alert(data.message);
            location.reload();
        } catch (err) {
            alert("Failed to delete classroom!");
        }
    }
};