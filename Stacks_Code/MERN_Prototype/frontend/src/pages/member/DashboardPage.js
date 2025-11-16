import React, { useState, useEffect } from "react";
import { api } from "../../api";
import Box from "../../components/Box";

function DashboardPage({ me, onNavigate }) {
  const [stats, setStats] = useState({
    totalDonations: 0,
    activeDonations: 0,
    pendingRequests: 0,
    totalQuantity: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      // Load donations
      const items = await api.getMyItems();
      const donations = Array.isArray(items) ? items : [];
      
      // Load pending transactions
      let pending = [];
      try {
        pending = await api.getPendingTransactions();
        pending = Array.isArray(pending) ? pending : [];
      } catch (e) {
        // If endpoint doesn't exist, just use empty array
        pending = [];
      }

      // Load recent transaction history
      let history = [];
      try {
        history = await api.getTransactionHistory();
        history = Array.isArray(history) ? history : [];
        // Get last 5 transactions
        history = history.slice(0, 5);
      } catch (e) {
        // If endpoint doesn't exist, just use empty array
        history = [];
      }

      const activeDonations = donations.filter(item => item.isActive);
      const totalQuantity = donations.reduce((sum, item) => sum + (item.quantity || 0), 0);

      setStats({
        totalDonations: donations.length,
        activeDonations: activeDonations.length,
        pendingRequests: pending.length,
        totalQuantity: totalQuantity,
      });

      setRecentTransactions(history);
    } catch (e) {
      console.error("Failed to load dashboard data:", e);
    } finally {
      setLoading(false);
    }
  }

  function handleCardClick(action) {
    if (onNavigate) {
      onNavigate(action);
    }
  }

  const statCards = [
    {
      title: "Total Donations",
      value: stats.totalDonations,
      icon: "📦",
      color: "#4a90e2",
      onClick: () => handleCardClick("donations"),
    },
    {
      title: "Active Donations",
      value: stats.activeDonations,
      icon: "✅",
      color: "#50c878",
      onClick: () => handleCardClick("donations"),
    },
    {
      title: "Pending Requests",
      value: stats.pendingRequests,
      icon: "⏳",
      color: "#ff6b35",
      onClick: () => handleCardClick("donations"),
      highlight: stats.pendingRequests > 0,
    },
    {
      title: "Total Items",
      value: stats.totalQuantity,
      icon: "📊",
      color: "#9b59b6",
    },
  ];

  return (
    <div className="dashboard-page">
      {/* Welcome Section */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 8px 0", fontSize: "1.8rem", color: "#333" }}>
          Welcome back, {me?.name || "Member"}! 👋
        </h2>
        <p style={{ margin: 0, color: "#666", fontSize: "1rem" }}>
          Here's an overview of your donation activity
        </p>
      </div>

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
                  lineHeight: 1.2
                }}>
                  {loading ? "..." : card.value}
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
            onClick={() => handleCardClick("donations")}
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
            <span>➕</span> Add New Donation
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
          {stats.pendingRequests > 0 && (
            <button
              onClick={() => handleCardClick("donations")}
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
              <span>🔔</span> Review Requests ({stats.pendingRequests})
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
                {stats.pendingRequests}
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
                      {tx.type === "transfer" ? "💸 Transfer" : "🔄 Transaction"}
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

