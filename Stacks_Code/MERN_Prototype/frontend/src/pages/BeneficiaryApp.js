import React, { useState } from "react";
import { api } from "../api";
import Layout from "../components/Layout";
import DashboardPage from "./beneficiary/DashboardPage";
import TransferPage from "./beneficiary/TransferPage";
import BrowsePage from "./beneficiary/BrowsePage";
import ProfilePage from "./beneficiary/ProfilePage";
import "./BeneficiaryApp.css";

function BeneficiaryApp({ me, refresh, onLogout }) {
  const [currentPage, setCurrentPage] = useState("dashboard");

  const navItems = [
    { key: "dashboard", label: "Dashboard" },
    { key: "transfer", label: "Transfer" },
    { key: "browse", label: "Browse" },
    { key: "profile", label: "Profile" },
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
        return <DashboardPage me={me} refresh={refresh} onNavigate={(page) => setCurrentPage(page)} />;
      case "transfer":
        return <TransferPage refresh={refresh} />;
      case "browse":
        return <BrowsePage me={me} refresh={refresh} />;
      case "profile":
        return <ProfilePage me={me} refresh={refresh} />;
      default:
        return <DashboardPage me={me} refresh={refresh} onNavigate={(page) => setCurrentPage(page)} />;
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

export default BeneficiaryApp;

