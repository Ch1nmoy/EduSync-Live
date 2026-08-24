document.addEventListener("DOMContentLoaded", () => {
    
    // Handle Signup Form Submission
    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const name = document.getElementById("name").value;
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const role = document.getElementById("role").value;

            try {
                const res = await fetch("http://localhost:3000/api/signup", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, password, role })
                });

                const data = await res.json();
                alert(data.message);

                if (res.ok) {
                    window.location.href = "login.html";
                }
            } catch (err) {
                alert("Signup failed! Check server connection.");
            }
        });
    }

    // Handle Login Form Submission
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPassword").value;

            try {
                const res = await fetch("http://localhost:3000/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                if (res.ok) {
                    // Store Token & User Info in LocalStorage
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("user", JSON.stringify(data.user));

                    alert(data.message);

                    // Redirect to Dashboard
                    window.location.href = "dashboard.html";
                } else {
                    alert(data.message || "Invalid email or password");
                }
            } catch (err) {
                alert("Login failed! Check server connection.");
            }
        });
    }
});