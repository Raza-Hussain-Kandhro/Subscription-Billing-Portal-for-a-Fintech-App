import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

/**
 * Navbar
 * Top bar that sits above every authenticated page.
 * Shows the page title on the left and a compact user greeting + logout
 * on the right, so the greeting is visible even when the sidebar is
 * collapsed on mobile.
 *
 * Props:
 *  - title: string   -> current page title
 *  - userName: string
 *  - onLogout: fn
 */
function Navbar({ title, userName = 'Guest', onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      navigate('/signin');
    }
  };

  return (
    <header className="navbar">
      <h1 className="navbar-title">{title}</h1>

      <div className="navbar-right">
        <span className="navbar-greeting">
          Hi, <strong>{userName.split(' ')[0]}</strong>
        </span>
        <button className="btn btn-secondary btn-sm navbar-logout" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </header>
  );
}

export default Navbar;
