import React from "react";
import "./Layout.css";

function Layout({ title, navItems, currentPage, onPageChange, children, actionButton }) {
  return (
    <div className="app-layout">
      {title && (
        <div className="layout-title-container">
      <h1 className="layout-title">{title}</h1>
          {actionButton && <div className="layout-title-action">{actionButton}</div>}
        </div>
      )}
      
      <nav className="layout-nav">
        <div className="nav-brand">CharityConnect</div>
        <div className="nav-buttons">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`nav-button ${currentPage === item.key ? "active" : ""}`}
              onClick={() => onPageChange(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="layout-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;

