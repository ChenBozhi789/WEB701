import React, { useEffect, useState } from "react";
import { api } from "./api";
import "./App.css";

const Box = ({ title, children }) => (
  <div className="box">
    <h2>{title}</h2>
    {children}
  </div>
);

function LoginRegister({ onLoggedIn }) {
  const [mode, setMode] = useState("login"); // login | register
  const [name, setName] = useState("");
  const [role, setRole] = useState("beneficiary");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function doLogin() {
    try {
      const data = await api.login(email, password);
      api.setToken(data.token);
      setMsg("Logged in ✓");
      onLoggedIn();
    } catch (e) {
      setMsg(`Login failed (${e.status}): ${e.body?.message || ""}`);
    }
  }

  async function doRegister() {
    try {
      await api.register({ name, email, password, role });
      setMsg("Registered ✓ — now login");
      setMode("login");
    } catch (e) {
      setMsg(`Register failed (${e.status}): ${e.body?.message || ""}`);
    }
  }

  return (
    <Box title="Register / Login">
      <div className="tabs">
        <button onClick={() => setMode("login")} disabled={mode === "login"}>Login</button>
        <button onClick={() => setMode("register")} disabled={mode === "register"}>Register</button>
      </div>

      {mode === "register" && (
        <>
          <label>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          <label>Role</label>
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="beneficiary">beneficiary</option>
            <option value="member">member</option>
          </select>
        </>
      )}

      <label>Email</label>
      <input value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />

      <label>Password</label>
      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="password" />

      <div style={{ marginTop: 12 }}>
        {mode === "login"
          ? <button onClick={doLogin}>Login</button>
          : <button onClick={doRegister}>Register</button>}
      </div>

      <p className="msg">{msg}</p>
    </Box>
  );
}

function Profile({ me, refresh, onLogout }) {
  return (
    <Box title="My Account">
      <p><b>Name:</b> {me?.name || "—"}</p>
      <p><b>Email:</b> {me?.email || "—"}</p>
      <p><b>Role:</b> {me?.role || "—"}</p>
      <p><b>Token Balance:</b> {me?.tokenBalance ?? "—"}</p>
      <div className="row">
        <button onClick={refresh}>Refresh</button>
        <button onClick={() => { api.setToken(""); onLogout(); }}>Logout</button>
      </div>
    </Box>
  );
}

function Transfer({ onDone }) {
  const [toEmail, setToEmail] = useState("");
  const [toUserId, setToUserId] = useState("");
  const [amount, setAmount] = useState(10);
  const [msg, setMsg] = useState("");

  async function submit() {
    try {
      const body = { amount: Number(amount) };
      if (toEmail) body.toEmail = toEmail;
      if (toUserId) body.toUserId = toUserId;
      const res = await api.transferDirect(body);
      setMsg(`Transfer OK. txId = ${res?.tx?._id}`);
      setToEmail(""); setToUserId("");
      onDone?.();
    } catch (e) {
      setMsg(`Transfer failed (${e.status}): ${e.body?.message || ""}`);
    }
  }

  return (
    <Box title="Transfer Tokens">
      <p>Send tokens by <b>email</b> (preferred) or paste <code>userId</code>. Works both directions (member ↔ beneficiary).</p>
      <label>Receiver Email</label>
      <input value={toEmail} onChange={e => setToEmail(e.target.value)} placeholder="receiver@example.com" />
      <label>OR Receiver UserId</label>
      <input value={toUserId} onChange={e => setToUserId(e.target.value)} placeholder="66f9c7b1e9a4f02a1c123456" />
      <label>Amount</label>
      <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} />
      <div style={{ marginTop: 12 }}>
        <button onClick={submit}>Send</button>
      </div>
      <p className="msg">{msg}</p>
    </Box>
  );
}

function History() {
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState("");

  async function load() {
    try {
      const list = await api.history();
      setRows(Array.isArray(list) ? list : []);
      setMsg("");
    } catch (e) {
      setMsg(`Load failed (${e.status}): ${e.body?.message || ""}`);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <Box title="My History">
      <button onClick={load}>Reload</button>
      {msg && <p className="msg">{msg}</p>}
      <table className="tbl">
        <thead>
          <tr><th>When</th><th>From</th><th>To</th><th>Amount</th><th>Status</th></tr>
        </thead>
        <tbody>
          {rows.map(x => (
            <tr key={x._id}>
              <td>{new Date(x.createdAt).toLocaleString()}</td>
              <td>{x.fromUser?.name || x.fromUser?.email || x.fromUser}</td>
              <td>{x.toUser?.name || x.toUser?.email || x.toUser}</td>
              <td>{x.amount}</td>
              <td>{x.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}

function ChangePassword() {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [msg, setMsg] = useState("");

  async function submit() {
    try {
      const res = await api.changePassword(oldPwd, newPwd); // If not implemented on backend, will 404
      setMsg("Password changed ✓");
      setOldPwd(""); setNewPwd("");
    } catch (e) {
      setMsg(`Change failed (${e.status}): ${e.body?.message || "Endpoint not implemented"}`);
    }
  }
  return (
    <Box title="Change Password">
      <label>Current Password</label>
      <input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} />
      <label>New Password</label>
      <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} />
      <div style={{ marginTop: 12 }}>
        <button onClick={submit}>Update Password</button>
      </div>
      <p className="msg">{msg}</p>
    </Box>
  );
}

export default function App() {
  const [me, setMe] = useState(null);
  const [ready, setReady] = useState(false);

  async function loadMe() {
    try {
      const m = await api.me();
      setMe(m);
    } catch {
      setMe(null);
    } finally {
      setReady(true);
    }
  }

  useEffect(() => { loadMe(); }, []);

  if (!ready) return <p style={{ padding: 24 }}>Loading…</p>;

  return (
    <div className="container">
      <h1>CharityConnect</h1>
      {!api.getToken() || !me ? (
        <LoginRegister onLoggedIn={loadMe} />
      ) : (
        <>
          <Profile me={me} refresh={loadMe} onLogout={() => setMe(null)} />
          <Transfer onDone={loadMe} />
          <History />
          <ChangePassword />
        </>
      )}
    </div>
  );
}
