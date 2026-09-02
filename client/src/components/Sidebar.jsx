import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../styles/Sidebar.css';

/**
 * Sidebar
 * Left navigation for the authenticated app shell.
 * Renders a different link set depending on `role` ('client' | 'admin').
 *
 * Props:
 *  - userName: string          -> shown in the greeting block
 *  - role: 'client' | 'admin'  -> controls which nav links render
 *  - onLogout: fn              -> called when Logout is clicked
 */
function Sidebar({ userName = 'Guest', role = 'client', onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const clientLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
    { to: '/plans', label: 'View & Change Plan', icon: '📦' },
    { to: '/billing-history', label: 'Billing History', icon: '🧾' },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Overview', icon: '📊' },
    { to: '/admin/clients', label: 'Clients', icon: '👥' },
    { to: '/admin/plans', label: 'Plans', icon: '📦' },
  ];

  const links = role === 'admin' ? adminLinks : clientLinks;

  const handleLogout = () => {
    setMobileOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      navigate('/signin');
    }
  };

  const initials = userName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <button
        className="sidebar-toggle"
        aria-label="Toggle navigation menu"
        onClick={() => setMobileOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>

      {mobileOpen && <div className="sidebar-scrim" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-mark">SB</span>
          <span className="sidebar-brand-name">Subscription Billing</span>
        </div>

        <div className="sidebar-user">
          <span className="sidebar-avatar">{initials || 'U'}</span>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{userName}</span>
            <span className="sidebar-user-role">{role === 'admin' ? 'Administrator' : 'Client'}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className="sidebar-link-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button className="sidebar-logout" onClick={handleLogout}>
          <span className="sidebar-link-icon">⏻</span>
          Log out
        </button>
      </aside>
    </>
  );
}

export default Sidebar;
