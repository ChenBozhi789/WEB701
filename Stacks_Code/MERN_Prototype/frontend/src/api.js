// src/api.js
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

let _token = localStorage.getItem("jwt") || "";

export const api = {
  setToken(t) {
    _token = t || "";
    if (t) localStorage.setItem("jwt", t);
    else localStorage.removeItem("jwt");
  },
  getToken() {
    return _token;
  },
  async request(path, { method = "GET", body, headers } = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(headers || {}),
        ...(_token ? { Authorization: `Bearer ${_token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
    if (!res.ok) {
      const err = new Error(data?.message || "Request failed");
      err.status = res.status; err.body = data; throw err;
    }
    return data;
  },
  // convenience wrappers
  login: (email, password) => 
    api.request("/api/auth/login", { 
      method: "POST", 
      body: { email, password } 
    }),
    
  register: (payload) => 
    api.request("/api/auth/register", { 
      method: "POST", 
      body: payload 
    }),

  me: () => api.request("/api/auth/me"),

  transferDirect: (payload) => 
    api.request("/api/tokens/transfer-direct", { 
      method: "POST", 
      body: payload 
    }),

  history: () => api.request("/api/tokens/history"),

  changePassword: (oldPwd, newPwd) =>
    api.request("/api/auth/change-password", { 
      method: "POST", 
      body: { oldPassword: oldPwd, newPassword: newPwd } 
    }),

  updateProfile: (name) =>
    api.request("/api/auth/profile", {
      method: "PUT",
      body: { name }
    }),
  
  createItem: (payload) =>
    api.request("/api/items", {
      method: "POST",
      body: payload
    }),

  getMyItems: () => api.request("/api/items/my"),

  updateItem: (id, payload) =>
    api.request(`/api/items/${id}`, {
      method: "PUT",
      body: payload
    }),

  claimInitialTokens: () =>
    api.request("/api/tokens/claim-initial", {
      method: "POST"
    }),
  
  // Transaction APIs
  getPendingTransactions: () => api.request("/api/transactions/pending"),

  acceptTransaction: (transactionId) =>
    api.request(`/api/transactions/${transactionId}/accept`, {
      method: "POST"
    }),

  rejectTransaction: (transactionId) =>
    api.request(`/api/transactions/${transactionId}/reject`, {
      method: "POST"
    }),

  getTransactionHistory: () => api.request("/api/transactions/history"),
  
  // Image and AI Vision API
  analyzeImage: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const res = await fetch(`${API_BASE}/api/items/analyze-image`, {
      method: 'POST',
      headers: {
        ...(_token ? { Authorization: `Bearer ${_token}` } : {}),
      },
      body: formData,
    });
    
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
    
    if (!res.ok) {
      const err = new Error(data?.message || "Request failed");
      err.status = res.status; err.body = data; throw err;
    }
    return data;
  },

  createItemWithImage: async (payload, imageFile) => {
    const formData = new FormData();
    
    // Add image if provided
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    // Add other fields
    Object.keys(payload).forEach(key => {
      if (payload[key] !== undefined && payload[key] !== null) {
        // Handle arrays (like aiTags)
        if (Array.isArray(payload[key])) {
          formData.append(key, JSON.stringify(payload[key]));
        } else {
          formData.append(key, payload[key]);
        }
      }
    });
    
    const res = await fetch(`${API_BASE}/api/items`, {
      method: 'POST',
      headers: {
        ...(_token ? { Authorization: `Bearer ${_token}` } : {}),
      },
      body: formData,
    });
    
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
    
    if (!res.ok) {
      const err = new Error(data?.message || "Request failed");
      err.status = res.status; err.body = data; throw err;
    }
    return data;
  },
  
};
