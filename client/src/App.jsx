import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

import Signup from './pages/Signup';
import Signin from './pages/Signin';
import ClientDashboard from './pages/ClientDashboard';
import Plans from './pages/Plans';
import BillingHistory from './pages/BillingHistory';
import AdminDashboard from './pages/AdminDashboard';

import './styles/global.css';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/plans': 'View & Change Plan',
  '/billing-history': 'Billing History',
  '/admin': 'Overview',
  '/admin/clients': 'Clients',
  '/admin/plans': 'Plans',
};

/**
 * AuthenticatedLayout
 * Shared shell (Sidebar + Navbar) for every page that requires a
 * session. Redirects to /signin if there is no active session, and
 * away from the wrong side of the app if a client tries an admin
 * route or vice versa.
 */
function AuthenticatedLayout({ session, onLogout, requiredRole }) {
  const location = useLocation();

  if (!session) {
    return <Navigate to="/signin" replace />;
  }
  if (requiredRole && session.role !== requiredRole) {
    return <Navigate to={session.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  const title = PAGE_TITLES[location.pathname] || (session.role === 'admin' ? 'Admin' : 'Dashboard');

  return (
    <div className="app-shell">
      <Sidebar userName={session.name} role={session.role} onLogout={onLogout} />
      <div className="app-main">
        <Navbar title={title} userName={session.name} onLogout={onLogout} />
        <Outlet />
      </div>
    </div>
  );
}

function App() {
  // In a full build this would come from a auth context / JWT-free
  // server session (per the SRS, this project uses simple DB-backed
  // signup/signin — no JWT/session library).
  const [session, setSession] = useState(null);

  const handleAuthenticated = ({ role, name }) => setSession({ role, name });
  const handleLogout = () => setSession(null);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={session ? (session.role === 'admin' ? '/admin' : '/dashboard') : '/signin'} replace />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin onAuthenticated={handleAuthenticated} />} />

        <Route element={<AuthenticatedLayout session={session} onLogout={handleLogout} requiredRole="client" />}>
          <Route path="/dashboard" element={<ClientDashboard userName={session?.name} />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/billing-history" element={<BillingHistory />} />
        </Route>

        <Route element={<AuthenticatedLayout session={session} onLogout={handleLogout} requiredRole="admin" />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/clients" element={<AdminDashboard />} />
          <Route path="/admin/plans" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
