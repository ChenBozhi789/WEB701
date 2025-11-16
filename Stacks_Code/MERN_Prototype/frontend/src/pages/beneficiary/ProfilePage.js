import React, { useState, useEffect } from "react";
import { api } from "../../api";
import Box from "../../components/Box";

function ProfilePage({ me, refresh }) {
  const [name, setName] = useState(me?.name || "");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  
  // Change Password state
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Update name when me changes
  useEffect(() => {
    if (me?.name) {
      setName(me.name);
    }
  }, [me?.name]);

  async function handleSaveName() {
    if (!name || name.trim().length < 2) {
      setMsg("Name must be at least 2 characters");
      return;
    }

    if (name.trim() === me?.name) {
      setIsEditing(false);
      setMsg("");
      return;
    }

    setSaving(true);
    setMsg("");

    try {
      await api.updateProfile(name.trim());
      setMsg("Name updated successfully ✓");
      setIsEditing(false);
      refresh(); // Refresh user data
    } catch (e) {
      setMsg(`Failed to update name (${e.status}): ${e.body?.message || ""}`);
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setName(me?.name || "");
    setIsEditing(false);
    setMsg("");
  }

  function handleEdit() {
    setIsEditing(true);
    setMsg("");
  }

  async function handleChangePassword() {
    if (!oldPwd || !newPwd) {
      setPwdMsg("Please fill in all fields");
      return;
    }

    if (newPwd.length < 6) {
      setPwdMsg("New password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    setPwdMsg("");

    try {
      const res = await api.changePassword(oldPwd, newPwd);
      setPwdMsg("Password changed successfully ✓");
      setOldPwd("");
      setNewPwd("");
    } catch (e) {
      setPwdMsg(`Change failed (${e.status}): ${e.body?.message || "Endpoint not implemented"}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="profile-page">
      <Box title="Account Information">
        <div className="account-info">
          <div className="info-row">
            <span className="info-label">Name:</span>
            {isEditing ? (
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flex: 1 }}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    fontSize: "1rem",
                  }}
                  disabled={saving}
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving || !name.trim() || name.trim().length < 2}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#ff6b35",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: saving || !name.trim() || name.trim().length < 2 ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    opacity: saving || !name.trim() || name.trim().length < 2 ? 0.6 : 1,
                  }}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  style={{
                    padding: "8px 16px",
                    backgroundColor: "#e0e0e0",
                    color: "#333",
                    border: "none",
                    borderRadius: "6px",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontWeight: 500,
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                <span className="info-value">{me?.name || "—"}</span>
                <button
                  onClick={handleEdit}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#ff6b35",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 500,
                    fontSize: "0.9rem",
                  }}
                >
                  Edit
                </button>
              </div>
            )}
          </div>
          <div className="info-row">
            <span className="info-label">Email:</span>
            <span className="info-value">{me?.email || "—"}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Role:</span>
            <span className="info-value">{me?.role || "—"}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Token Balance:</span>
            <span className="info-value">{me?.tokenBalance ?? "—"}</span>
          </div>
        </div>
        {msg && (
          <p className={`msg ${msg.includes("✓") ? "success" : ""}`} style={{ marginTop: 12 }}>
            {msg}
          </p>
        )}

        {/* Change Password Section */}
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #f0f0f0" }}>
          <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: "1.1rem", fontWeight: 600, color: "#333" }}>
            Change Password
          </h3>
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
                onClick={handleChangePassword}
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
            {pwdMsg && (
              <p className={`msg ${pwdMsg.includes("✓") ? "success" : ""}`} style={{ 
                marginTop: "4px",
                marginBottom: 0
              }}>
                {pwdMsg}
              </p>
            )}
          </div>
        </div>
      </Box>
    </div>
  );
}

export default ProfilePage;

