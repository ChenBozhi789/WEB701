import React, { useState, useEffect } from "react";
import { api } from "../../api";
import Box from "../../components/Box";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

function BrowsePage({ me, refresh }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [confirmItem, setConfirmItem] = useState(null);
  const [redeemQuantity, setRedeemQuantity] = useState(1);
  const [redeeming, setRedeeming] = useState(false);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTag, setSearchTag] = useState("");

  async function loadItems() {
    setLoading(true);
    setMsg("");
    try {
      // Build query string with filters
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchTag.trim()) params.append('aiTag', searchTag.trim());
      
      const queryString = params.toString();
      const url = `/api/items${queryString ? '?' + queryString : ''}`;
      const data = await api.request(url);
      const itemsArray = Array.isArray(data) ? data : [];
      setItems(itemsArray);
    } catch (e) {
      setMsg(`Failed to load items (${e.status}): ${e.body?.message || ""}`);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRedeem(item) {
    setConfirmItem(item);
    // Reset quantity to 1 or max available (up to 5)
    // Calculate available quantity (total - reserved)
    const availableQuantity = (item.quantity || 0) - (item.reservedQuantity || 0);
    const maxQuantity = Math.min(5, availableQuantity);
    setRedeemQuantity(Math.min(1, maxQuantity));
  }

  async function confirmRedeem() {
    if (!confirmItem) return;

    setRedeeming(true);
    setMsg("");

    try {
      // Validate quantity
      const quantity = Number(redeemQuantity) || 1;
      if (quantity < 1 || quantity > 5) {
        setMsg("Quantity must be between 1 and 5");
        setRedeeming(false);
        return;
      }

      if (quantity > (confirmItem.quantity || 0)) {
        setMsg(`Insufficient stock. Only ${confirmItem.quantity} available.`);
        setRedeeming(false);
        return;
      }

      // Call redeem API
      const price = confirmItem.tokenPrice || confirmItem.price || 0;
      const totalPrice = price * quantity;
      
      if (me?.tokenBalance < totalPrice) {
        setMsg(`Insufficient token balance. Need ${totalPrice} tokens, but you have ${me?.tokenBalance || 0}.`);
        setRedeeming(false);
        return;
      }

      // Try to call redeem endpoint
      try {
        const result = await api.request(`/api/items/${confirmItem._id}/redeem`, {
          method: "POST",
          body: { quantity: quantity }
        });
        setMsg(`✓ Redemption request submitted successfully! Requested ${quantity} x ${confirmItem.name} (${totalPrice} tokens total). Waiting for member approval. Your tokens have been reserved and will be transferred when the member accepts your request.`);
        setConfirmItem(null);
        setRedeemQuantity(1);
        refresh(); // Refresh user balance
        loadItems(); // Refresh items list
      } catch (e) {
        // If endpoint doesn't exist, show message
        if (e.status === 404) {
          setMsg("Redeem API endpoint not implemented yet. Please implement /api/items/:id/redeem");
        } else {
          setMsg(`Redeem failed (${e.status}): ${e.body?.message || ""}`);
        }
      }
    } catch (e) {
      setMsg(`Redeem failed: ${e.body?.message || e.message || ""}`);
    } finally {
      setRedeeming(false);
    }
  }

  function cancelRedeem() {
    setConfirmItem(null);
    setRedeemQuantity(1);
  }

  useEffect(() => {
    loadItems();
  }, [selectedCategory, searchTag]);

  // Get image URL helper
  function getImageUrl(item) {
    if (item.imagePath) {
      // Convert relative path to full URL
      const imagePath = item.imagePath.startsWith('/') ? item.imagePath : `/${item.imagePath}`;
      return `${API_BASE}${imagePath}`;
    }
    return null;
  }

  return (
    <div className="browse-page">
      <Box title="Browse Items">
        {/* Filters */}
        <div style={{ 
          display: "flex", 
          gap: "12px", 
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center"
        }}>
          <div style={{ flex: "1", minWidth: "200px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "0.9rem", fontWeight: 600 }}>
              Filter by Category:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "0.9rem",
                cursor: "pointer"
              }}
            >
              <option value="">All Categories</option>
              {Array.from(new Set(items.map(item => item.category).filter(Boolean))).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div style={{ flex: "1", minWidth: "200px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "0.9rem", fontWeight: 600 }}>
              Search by AI Tag:
            </label>
            <input
              type="text"
              value={searchTag}
              onChange={(e) => setSearchTag(e.target.value)}
              placeholder="Enter AI tag to search..."
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "0.9rem",
                boxSizing: "border-box"
              }}
            />
          </div>
          
          <button 
            onClick={loadItems} 
            disabled={loading}
            style={{
              padding: "8px 16px",
              backgroundColor: "#ff6b35",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: "0.9rem",
              alignSelf: "flex-end",
              opacity: loading ? 0.6 : 1,
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = "#e55a2b";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = "#ff6b35";
              }
            }}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
        {msg && (
          <div style={{
            padding: "12px 16px",
            marginBottom: 16,
            borderRadius: "8px",
            backgroundColor: msg.includes("Successfully") || msg.includes("submitted") ? "#d4edda" : "#f8d7da",
            color: msg.includes("Successfully") || msg.includes("submitted") ? "#155724" : "#721c24",
            border: `1px solid ${msg.includes("Successfully") || msg.includes("submitted") ? "#c3e6cb" : "#f5c6cb"}`,
            fontSize: "0.95rem",
            fontWeight: 500,
          }}>
            {msg}
          </div>
        )}
        {items.length === 0 && !loading ? (
          <p>No items available.</p>
        ) : (
          <div className="items-grid">
            {items.map((item) => {
              const price = item.tokenPrice || item.price || 0;
              const canAfford = me?.tokenBalance >= price;
              // Calculate available quantity (total - reserved)
              const availableQuantity = (item.quantity || 0) - (item.reservedQuantity || 0);
              
              const imageUrl = getImageUrl(item);
              
              return (
                <div key={item._id} className="item-card">
                  {/* Item Image */}
                  {imageUrl && (
                    <div style={{ marginBottom: "12px" }}>
                      <img 
                        src={imageUrl} 
                        alt={item.name || "Item"} 
                        style={{ 
                          width: "100%",
                          height: "200px",
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: "1px solid #ddd"
                        }} 
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <h3>{item.name || "Unnamed Item"}</h3>
                  <p><b>Price:</b> {price} tokens per item</p>
                  <p><b>Description:</b> {item.description || "—"}</p>
                  <p><b>Category:</b> {item.category || "—"}</p>
                  <p><b>Available Quantity:</b> <span style={{ color: availableQuantity > 0 ? "#28a745" : "#dc3545", fontWeight: 600 }}>{availableQuantity}</span></p>
                  {item.reservedQuantity > 0 && (
                    <p style={{ fontSize: "0.85rem", color: "#666" }}>
                      ({item.quantity || 0} total, {item.reservedQuantity} reserved)
                    </p>
                  )}
                  
                  {/* AI Tags */}
                  {item.aiTags && item.aiTags.length > 0 && (
                    <div style={{ marginTop: "8px", marginBottom: "8px" }}>
                      <p style={{ marginBottom: "4px", fontSize: "0.85rem", fontWeight: 600, color: "#666" }}>
                        AI Tags:
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {item.aiTags.slice(0, 5).map((tag, index) => (
                          <span
                            key={index}
                            style={{
                              padding: "3px 8px",
                              backgroundColor: "#e3f2fd",
                              color: "#1976d2",
                              borderRadius: "12px",
                              fontSize: "0.75rem",
                              fontWeight: 500
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                        {item.aiTags.length > 5 && (
                          <span style={{ fontSize: "0.75rem", color: "#666" }}>
                            +{item.aiTags.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <button
                    className="redeem-button"
                    onClick={() => handleRedeem(item)}
                    disabled={!canAfford || availableQuantity <= 0}
                    style={{
                      marginTop: 12,
                      width: "100%",
                      padding: "10px",
                      backgroundColor: canAfford && availableQuantity > 0 ? "#ff6b35" : "#ccc",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: canAfford && availableQuantity > 0 ? "pointer" : "not-allowed",
                      fontWeight: 600,
                    }}
                  >
                    {!canAfford ? "Insufficient Balance" : availableQuantity <= 0 ? "Out of Stock" : "Redeem"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Box>

      {/* Confirmation Modal */}
      {confirmItem && (() => {
        const price = confirmItem.tokenPrice || confirmItem.price || 0;
        const maxQuantity = Math.min(5, confirmItem.quantity || 0);
        const quantity = Number(redeemQuantity) || 1;
        const totalPrice = price * quantity;
        const balanceAfter = (me?.tokenBalance ?? 0) - totalPrice;
        
        return (
          <div className="modal-overlay" onClick={cancelRedeem}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
              maxWidth: "500px",
              padding: "24px",
              backgroundColor: "white",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}>
              <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: "1.5rem", fontWeight: 600 }}>Confirm Redemption</h3>
              <p style={{ marginBottom: 16 }}>Are you sure you want to redeem <strong>{confirmItem.name}</strong>?</p>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
                  Quantity (Max: {maxQuantity} per person, up to 5):
                </label>
                <input
                  type="number"
                  min="1"
                  max={maxQuantity}
                  value={redeemQuantity}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(maxQuantity, Number(e.target.value) || 1));
                    setRedeemQuantity(val);
                  }}
                  disabled={redeeming}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    fontSize: "1rem",
                    boxSizing: "border-box",
                  }}
                />
                <p style={{ marginTop: 4, fontSize: "0.85rem", color: "#666" }}>
                  Available: {confirmItem.quantity || 0} | Max per person: 5
                </p>
              </div>

              <div style={{ 
                padding: "12px", 
                backgroundColor: "#f9f9f9", 
                borderRadius: "6px",
                marginBottom: 16 
              }}>
                <p style={{ margin: "4px 0" }}><b>Price per item:</b> {price} tokens</p>
                <p style={{ margin: "4px 0" }}><b>Quantity:</b> {quantity}</p>
                <p style={{ margin: "4px 0", fontSize: "1.1rem", fontWeight: 600, color: "#ff6b35" }}>
                  <b>Total Price:</b> {totalPrice} tokens
                </p>
                <p style={{ margin: "8px 0 4px 0" }}><b>Your Balance:</b> {me?.tokenBalance ?? 0} tokens</p>
                <p style={{ margin: "4px 0", color: balanceAfter < 0 ? "#dc3545" : "#28a745", fontWeight: 600 }}>
                  <b>Balance After:</b> {balanceAfter} tokens
                </p>
              </div>

              <div className="modal-actions" style={{ 
                display: "flex", 
                gap: "12px", 
                justifyContent: "flex-end",
                marginTop: 20 
              }}>
                <button
                  onClick={cancelRedeem}
                  disabled={redeeming}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: "#f5f5f5",
                    color: "#333",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    cursor: redeeming ? "not-allowed" : "pointer",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRedeem}
                  disabled={redeeming || quantity < 1 || quantity > maxQuantity || balanceAfter < 0}
                  style={{
                    padding: "10px 20px",
                    backgroundColor: redeeming || quantity < 1 || quantity > maxQuantity || balanceAfter < 0 ? "#ccc" : "#ff6b35",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: redeeming || quantity < 1 || quantity > maxQuantity || balanceAfter < 0 ? "not-allowed" : "pointer",
                    fontWeight: 600,
                  }}
                >
                  {redeeming ? "Processing..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default BrowsePage;


