import React, { useState, useEffect } from "react";
import { api } from "../../api";

function EditDonationsPage({ itemId, refresh, onSuccess, onBack }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("product");
  const [description, setDescription] = useState("");
  const [tokenPrice, setTokenPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [isActive, setIsActive] = useState(true);
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load item data
  useEffect(() => {
    async function loadItem() {
      try {
        const item = await api.request(`/api/items/${itemId}`);
        setName(item.name || "");
        setCategory(item.category || "");
        setType(item.type || "product");
        setDescription(item.description || "");
        setTokenPrice(item.tokenPrice?.toString() || "");
        setQuantity(item.quantity?.toString() || "1");
        setIsActive(item.isActive !== undefined ? item.isActive : true);
        setLoading(false);
      } catch (e) {
        setMsg(`Failed to load item (${e.status}): ${e.body?.message || ""}`);
        setLoading(false);
      }
    }
    if (itemId) {
      loadItem();
    }
  }, [itemId]);

  async function handleSubmit() {
    // Validation
    if (!name || !name.trim()) {
      setMsg("Name is required");
      return;
    }
    if (!category || !category.trim()) {
      setMsg("Category is required");
      return;
    }
    if (!description || !description.trim()) {
      setMsg("Description is required");
      return;
    }
    if (!tokenPrice || Number(tokenPrice) < 1) {
      setMsg("Token price must be at least 1");
      return;
    }
    const qty = Number(quantity);
    if (isNaN(qty) || qty < 0) {
      setMsg("Quantity must be a non-negative number");
      return;
    }

    setSubmitting(true);
    setMsg("");

    try {
      const payload = {
        name: name.trim(),
        category: category.trim(),
        type,
        description: description.trim(),
        tokenPrice: Number(tokenPrice),
        quantity: qty,
        isActive
      };

      await api.updateItem(itemId, payload);
      setMsg("Item updated successfully ✓");
      
      refresh?.();
      
      // Navigate back after a short delay to show success message
      setTimeout(() => {
        onSuccess?.();
      }, 1000);
    } catch (e) {
      setMsg(`Failed to update item (${e.status}): ${e.body?.message || ""}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{
          backgroundColor: "white",
          border: "1px solid #e0e0e0",
          borderRadius: "12px",
          padding: "32px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          textAlign: "center",
        }}>
          <p style={{ color: "#666", fontSize: "1rem" }}>Loading donation details...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={onBack}
          style={{
            padding: "10px 20px",
            backgroundColor: "#f5f5f5",
            color: "#333",
            border: "1px solid #ddd",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 500,
            fontSize: "0.95rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#e8e8e8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#f5f5f5";
          }}
        >
          <span>←</span> Back to Donations
        </button>
      </div>

      <div style={{
        backgroundColor: "white",
        border: "1px solid #e0e0e0",
        borderRadius: "12px",
        padding: "32px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}>
        <div style={{ marginBottom: 8 }}>
          <h2 style={{ 
            margin: "0 0 8px 0", 
            fontSize: "1.75rem", 
            fontWeight: 700,
            color: "#1a1a1a"
          }}>
            Edit Donation
          </h2>
          <p style={{ 
            margin: "0 0 32px 0", 
            color: "#666", 
            fontSize: "0.95rem",
            lineHeight: "1.5"
          }}>
            Update the information for this donation.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Name Field */}
          <div>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
              color: "#333",
              fontSize: "0.95rem"
            }}>
              Name <span style={{ color: "#ff6b35" }}>*</span>
            </label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter product/service name"
        disabled={submitting}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "1rem",
                fontFamily: "inherit",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => e.target.style.borderColor = "#ff6b35"}
              onBlur={(e) => e.target.style.borderColor = "#ddd"}
            />
          </div>

          {/* Category and Type Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 600,
                color: "#333",
                fontSize: "0.95rem"
              }}>
                Category <span style={{ color: "#ff6b35" }}>*</span>
              </label>
      <input
        type="text"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Food, Clothing, Education"
        disabled={submitting}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => e.target.style.borderColor = "#ff6b35"}
                onBlur={(e) => e.target.style.borderColor = "#ddd"}
              />
            </div>

            <div>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 600,
                color: "#333",
                fontSize: "0.95rem"
              }}>
                Type <span style={{ color: "#ff6b35" }}>*</span>
              </label>
      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        disabled={submitting}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  backgroundColor: "white",
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => e.target.style.borderColor = "#ff6b35"}
                onBlur={(e) => e.target.style.borderColor = "#ddd"}
      >
        <option value="product">Product</option>
        <option value="service">Service</option>
      </select>
            </div>
          </div>

          {/* Status Field */}
          <div>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
              color: "#333",
              fontSize: "0.95rem"
            }}>
              Status <span style={{ color: "#ff6b35" }}>*</span>
            </label>
      <select
        value={isActive ? "active" : "inactive"}
        onChange={(e) => setIsActive(e.target.value === "active")}
        disabled={submitting}
              style={{
                width: "100%",
                maxWidth: "400px",
                padding: "12px 16px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "1rem",
                fontFamily: "inherit",
                backgroundColor: "white",
                cursor: "pointer",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => e.target.style.borderColor = "#ff6b35"}
              onBlur={(e) => e.target.style.borderColor = "#ddd"}
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
          </div>

          {/* Description Field */}
          <div>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
              color: "#333",
              fontSize: "0.95rem"
            }}>
              Description <span style={{ color: "#ff6b35" }}>*</span>
            </label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter detailed description of your donation..."
              rows="5"
        disabled={submitting}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "1rem",
                fontFamily: "inherit",
                resize: "vertical",
                minHeight: "120px",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
              onFocus={(e) => e.target.style.borderColor = "#ff6b35"}
              onBlur={(e) => e.target.style.borderColor = "#ddd"}
            />
          </div>

          {/* Token Price and Quantity Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 600,
                color: "#333",
                fontSize: "0.95rem"
              }}>
                Token Price <span style={{ color: "#ff6b35" }}>*</span>
              </label>
      <input
        type="number"
        min="1"
        value={tokenPrice}
        onChange={(e) => setTokenPrice(e.target.value)}
                placeholder="Minimum: 1"
        disabled={submitting}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => e.target.style.borderColor = "#ff6b35"}
                onBlur={(e) => e.target.style.borderColor = "#ddd"}
              />
            </div>

            <div>
              <label style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: 600,
                color: "#333",
                fontSize: "0.95rem"
              }}>
                Quantity
              </label>
      <input
        type="number"
        min="0"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
                placeholder="Default: 1"
        disabled={submitting}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  transition: "border-color 0.2s",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => e.target.style.borderColor = "#ff6b35"}
                onBlur={(e) => e.target.style.borderColor = "#ddd"}
              />
            </div>
          </div>
        </div>

        {/* Message Display */}
        {msg && (
          <div style={{
            marginTop: "24px",
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

        {/* Submit Button */}
        <div style={{ 
          marginTop: "32px", 
          display: "flex", 
          justifyContent: "flex-end",
          gap: "12px"
        }}>
          <button
            onClick={onBack}
            disabled={submitting}
            style={{
              padding: "12px 24px",
              backgroundColor: "#f5f5f5",
              color: "#333",
              border: "1px solid #ddd",
              borderRadius: "8px",
              cursor: submitting ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: "1rem",
              opacity: submitting ? 0.6 : 1,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!submitting) e.currentTarget.style.backgroundColor = "#e8e8e8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f5f5f5";
            }}
          >
            Cancel
          </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
              padding: "12px 32px",
            backgroundColor: "#ff6b35",
            color: "white",
            border: "none",
              borderRadius: "8px",
            cursor: submitting ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: "1rem",
            opacity: submitting ? 0.6 : 1,
              transition: "all 0.2s",
              boxShadow: submitting ? "none" : "0 2px 4px rgba(255, 107, 53, 0.3)",
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.currentTarget.style.backgroundColor = "#e55a2b";
                e.currentTarget.style.boxShadow = "0 4px 8px rgba(255, 107, 53, 0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ff6b35";
              e.currentTarget.style.boxShadow = "0 2px 4px rgba(255, 107, 53, 0.3)";
            }}
          >
            {submitting ? "Updating..." : "Update Donation"}
        </button>
        </div>
      </div>
    </div>
  );
}

export default EditDonationsPage;

