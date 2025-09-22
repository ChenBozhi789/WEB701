<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>JWT Register</title>
</head>
<body>
    <h2>Register</h2>

    <form id="registerForm">
        <label>Name:</label><br>
        <input type="text" id="name" required><br><br>

        <label>Email:</label><br>
        <input type="email" id="email" required><br><br>

        <label>Password:</label><br>
        <input type="password" id="password" required><br><br>

        <label>Role:</label><br>
        <select id="role" required>
            <option value="member">Member</option>
            <option value="beneficiary">Beneficiary</option>
        </select><br><br>

        <button type="submit">Register</button>
    </form>

    <p id="status"></p>

    <script>
        document.getElementById('registerForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;

            try {
                const response = await fetch("http://127.0.0.1:8000/api/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },
                    body: JSON.stringify({ name, email, password, role })
                });

                if (!response.ok) throw new Error("Register failed");

                const data = await response.json();
                localStorage.setItem("jwt_token", data.token);

                document.getElementById('status').innerText = "Register success! Redirecting...";

                window.location.href = "/dashboard";

            } catch (err) {
                document.getElementById('status').innerText = "Error: " + err.message;
            }
        });
    </script>
</body>
</html>
