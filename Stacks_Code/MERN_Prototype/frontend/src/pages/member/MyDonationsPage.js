import React, { useState } from "react";
import MyDonationsList from "../../components/MyDonationsList";
import PendingRequestsList from "../../components/PendingRequestsList";
import AddDonationsPage from "./AddDonationsPage";
import EditDonationsPage from "./EditDonationsPage";

function MyDonationsPage({ refresh }) {
  const [view, setView] = useState("list"); // "list", "add", "edit", or "pending"
  const [editingItemId, setEditingItemId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  if (view === "add") {
    return (
      <AddDonationsPage
        refresh={refresh}
        onSuccess={() => {
          setRefreshTrigger(prev => prev + 1);
          setView("list");
        }}
        onBack={() => setView("list")}
      />
    );
  }

  if (view === "edit" && editingItemId) {
    return (
      <EditDonationsPage
        itemId={editingItemId}
        refresh={refresh}
        onSuccess={() => {
          setRefreshTrigger(prev => prev + 1);
          setView("list");
          setEditingItemId(null);
        }}
        onBack={() => {
          setView("list");
          setEditingItemId(null);
        }}
      />
    );
  }

  if (view === "pending") {
    return (
      <div className="donations-page">
        <div style={{ marginBottom: 16, display: "flex", gap: 12 }}>
          <button
            onClick={() => setView("list")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#e0e0e0",
              color: "#333",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.95rem",
            }}
          >
            My Donation List
          </button>
          <button
            onClick={() => setView("add")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#ff6b35",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.95rem",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#e55a2b";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ff6b35";
            }}
          >
            Add New Donation
          </button>
          <button
            onClick={() => setView("pending")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#ff6b35",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.95rem",
            }}
          >
            Pending Requests
          </button>
        </div>
        <PendingRequestsList 
          refreshTrigger={refreshTrigger}
          onRefresh={() => {
            setRefreshTrigger(prev => prev + 1);
            refresh?.();
          }}
        />
      </div>
    );
  }

  return (
    <div className="donations-page">
      <div style={{ marginBottom: 16, display: "flex", gap: 12 }}>
        <button
          onClick={() => setView("list")}
          style={{
            padding: "10px 20px",
            backgroundColor: view === "list" ? "#ff6b35" : "#e0e0e0",
            color: view === "list" ? "white" : "#333",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.95rem",
          }}
        >
          My Donation List
        </button>
        <button
          onClick={() => setView("add")}
          style={{
            padding: "10px 20px",
            backgroundColor: view === "add" ? "#ff6b35" : "#ff6b35",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.95rem",
            transition: "background-color 0.2s",
            opacity: view === "add" ? 1 : 0.9,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#e55a2b";
            e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#ff6b35";
            e.currentTarget.style.opacity = view === "add" ? "1" : "0.9";
          }}
        >
          Add New Donation
        </button>
        <button
          onClick={() => setView("pending")}
          style={{
            padding: "10px 20px",
            backgroundColor: view === "pending" ? "#ff6b35" : "#e0e0e0",
            color: view === "pending" ? "white" : "#333",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "0.95rem",
          }}
        >
          Pending Requests
        </button>
      </div>
      <MyDonationsList 
        refreshTrigger={refreshTrigger}
        onEdit={(itemId) => {
          setEditingItemId(itemId);
          setView("edit");
        }}
      />
    </div>
  );
}

export default MyDonationsPage;

