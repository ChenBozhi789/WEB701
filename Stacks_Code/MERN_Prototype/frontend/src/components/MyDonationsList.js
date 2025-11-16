import React, { useEffect, useState } from "react";
import { api } from "../api";
import Box from "./Box";

function MyDonationsList({ refreshTrigger, onEdit }) {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");

  async function load() {
    try {
      const list = await api.getMyItems();
      setItems(Array.isArray(list) ? list : []);
      setMsg("");
    } catch (e) {
      setMsg(`Load failed (${e.status}): ${e.body?.message || ""}`);
    }
  }

  useEffect(() => { load(); }, [refreshTrigger]);

  return (
    <Box title="My Donation List">
      {msg && <p className="msg">{msg}</p>}
      {items.length === 0 && !msg && (
        <p style={{ padding: 16, textAlign: "center", color: "#666" }}>
          No donations yet. Click "Add New Donation" to create your first donation.
        </p>
      )}
      {items.length > 0 && (
        <table className="tbl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Type</th>
              <th>Description</th>
              <th>Token Price</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item._id}>
                <td>{item.name}</td>
                <td>{item.category}</td>
                <td>{item.type}</td>
                <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.description}
                </td>
                <td>{item.tokenPrice}</td>
                <td>{item.quantity}</td>
                <td>
                  <span style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    backgroundColor: item.isActive ? "#d4edda" : "#f8d7da",
                    color: item.isActive ? "#155724" : "#721c24",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                  }}>
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
                <td>
                  <button
                    onClick={() => onEdit?.(item._id)}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#ff6b35",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontWeight: 500,
                      fontSize: "0.85rem",
                    }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Box>
  );
}

export default MyDonationsList;

