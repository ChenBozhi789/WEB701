<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>JWT Login</title>
</head>
<body>
    <h2>Login with JWT</h2>

    <form id="loginForm">
        <label>Email:</label><br>
        <input type="email" id="email" required><br><br>

        <label>Password:</label><br>
        <input type="password" id="password" required><br><br>

        <button type="submit">Login</button>
    </form>

    <p id="status"></p>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch("http://127.0.0.1:8000/api/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({ email, password })
                });

                if (!response.ok) throw new Error("Login failed");

                const data = await response.json();

                // save JWT to localStorage
                localStorage.setItem("jwt_token", data.token);

                // show status
                document.getElementById('status').innerText = "Login success! Redirecting...";

                // redirect to Dashboard
                window.location.href = "/dashboard";

            } catch (err) {
                document.getElementById('status').innerText = "Error: " + err.message;
            }
        });
    </script>
</body>
</html>
