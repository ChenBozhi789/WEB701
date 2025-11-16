import React, { useEffect, useState } from "react";
import { api } from "../api";

function PendingRequestsList({ refreshTrigger, onRefresh }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [processingId, setProcessingId] = useState(null);

  async function loadPendingTransactions() {
    setLoading(true);
    setMsg("");
    try {
      const data = await api.getPendingTransactions();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (e) {
      const errorMsg = e.body?.message || "Unknown error";
      setMsg(`Failed to load pending requests (${e.status}): ${errorMsg}. Please make sure the server is running and the route is registered.`);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(transactionId) {
    setProcessingId(transactionId);
    setMsg("");
    try {
      await api.acceptTransaction(transactionId);
      setMsg("Transaction accepted successfully ✓");
      await loadPendingTransactions();
      onRefresh?.(); // Trigger parent refresh
    } catch (e) {
      setMsg(`Failed to accept transaction (${e.status}): ${e.body?.message || ""}`);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(transactionId) {
    setProcessingId(transactionId);
    setMsg("");
    try {
      await api.rejectTransaction(transactionId);
      setMsg("Transaction rejected successfully ✓");
      await loadPendingTransactions();
      onRefresh?.(); // Trigger parent refresh
    } catch (e) {
      setMsg(`Failed to reject transaction (${e.status}): ${e.body?.message || ""}`);
    } finally {
      setProcessingId(null);
    }
  }

  useEffect(() => {
    loadPendingTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#666" }}>
        Loading pending requests...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "100%" }}>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600, color: "#1a1a1a" }}>
          Pending Redemption Requests
        </h3>
        <button
          onClick={loadPendingTransactions}
          disabled={loading}
          style={{
            padding: "8px 16px",
            backgroundColor: "#f5f5f5",
            color: "#333",
            border: "1px solid #ddd",
            borderRadius: "6px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 500,
            fontSize: "0.9rem",
          }}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {msg && (
        <div style={{
          marginBottom: 16,
          padding: "12px 16px",
          borderRadius: "8px",
          backgroundColor: msg.includes("✓") ? "#d4edda" : "#f8d7da",
          color: msg.includes("✓") ? "#155724" : "#721c24",
          border: `1px solid ${msg.includes("✓") ? "#c3e6cb" : "#f5c6cb"}`,
          fontSize: "0.95rem",
        }}>
          {msg}
        </div>
      )}

      {transactions.length === 0 && !loading ? (
        <div style={{
          padding: 48,
          textAlign: "center",
          backgroundColor: "#f9f9f9",
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
        }}>
          <p style={{ margin: 0, color: "#666", fontSize: "1rem" }}>
            No pending redemption requests at the moment.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {transactions.map((tx) => (
            <div
              key={tx._id}
              style={{
                padding: "20px",
                backgroundColor: "white",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: "1.1rem", fontWeight: 600, color: "#1a1a1a" }}>
                    {tx.item?.name || "Unknown Item"}
                  </h4>
                  <p style={{ margin: "4px 0", color: "#666", fontSize: "0.9rem" }}>
                    <strong>Requested by:</strong> {tx.fromUser?.name || "Unknown"} ({tx.fromUser?.email || "N/A"})
                  </p>
                  <p style={{ margin: "4px 0", color: "#666", fontSize: "0.9rem" }}>
                    <strong>Quantity:</strong> {tx.quantity || 1} x {tx.item?.name || "Item"}
                  </p>
                  <p style={{ margin: "4px 0", color: "#666", fontSize: "0.9rem" }}>
                    <strong>Total Amount:</strong> <span style={{ color: "#ff6b35", fontWeight: 600 }}>{tx.amount} tokens</span>
                  </p>
                  {tx.item?.description && (
                    <p style={{ margin: "8px 0 0 0", color: "#666", fontSize: "0.9rem" }}>
                      {tx.item.description}
                    </p>
                  )}
                  <p style={{ margin: "8px 0 0 0", color: "#999", fontSize: "0.85rem" }}>
                    Requested: {new Date(tx.createdAt).toLocaleString()}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px", marginLeft: 16 }}>
                  <button
                    onClick={() => handleAccept(tx._id)}
                    disabled={processingId === tx._id || processingId !== null}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: processingId === tx._id || processingId !== null ? "not-allowed" : "pointer",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      opacity: processingId === tx._id || processingId !== null ? 0.6 : 1,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (processingId === null) {
                        e.currentTarget.style.backgroundColor = "#218838";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#28a745";
                    }}
                  >
                    {processingId === tx._id ? "Processing..." : "Accept"}
                  </button>
                  <button
                    onClick={() => handleReject(tx._id)}
                    disabled={processingId === tx._id || processingId !== null}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: processingId === tx._id || processingId !== null ? "not-allowed" : "pointer",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      opacity: processingId === tx._id || processingId !== null ? 0.6 : 1,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (processingId === null) {
                        e.currentTarget.style.backgroundColor = "#c82333";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#dc3545";
                    }}
                  >
                    {processingId === tx._id ? "Processing..." : "Reject"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PendingRequestsList;

