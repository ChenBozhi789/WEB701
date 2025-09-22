<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Dashboard</title>
</head>
<body>
    <h2>Dashboard</h2>
    <p id="userInfo">Loading user info...</p>
    <hr>

    <h3>My Balance</h3>
    <p id="balance">Loading...</p>
    <button id="refreshBalance">Refresh Balance</button>
    <hr>

    <h3>Token Transfer</h3>
    <form id="transferForm">
        <label>Receiver Email:</label><br>
        <input type="email" id="to_email" required><br><br>

        <label>Amount:</label><br>
        <input type="number" id="amount" min="1" required><br><br>

        <button type="submit">Send Token</button>
    </form>
    <p id="transferStatus"></p>

    <script>
        const token = localStorage.getItem("jwt_token");
        if (!token) {
            alert("Please login first!");
            window.location.href = "/jwt-login";
        }

        // show current user info (email + role)
        async function loadUserInfo() {
            try {
                const response = await fetch("http://127.0.0.1:8000/api/me", {
                    headers: { "Authorization": "Bearer " + token }
                });
                const data = await response.json();

                if (!response.ok) throw new Error(data.error || "Failed to load user info");

                document.getElementById("userInfo").innerText =
                    "Logged in as: " + data.email + " (" + data.role + ")";
            } catch {
                document.getElementById("userInfo").innerText = "Failed to load user info";
            }
        }

        // query balance
        async function loadBalance() {
            try {
                const response = await fetch("http://127.0.0.1:8000/api/balance", {
                    headers: { "Authorization": "Bearer " + token }
                });
                const data = await response.json();

                if (!response.ok) throw new Error(data.error || "Balance check failed");

                document.getElementById("balance").innerText =
                    "Your balance: " + data.balance;
            } catch {
                document.getElementById("balance").innerText = "Failed to load balance";
            }
        }

        document.getElementById("refreshBalance").addEventListener("click", loadBalance);

        // transfer logic
        document.getElementById("transferForm").addEventListener("submit", async function(e) {
            e.preventDefault();
            const to_email = document.getElementById("to_email").value;
            const amount = document.getElementById("amount").value;

            try {
                const response = await fetch("http://127.0.0.1:8000/api/transfer", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token
                    },
                    body: JSON.stringify({ to: to_email, amount })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || "Transfer failed");

                document.getElementById("transferStatus").innerText = "Transfer success!";
                // after transfer, refresh balance
                loadBalance(); 
            } catch (err) {
                document.getElementById("transferStatus").innerText = "Error: " + err.message;
            }
        });

        // when page loads, get data
        loadUserInfo();
        loadBalance();
    </script>
</body>
</html>
