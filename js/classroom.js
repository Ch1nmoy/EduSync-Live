document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));
    
    // Get class_id and class name from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const classId = urlParams.get("id");
    const className = urlParams.get("name") || "Classroom";

    if (!token || !user || !classId) {
        alert("Invalid access! Redirecting to dashboard.");
        window.location.href = "dashboard.html";
        return;
    }

    // Set Header Info
    document.getElementById("classNameTitle").innerText = className;
    document.getElementById("userName").innerText = `Welcome, ${user.name}`;

    // Hide Teacher-only sections for Students
    if (user.role !== "teacher") {
        document.querySelectorAll(".teacher-only").forEach(el => el.style.display = "none");
    }

    // NOTICE BOARD MANAGEMENT
    async function loadNotices() {
        try {
            const res = await fetch(`http://localhost:3000/api/notices/${classId}`);
            const notices = await res.json();
            const noticeList = document.getElementById("noticeList");

            if (!notices || notices.length === 0) {
                noticeList.innerHTML = `<p class="empty-msg">No notices posted yet.</p>`;
                return;
            }

            noticeList.innerHTML = notices.map(n => `
                <div class="card" style="margin-top: 15px;">
                    <p style="font-size: 1rem; color: #334155; white-space: pre-wrap;">${n.content}</p>
                    <small style="color: #94a3b8; display: block; margin-top: 8px;">Posted on: ${new Date(n.created_at).toLocaleString()}</small>
                    ${user.role === 'teacher' ? `
                        <div style="margin-top: 10px; display: flex; gap: 8px;">
                            <button onclick="editNotice('${n.id}', \`${n.content.replace(/`/g, '\\`').replace(/'/g, "\\'")}\`)" class="btn btn-secondary btn-sm">Edit</button>
                            <button onclick="deleteNotice('${n.id}')" class="btn btn-secondary btn-sm" style="background: #ef4444; color: white;">Delete</button>
                        </div>
                    ` : ''}
                </div>
            `).join('');
        } catch (err) {
            console.error("Failed to load notices", err);
        }
    }

    const noticeForm = document.getElementById("noticeForm");
    if (noticeForm) {
        noticeForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const content = document.getElementById("noticeContent").value;

            try {
                const res = await fetch("http://localhost:3000/api/notices/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ classroom_id: classId, content })
                });
                const data = await res.json();
                alert(data.message);
                document.getElementById("noticeContent").value = "";
                loadNotices();
            } catch (err) {
                alert("Failed to post notice!");
            }
        });
    }

    loadNotices();

    // ASSIGNMENT & SUBMISSIONS MANAGEMENT
    async function loadAssignments() {
        try {
            const res = await fetch(`http://localhost:3000/api/assignments/${classId}`);
            const assignments = await res.json();
            const assignmentList = document.getElementById("assignmentList");

            if (!assignments || assignments.length === 0) {
                assignmentList.innerHTML = `<p class="empty-msg">No assignments found.</p>`;
                return;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            let htmlContent = "";

            for (let a of assignments) {
                const dueDate = new Date(a.due_date);
                dueDate.setHours(23, 59, 59, 999);
                const isPastDue = today > dueDate;

                let studentSubmissionArea = "";

                if (user.role === 'student') {
                    if (isPastDue) {
                        studentSubmissionArea = `
                            <p style="color: #ef4444; font-weight: bold; background: #fee2e2; padding: 8px 12px; border-radius: 6px; display: inline-block;">
                                Submission Closed! Due date has passed.
                            </p>`;
                    } else {
                        // Check if student already submitted a file
                        try {
                            const subRes = await fetch(`http://localhost:3000/api/assignments/my-submission/${a.id}/${user.id}`);
                            const mySub = await subRes.json();

                            if (mySub && mySub.file_path) {
                                studentSubmissionArea = `
                                    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 10px 14px; border-radius: 6px; margin-top: 10px;">
                                        <p style="color: #166534; font-weight: bold; margin-bottom: 5px;">Status: Submitted</p>
                                        <small style="color: #64748b; display: block; margin-bottom: 8px;">Submitted on: ${new Date(mySub.submitted_at).toLocaleString()}</small>
                                        <a href="http://localhost:3000/${mySub.file_path.replace(/\\/g, '/')}" target="_blank" style="color: #2563eb; font-weight: bold; font-size: 0.9rem;">
                                            View/Download My Submitted File
                                        </a>
                                    </div>
                                `;
                            } else {
                                studentSubmissionArea = `
                                    <form onsubmit="submitAssignment(event, ${a.id})" style="margin-top: 10px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                                        <input type="file" id="file-${a.id}" required style="font-size: 0.9rem; padding: 5px;">
                                        <button type="submit" class="btn btn-primary btn-sm">Upload & Submit</button>
                                    </form>
                                `;
                            }
                        } catch (err) {
                            console.error("Failed to load my submission status", err);
                        }
                    }
                }

                htmlContent += `
                    <div class="card" style="margin-top: 15px;">
                        <h3>${a.title}</h3>
                        <p style="color: #475569; margin: 8px 0; white-space: pre-wrap;">${a.description}</p>
                        <small style="color: ${isPastDue ? '#ef4444' : '#16a34a'}; font-weight: bold; display: block; margin-bottom: 12px;">
                            Due Date: ${new Date(a.due_date).toLocaleDateString()} ${isPastDue ? '(Expired)' : ''}
                        </small>

                        ${studentSubmissionArea}

                        ${user.role === 'teacher' ? `
                            <div style="margin-top: 15px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
                                <button onclick="viewSubmissions(${a.id})" class="btn btn-secondary btn-sm">View Student Submissions</button>
                                <div id="submissions-container-${a.id}" style="margin-top: 10px; display: none;"></div>
                            </div>
                        ` : ''}
                    </div>
                `;
            }

            assignmentList.innerHTML = htmlContent;

        } catch (err) {
            console.error("Failed to load assignments", err);
        }
    }

    const assignmentForm = document.getElementById("assignmentForm");
    if (assignmentForm) {
        assignmentForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const title = document.getElementById("assignTitle").value;
            const description = document.getElementById("assignDesc").value;
            const due_date = document.getElementById("assignDueDate").value;

            try {
                const res = await fetch("http://localhost:3000/api/assignments/create", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ classroom_id: classId, title, description, due_date })
                });

                const data = await res.json();
                alert(data.message);
                assignmentForm.reset();
                loadAssignments();
            } catch (err) {
                alert("Failed to create assignment!");
            }
        });
    }

    loadAssignments();

    // REAL-TIME CHAT SYSTEM (Socket.io)
    const socket = io("http://localhost:3000");

    socket.emit("joinRoom", { classId: String(classId), userName: user.name });

    const chatForm = document.getElementById("chatForm");
    const chatInput = document.getElementById("chatMessageInput");
    const chatMessages = document.getElementById("chatMessages");

    if (chatForm) {
        chatForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const msg = chatInput.value.trim();
            if (msg) {
                socket.emit("chatMessage", { classId: String(classId), sender: user.name, text: msg, userId: user.id });
                chatInput.value = "";
            }
        });
    }

    socket.on("message", (data) => {
        const isMe = data.userId === user.id;
        const msgDiv = document.createElement("div");
        msgDiv.className = `chat-msg ${isMe ? 'my-msg' : ''}`;
        msgDiv.innerHTML = `
            <span class="sender">${isMe ? 'You' : data.sender}</span>
            <p>${data.text}</p>
        `;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });

    // LIVE VIDEO CLASS (Jitsi Integration)
    const startLiveBtn = document.getElementById("startLiveBtn");
    const jitsiContainer = document.getElementById("jitsiContainer");

    if (startLiveBtn) {
        startLiveBtn.addEventListener("click", () => {
            jitsiContainer.style.display = "block";
            startLiveBtn.style.display = "none";

            const domain = "meet.jit.si";
            const options = {
                roomName: `VirtualClassroom_Room_${classId}`,
                width: "100%",
                height: 500,
                parentNode: jitsiContainer,
                userInfo: {
                    displayName: user.name
                }
            };
            new JitsiMeetExternalAPI(domain, options);
        });
    }
});

// GLOBAL FUNCTIONS
// Teacher View Submissions Function
window.viewSubmissions = async (assignmentId) => {
    const container = document.getElementById(`submissions-container-${assignmentId}`);
    
    if (container.style.display === "block") {
        container.style.display = "none";
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/api/assignments/submissions/${assignmentId}`);
        const submissions = await res.json();

        if (!submissions || submissions.length === 0) {
            container.innerHTML = `<p style="color: #64748b; font-size: 0.9rem; margin-top: 5px;">No active submissions (Expired submissions auto-removed).</p>`;
        } else {
            container.innerHTML = `
                <div style="overflow-x: auto; margin-top: 10px;">
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                        <thead>
                            <tr style="background: #f1f5f9; text-align: left; color: #334155;">
                                <th style="padding: 8px; border: 1px solid #cbd5e1;">Student Name</th>
                                <th style="padding: 8px; border: 1px solid #cbd5e1;">Email</th>
                                <th style="padding: 8px; border: 1px solid #cbd5e1;">Submission Time</th>
                                <th style="padding: 8px; border: 1px solid #cbd5e1;">Submitted File</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${submissions.map(sub => `
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 600; color: #1e293b;">
                                        ${sub.student_name}
                                    </td>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1; color: #64748b;">
                                        ${sub.student_email || 'N/A'}
                                    </td>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1; color: #475569;">
                                        ${new Date(sub.submitted_at).toLocaleString()}
                                    </td>
                                    <td style="padding: 8px; border: 1px solid #cbd5e1;">
                                        <a href="http://localhost:3000/${sub.file_path.replace(/\\/g, '/')}" target="_blank" style="color: #2563eb; font-weight: bold; text-decoration: none;">
                                            Download File
                                        </a>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }
        container.style.display = "block";
    } catch (err) {
        alert("Failed to fetch submissions!");
    }
};

// Student Submission Function
window.submitAssignment = async (event, assignmentId) => {
    event.preventDefault();
    const user = JSON.parse(localStorage.getItem("user"));
    const fileInput = document.getElementById(`file-${assignmentId}`);

    if (!fileInput || !fileInput.files[0]) {
        alert("Please select a file to upload!");
        return;
    }

    const formData = new FormData();
    formData.append("assignment_id", assignmentId);
    formData.append("student_id", user.id);
    formData.append("submissionFile", fileInput.files[0]);

    try {
        const res = await fetch("http://localhost:3000/api/assignments/submit", {
            method: "POST",
            body: formData
        });
        const data = await res.json();

        if (!res.ok) {
            alert(data.message);
            return;
        }

        alert(data.message);
        location.reload(); // Reloads page to show uploaded file preview
    } catch (err) {
        alert("Failed to submit assignment!");
    }
};

// Tab Switch Function
function switchTab(tabId) {
    document.querySelectorAll(".tab-content").forEach(el => el.classList.remove("active-content"));
    document.querySelectorAll(".tab-btn").forEach(el => el.classList.remove("active"));

    document.getElementById(tabId).classList.add("active-content");
    event.currentTarget.classList.add("active");
}

// Notice Edit & Delete Functions
window.editNotice = async (id, oldContent) => {
    const updatedContent = prompt("Edit Notice:", oldContent);
    if (updatedContent) {
        try {
            const res = await fetch("http://localhost:3000/api/notices/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, content: updatedContent })
            });
            const data = await res.json();
            alert(data.message);
            location.reload();
        } catch (err) {
            alert("Failed to update notice!");
        }
    }
};

window.deleteNotice = async (id) => {
    if (confirm("Are you sure you want to delete this notice?")) {
        try {
            const res = await fetch(`http://localhost:3000/api/notices/delete/${id}`, {
                method: "DELETE"
            });
            const data = await res.json();
            alert(data.message);
            location.reload();
        } catch (err) {
            alert("Failed to delete notice!");
        }
    }
};
