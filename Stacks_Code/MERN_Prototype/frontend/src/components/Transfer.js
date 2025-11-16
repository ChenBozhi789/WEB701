import React, { useState } from "react";
import { api } from "../api";
import Box from "./Box";
import "./Transfer.css";

function Transfer({ onDone }) {
  const [toEmail, setToEmail] = useState("");
  const [amount, setAmount] = useState(10);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!toEmail.trim()) {
      setMsg("Please enter a receiver email address.");
      return;
    }
    if (!amount || amount < 1) {
      setMsg("Please enter a valid amount (minimum 1 token).");
      return;
    }

    setSending(true);
    setMsg("");
    try {
      const body = { amount: Number(amount), toEmail: toEmail.trim() };
      const res = await api.transferDirect(body);
      setMsg(`✓ Transfer successful! Transaction ID: ${res?.tx?._id}`);
      setToEmail("");
      setAmount(10);
      onDone?.();
    } catch (e) {
      setMsg(`✗ Transfer failed (${e.status}): ${e.body?.message || "Unknown error"}`);
    } finally {
      setSending(false);
    }
  }

  const isSuccess = msg.includes("✓") || msg.includes("successful");
  const isError = msg.includes("✗") || msg.includes("failed") || msg.includes("Please enter");

  return (
    <Box title="Transfer Tokens">
      <div className="transfer-container">
        <p className="transfer-description">
          Send tokens by email. Works both directions (member ↔ beneficiary).
        </p>
        
        <div className="transfer-form">
          <div className="form-group">
            <label htmlFor="receiver-email" className="form-label">
              Receiver Email
            </label>
            <input
              id="receiver-email"
              type="email"
              className="form-input"
              value={toEmail}
              onChange={e => setToEmail(e.target.value)}
              placeholder="receiver@example.com"
              disabled={sending}
            />
          </div>

          <div className="form-group">
            <label htmlFor="amount" className="form-label">
              Amount (tokens)
            </label>
            <input
              id="amount"
              type="number"
              min="1"
              className="form-input"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              disabled={sending}
            />
          </div>

          <button
            className="transfer-button"
            onClick={submit}
            disabled={sending || !toEmail.trim() || !amount || amount < 1}
          >
            {sending ? "Sending..." : "Send Tokens"}
          </button>
        </div>

        {msg && (
          <div className={`transfer-message ${isSuccess ? "success" : isError ? "error" : ""}`}>
            {msg}
          </div>
        )}
      </div>
    </Box>
  );
}

export default Transfer;

