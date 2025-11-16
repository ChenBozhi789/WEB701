import React from "react";
import { api } from "../api";
import Box from "./Box";

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

export default Profile;

