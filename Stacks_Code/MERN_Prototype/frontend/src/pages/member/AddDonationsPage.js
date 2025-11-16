import React, { useState } from "react";
import { api } from "../../api";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

function AddDonationsPage({ refresh, onSuccess, onBack }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState("product");
  const [description, setDescription] = useState("");
  const [tokenPrice, setTokenPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Image and AI states
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [imagePath, setImagePath] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  // Handle image selection
  function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMsg("Please select an image file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMsg("Image size must be less than 5MB");
      return;
    }

    setSelectedImage(file);
    setMsg("");
    setAiAnalysis(null);
    setImagePath(null);
    setImageUrl(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  }

  // Analyze image with AI
  async function handleAnalyzeImage() {
    if (!selectedImage) {
      setMsg("Please select an image first");
      return;
    }

    setAnalyzing(true);
    setMsg("");

    try {
      const result = await api.analyzeImage(selectedImage);
      
      if (result.success && result.aiAnalysis) {
        setAiAnalysis(result.aiAnalysis);
        setImagePath(result.imagePath);
        setImageUrl(result.imageUrl);
        
        // Auto-fill form fields with AI suggestions
        if (result.aiAnalysis.aiDetectedCategory && !category) {
          setCategory(result.aiAnalysis.aiDetectedCategory);
        }
        if (result.aiAnalysis.aiSuggestedName && !name) {
          setName(result.aiAnalysis.aiSuggestedName);
        }
        
        setMsg("✓ Image analyzed successfully! AI suggestions have been filled in. You can modify them if needed.");
      } else {
        setMsg("Image analyzed but no suggestions available");
      }
    } catch (e) {
      setMsg(`Failed to analyze image (${e.status}): ${e.body?.message || e.message || ""}`);
      setAiAnalysis(null);
    } finally {
      setAnalyzing(false);
    }
  }

  // Remove selected image
  function handleRemoveImage() {
    setSelectedImage(null);
    setImagePreview(null);
    setAiAnalysis(null);
    setImagePath(null);
    setImageUrl(null);
  }

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
        // Include AI analysis if available
        ...(aiAnalysis && {
          aiDetectedCategory: aiAnalysis.aiDetectedCategory,
          aiSuggestedName: aiAnalysis.aiSuggestedName,
          aiTags: aiAnalysis.aiTags,
          aiConfidence: aiAnalysis.aiConfidence,
        }),
        // Include image path if image was already analyzed
        ...(imagePath && { imagePath }),
      };

      // Use createItemWithImage if image is selected, otherwise use regular createItem
      if (selectedImage && !imagePath) {
        // Image not yet uploaded, upload it now
        await api.createItemWithImage(payload, selectedImage);
      } else if (imagePath) {
        // Image already uploaded via analyze-image, use path
        await api.createItem(payload);
      } else {
        // No image, use regular createItem
        await api.createItem(payload);
      }

      setMsg("Product/Service added successfully ✓");
      
      // Reset form
      setName("");
      setCategory("");
      setType("product");
      setDescription("");
      setTokenPrice("");
      setQuantity("1");
      setSelectedImage(null);
      setImagePreview(null);
      setAiAnalysis(null);
      setImagePath(null);
      setImageUrl(null);
      
      refresh?.();
      
      // Navigate to My Donations page after a short delay to show success message
      setTimeout(() => {
        onSuccess?.();
      }, 1000);
    } catch (e) {
      setMsg(`Failed to add item (${e.status}): ${e.body?.message || ""}`);
    } finally {
      setSubmitting(false);
    }
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
            Add New Donation
          </h2>
          <p style={{ 
            margin: "0 0 32px 0", 
            color: "#666", 
            fontSize: "0.95rem",
            lineHeight: "1.5"
          }}>
            Fill in the required information to add a Product or Service to your donations.
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

          {/* Image Upload Section */}
          <div>
            <label style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: 600,
              color: "#333",
              fontSize: "0.95rem"
            }}>
              Item Image (Optional)
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {!imagePreview && !selectedImage && (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    disabled={submitting || analyzing}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      fontSize: "1rem",
                      fontFamily: "inherit",
                      cursor: (submitting || analyzing) ? "not-allowed" : "pointer",
                      boxSizing: "border-box",
                    }}
                  />
                  <p style={{ marginTop: "8px", fontSize: "0.85rem", color: "#666" }}>
                    Supported formats: JPEG, PNG, GIF, WebP (Max 5MB)
                  </p>
                </div>
              )}

              {imagePreview && (
                <div style={{
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "12px",
                  backgroundColor: "#f9f9f9"
                }}>
                  <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        width: "150px",
                        height: "150px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid #ddd"
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 8px 0", fontWeight: 600 }}>
                        {selectedImage?.name}
                      </p>
                      {!aiAnalysis && (
                        <button
                          onClick={handleAnalyzeImage}
                          disabled={analyzing || submitting}
                          style={{
                            padding: "8px 16px",
                            backgroundColor: "#ff6b35",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: (analyzing || submitting) ? "not-allowed" : "pointer",
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            opacity: (analyzing || submitting) ? 0.6 : 1,
                            marginRight: "8px"
                          }}
                        >
                          {analyzing ? "Analyzing..." : "🤖 Analyze with AI"}
                        </button>
                      )}
                      <button
                        onClick={handleRemoveImage}
                        disabled={analyzing || submitting}
                        style={{
                          padding: "8px 16px",
                          backgroundColor: "#f5f5f5",
                          color: "#333",
                          border: "1px solid #ddd",
                          borderRadius: "6px",
                          cursor: (analyzing || submitting) ? "not-allowed" : "pointer",
                          fontWeight: 600,
                          fontSize: "0.9rem"
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Analysis Results */}
              {aiAnalysis && (
                <div style={{
                  border: "2px solid #4CAF50",
                  borderRadius: "8px",
                  padding: "16px",
                  backgroundColor: "#f0f9f0"
                }}>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                    <span style={{ fontSize: "1.2rem", marginRight: "8px" }}>🤖</span>
                    <h4 style={{ margin: 0, color: "#2e7d32", fontWeight: 600 }}>
                      AI Analysis Results
                    </h4>
                    {aiAnalysis.aiConfidence && (
                      <span style={{
                        marginLeft: "auto",
                        fontSize: "0.85rem",
                        color: "#666",
                        fontWeight: 500
                      }}>
                        Confidence: {(aiAnalysis.aiConfidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  
                  {aiAnalysis.aiDetectedCategory && (
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Detected Category:</strong>{" "}
                      <span style={{ color: "#2e7d32", fontWeight: 600 }}>
                        {aiAnalysis.aiDetectedCategory}
                      </span>
                      {category === aiAnalysis.aiDetectedCategory && (
                        <span style={{ marginLeft: "8px", color: "#4CAF50" }}>✓ Applied</span>
                      )}
                    </div>
                  )}

                  {aiAnalysis.aiSuggestedName && (
                    <div style={{ marginBottom: "8px" }}>
                      <strong>Suggested Name:</strong>{" "}
                      <span style={{ color: "#2e7d32" }}>
                        {aiAnalysis.aiSuggestedName}
                      </span>
                      {name === aiAnalysis.aiSuggestedName && (
                        <span style={{ marginLeft: "8px", color: "#4CAF50" }}>✓ Applied</span>
                      )}
                    </div>
                  )}

                  {aiAnalysis.aiTags && aiAnalysis.aiTags.length > 0 && (
                    <div>
                      <strong>Tags:</strong>
                      <div style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                        marginTop: "8px"
                      }}>
                        {aiAnalysis.aiTags.map((tag, index) => (
                          <span
                            key={index}
                            style={{
                              padding: "4px 10px",
                              backgroundColor: "#4CAF50",
                              color: "white",
                              borderRadius: "12px",
                              fontSize: "0.85rem",
                              fontWeight: 500
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <p style={{
                    marginTop: "12px",
                    marginBottom: 0,
                    fontSize: "0.85rem",
                    color: "#666",
                    fontStyle: "italic"
                  }}>
                    💡 You can modify the suggested values above before submitting.
                  </p>
                </div>
              )}
            </div>
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
            {submitting ? "Adding..." : "Confirm & Add Donation"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddDonationsPage;

