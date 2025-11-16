import React, { useState } from "react";
import { api } from "../api";
import Layout from "../components/Layout";
import DashboardPage from "./member/DashboardPage";
import TransferPage from "./member/TransferPage";
import MyDonationsPage from "./member/MyDonationsPage";
import AddDonationsPage from "./member/AddDonationsPage";
import SettingsPage from "./member/SettingsPage";
import "./MemberApp.css";

function MemberApp({ me, refresh, onLogout }) {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const navItems = [
    { key: "dashboard", label: "Dashboard" },
    { key: "transfer", label: "Transfer" },
    { key: "donations", label: "Donations" },
    { key: "settings", label: "Profile" },
    { key: "logout", label: "Logout" },
  ];

  function handlePageChange(page) {
    if (page === "logout") {
      api.setToken("");
      onLogout();
    } else {
      setCurrentPage(page);
    }
  }

  function renderPage() {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage me={me} onNavigate={(page) => setCurrentPage(page)} />;
      case "transfer":
        return <TransferPage refresh={refresh} />;
      case "donations":
        return <MyDonationsPage refresh={refresh} />;
      case "settings":
        return <SettingsPage me={me} refresh={refresh} />;
      default:
        return <DashboardPage me={me} onNavigate={(page) => setCurrentPage(page)} />;
    }
  }

  return (
    <Layout
      title=""
      navItems={navItems}
      currentPage={currentPage}
      onPageChange={handlePageChange}
    >
      {renderPage()}
    </Layout>
  );
}

export default MemberApp;

