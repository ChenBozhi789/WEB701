import React, { useState } from "react";
import { api } from "../api";
import Box from "./Box";

function ChangePassword() {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!oldPwd || !newPwd) {
      setMsg("Please fill in all fields");
      return;
    }

    if (newPwd.length < 6) {
      setMsg("New password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    setMsg("");

    try {
      const res = await api.changePassword(oldPwd, newPwd);
      setMsg("Password changed successfully ✓");
      setOldPwd("");
      setNewPwd("");
    } catch (e) {
      setMsg(`Change failed (${e.status}): ${e.body?.message || "Endpoint not implemented"}`);
    } finally {
      setSubmitting(false);
    }
  }
  
  return (
    <Box title="Change Password">
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={{ 
            display: "block", 
            marginBottom: "8px", 
            fontWeight: 600, 
            color: "#4a4a4a",
            fontSize: "0.95rem"
          }}>
            Current Password
          </label>
          <input 
            type="password" 
            value={oldPwd} 
            onChange={e => setOldPwd(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "1rem",
              boxSizing: "border-box",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#ff6b35";
              e.currentTarget.style.outline = "none";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#ccc";
            }}
            disabled={submitting}
          />
        </div>
        <div>
          <label style={{ 
            display: "block", 
            marginBottom: "8px", 
            fontWeight: 600, 
            color: "#4a4a4a",
            fontSize: "0.95rem"
          }}>
            New Password
          </label>
          <input 
            type="password" 
            value={newPwd} 
            onChange={e => setNewPwd(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "1rem",
              boxSizing: "border-box",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#ff6b35";
              e.currentTarget.style.outline = "none";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#ccc";
            }}
            disabled={submitting}
          />
        </div>
        <div style={{ marginTop: "8px" }}>
          <button 
            onClick={submit}
            disabled={submitting || !oldPwd || !newPwd}
            style={{
              padding: "10px 24px",
              backgroundColor: "#ff6b35",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: submitting || !oldPwd || !newPwd ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: "0.95rem",
              transition: "background-color 0.2s",
              opacity: submitting || !oldPwd || !newPwd ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!submitting && oldPwd && newPwd) {
                e.currentTarget.style.backgroundColor = "#e55a2b";
              }
            }}
            onMouseLeave={(e) => {
              if (!submitting && oldPwd && newPwd) {
                e.currentTarget.style.backgroundColor = "#ff6b35";
              }
            }}
          >
            {submitting ? "Updating..." : "Update Password"}
          </button>
        </div>
        {msg && (
          <p className={`msg ${msg.includes("✓") ? "success" : ""}`} style={{ 
            marginTop: "4px",
            marginBottom: 0
          }}>
            {msg}
          </p>
        )}
      </div>
    </Box>
  );
}

export default ChangePassword;

