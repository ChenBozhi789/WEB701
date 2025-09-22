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
  
};
