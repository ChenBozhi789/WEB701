import React, { useEffect, useState } from "react";
import { api } from "./api";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MemberApp from "./pages/MemberApp";
import BeneficiaryApp from "./pages/BeneficiaryApp";
import "./App.css";

export default function App() {
  const [me, setMe] = useState(null);
  const [ready, setReady] = useState(false);
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"

  async function loadMe() {
    try {
      const m = await api.me();
      setMe(m);
    } catch {
      setMe(null);
    } finally {
      setReady(true);
    }
  }

  useEffect(() => { loadMe(); }, []);

  if (!ready) return <p style={{ padding: 24 }}>Loading…</p>;

  return (
    <div className="container">
      {!api.getToken() || !me ? (
        authMode === "login" ? (
          <Login 
            onLoggedIn={loadMe} 
            onSwitchToRegister={() => setAuthMode("register")} 
          />
        ) : (
          <Register 
            onRegistered={loadMe} 
            onSwitchToLogin={() => setAuthMode("login")} 
          />
        )
      ) : me?.role === "member" ? (
        <MemberApp me={me} refresh={loadMe} onLogout={() => setMe(null)} />
      ) : me?.role === "beneficiary" ? (
        <BeneficiaryApp me={me} refresh={loadMe} onLogout={() => setMe(null)} />
      ) : (
        <div className="container">
          <h1>CharityConnect</h1>
          <p>Unknown role. Please contact support.</p>
        </div>
      )}
    </div>
  );
}
