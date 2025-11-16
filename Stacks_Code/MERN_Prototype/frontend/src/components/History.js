import React, { useEffect, useState } from "react";
import { api } from "../api";
import Box from "./Box";

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

export default History;

