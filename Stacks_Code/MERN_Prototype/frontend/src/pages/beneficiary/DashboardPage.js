import React, { useState, useEffect } from "react";
import { api } from "../../api";
import Box from "../../components/Box";

function DashboardPage({ me, refresh, onNavigate }) {
  const [msg, setMsg] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [stats, setStats] = useState({
    availableItems: 0,
    pendingRedemptions: 0,
    completedRedemptions: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // Load available items
      let items = [];
      try {
        items = await api.request("/api/items");
        items = Array.isArray(items) ? items : [];
        // Filter only active items
        items = items.filter(item => item.isActive);
      } catch (e) {
        items = [];
      }

      // Load transaction history
      let history = [];
      let pendingCount = 0;
      let completedCount = 0;
      let totalSpent = 0;
      
      try {
        history = await api.getTransactionHistory();
        history = Array.isArray(history) ? history : [];
        
        // Calculate stats from transactions
        history.forEach(tx => {
          if (tx.status === "pending") {
            pendingCount++;
          } else if (tx.status === "completed") {
            completedCount++;
            // Check if this transaction is from the current user (they spent tokens)
            const fromUserId = tx.fromUser?._id || tx.fromUser || tx.fromUser?.toString();
            const currentUserId = me?._id || me?.id;
            if (fromUserId && currentUserId && fromUserId.toString() === currentUserId.toString()) {
              totalSpent += tx.amount || 0;
            }
          }
        });
        
        // Get last 5 transactions
        history = history.slice(0, 5);
      } catch (e) {
        history = [];
      }

      setStats({
        availableItems: items.length,
        pendingRedemptions: pendingCount,
        completedRedemptions: completedCount,
        totalSpent: totalSpent,
      });

      setRecentTransactions(history);
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleClaimTokens() {
    setClaiming(true);
    setMsg("");

    try {
      const result = await api.claimInitialTokens();
      setMsg(`Successfully claimed 50 tokens! Your new balance is ${result.tokenBalance} tokens. ✓`);
      refresh?.(); // Refresh user data to update balance and hasClaimedInitialTokens
      loadDashboardData(); // Reload stats
    } catch (e) {
      setMsg(`Failed to claim tokens (${e.status}): ${e.body?.message || ""}`);
    } finally {
      setClaiming(false);
    }
  }

  function handleCardClick(action) {
    if (onNavigate) {
      onNavigate(action);
    }
  }

  const statCards = [
    {
      title: "Available Items",
      value: stats.availableItems,
      icon: "🛍️",
      color: "#4a90e2",
      onClick: () => handleCardClick("browse"),
    },
    {
      title: "Pending Redemptions",
      value: stats.pendingRedemptions,
      icon: "⏳",
      color: "#ff6b35",
      onClick: () => handleCardClick("browse"),
      highlight: stats.pendingRedemptions > 0,
    },
    {
      title: "Completed",
      value: stats.completedRedemptions,
      icon: "✅",
      color: "#50c878",
    },
    {
      title: "Total Spent",
      value: `${stats.totalSpent}`,
      icon: "💰",
      color: "#9b59b6",
      suffix: " tokens",
    },
  ];

  return (
    <div className="dashboard-page">
      {/* Welcome Section */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 8px 0", fontSize: "1.8rem", color: "#333" }}>
          Welcome back, {me?.name || "Beneficiary"}! 👋
        </h2>
        <p style={{ margin: 0, color: "#666", fontSize: "1rem" }}>
          Browse and redeem items using your tokens
        </p>
      </div>

      {/* Claim Tokens Banner */}
      {!me?.hasClaimedInitialTokens && (
        <div style={{
          padding: "20px",
          backgroundColor: "#fff3cd",
          border: "2px solid #ffc107",
          borderRadius: "12px",
          marginBottom: 24,
          boxShadow: "0 2px 8px rgba(255, 193, 7, 0.2)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: "2rem" }}>🎁</span>
            <div>
              <p style={{ margin: "0 0 4px 0", fontWeight: 600, fontSize: "1.1rem" }}>
                Claim Your Initial Tokens
              </p>
              <p style={{ margin: 0, fontSize: "0.95rem", color: "#666" }}>
                New beneficiaries can claim 50 tokens to get started! This is a one-time offer.
              </p>
            </div>
          </div>
          <button
            onClick={handleClaimTokens}
            disabled={claiming}
            style={{
              padding: "12px 24px",
              backgroundColor: "#ff6b35",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: claiming ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: "1rem",
              opacity: claiming ? 0.6 : 1,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!claiming) {
                e.currentTarget.style.backgroundColor = "#e55a2b";
                e.currentTarget.style.transform = "scale(1.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (!claiming) {
                e.currentTarget.style.backgroundColor = "#ff6b35";
                e.currentTarget.style.transform = "scale(1)";
              }
            }}
          >
            {claiming ? "Claiming..." : "Claim 50 Tokens"}
          </button>
        </div>
      )}

      {me?.hasClaimedInitialTokens && (
        <div style={{
          padding: "12px 16px",
          backgroundColor: "#d4edda",
          color: "#155724",
          borderRadius: "8px",
          border: "1px solid #c3e6cb",
          marginBottom: 24,
        }}>
          <strong>✓ Initial tokens already claimed</strong>
        </div>
      )}

      {msg && (
        <div style={{ marginBottom: 24 }}>
          <p className={`msg ${msg.includes("✓") ? "success" : ""}`} style={{ margin: 0 }}>
            {msg}
          </p>
        </div>
      )}

      {/* Statistics Cards */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: 16, 
        marginBottom: 24 
      }}>
        {statCards.map((card, index) => (
          <div
            key={index}
            onClick={card.onClick}
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: card.highlight 
                ? "0 4px 12px rgba(255, 107, 53, 0.3)" 
                : "0 2px 8px rgba(0, 0, 0, 0.1)",
              cursor: card.onClick ? "pointer" : "default",
              transition: "all 0.3s ease",
              border: card.highlight ? "2px solid #ff6b35" : "1px solid #e0e0e0",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              if (card.onClick) {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.15)";
              }
            }}
            onMouseLeave={(e) => {
              if (card.onClick) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = card.highlight 
                  ? "0 4px 12px rgba(255, 107, 53, 0.3)" 
                  : "0 2px 8px rgba(0, 0, 0, 0.1)";
              }
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ 
                  fontSize: "0.9rem", 
                  color: "#666", 
                  marginBottom: "8px",
                  fontWeight: 500 
                }}>
                  {card.title}
                </div>
                <div style={{ 
                  fontSize: "2rem", 
                  fontWeight: 700, 
                  color: card.color,
                  lineHeight: 1.2,
                  display: "flex",
                  alignItems: "baseline",
                  gap: "4px"
                }}>
                  {loading ? "..." : card.value}
                  {card.suffix && (
                    <span style={{ fontSize: "1rem", fontWeight: 500 }}>
                      {card.suffix}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ 
                fontSize: "2.5rem", 
                opacity: 0.2,
                lineHeight: 1
              }}>
                {card.icon}
              </div>
            </div>
            {card.highlight && (
              <div style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: "#ff6b35",
                animation: "pulse 2s infinite",
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <Box title="Quick Actions">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={() => handleCardClick("browse")}
            style={{
              padding: "12px 24px",
              backgroundColor: "#ff6b35",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.95rem",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#e55a2b";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ff6b35";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <span>🛍️</span> Browse Items
          </button>
          <button
            onClick={() => handleCardClick("transfer")}
            style={{
              padding: "12px 24px",
              backgroundColor: "#4a90e2",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.95rem",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#357abd";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#4a90e2";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <span>💸</span> Transfer Tokens
          </button>
          {stats.pendingRedemptions > 0 && (
            <button
              onClick={() => handleCardClick("browse")}
              style={{
                padding: "12px 24px",
                backgroundColor: "#ff9800",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.95rem",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#e68900";
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#ff9800";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <span>🔔</span> Pending ({stats.pendingRedemptions})
              <span style={{
                position: "absolute",
                top: -4,
                right: -4,
                backgroundColor: "#ff1744",
                color: "white",
                borderRadius: "50%",
                width: 20,
                height: 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.7rem",
                fontWeight: 700,
              }}>
                {stats.pendingRedemptions}
              </span>
            </button>
          )}
        </div>
      </Box>

      {/* Account Information & Recent Activity */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
        gap: 24, 
        marginTop: 24 
      }}>
        <Box title="Account Information">
          <div className="account-info">
            <div className="info-row">
              <span className="info-label">Name:</span>
              <span className="info-value">{me?.name || "—"}</span>
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
              <span className="info-value" style={{ 
                fontWeight: 600, 
                color: "#ff6b35", 
                fontSize: "1.1rem" 
              }}>
                {me?.tokenBalance ?? 0} tokens
              </span>
            </div>
          </div>
        </Box>

        <Box title="Recent Activity">
          {loading ? (
            <p style={{ padding: 16, textAlign: "center", color: "#666" }}>Loading...</p>
          ) : recentTransactions.length === 0 ? (
            <p style={{ padding: 16, textAlign: "center", color: "#666" }}>
              No recent transactions
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recentTransactions.map((tx, index) => (
                <div
                  key={tx._id || index}
                  style={{
                    padding: "12px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    transition: "all 0.2s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e9ecef";
                    e.currentTarget.style.borderColor = "#ff6b35";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8f9fa";
                    e.currentTarget.style.borderColor = "#e0e0e0";
                  }}
                >
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    marginBottom: "4px"
                  }}>
                    <span style={{ fontWeight: 600, color: "#333" }}>
                      {tx.item?.name ? `🛍️ ${tx.item.name}` : 
                       tx.type === "transfer" ? "💸 Transfer" : 
                       "🔄 Transaction"}
                    </span>
                    <span style={{ 
                      fontSize: "0.85rem", 
                      color: "#666" 
                    }}>
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "—"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "#666" }}>
                    {tx.status === "completed" ? "✅ Completed" : 
                     tx.status === "pending" ? "⏳ Pending" : 
                     tx.status || "—"}
                    {tx.amount && ` • ${tx.amount} tokens`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Box>
      </div>

      {/* Add CSS animation for pulse effect */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default DashboardPage;

