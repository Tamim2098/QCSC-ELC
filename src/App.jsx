import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Join from './pages/Join';
import Gallery from './pages/Gallery';
import Contact from './pages/Contact';
import Members from './pages/Members'; // Members component import kora ache
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';

const ADMIN_PATHS = ['/login', '/admin-dashboard'];

// ── Protected Route ──
const ProtectedRoute = ({ user, loading, children }) => {
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100dvh', background: '#070c0a',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid rgba(240,165,0,0.15)',
          borderTopColor: '#f0a500',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
};

const App = () => {
  const location  = useLocation();
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isAdminPage = ADMIN_PATHS.includes(location.pathname);

  return (
    <div>
      {!isAdminPage && <Navbar />}

      <Routes>
        {/* ── Public Routes ── */}
        <Route path="/"          element={<Home />} />
        <Route path="/join"      element={<Join />} />
        <Route path="/gallery"   element={<Gallery />} />
        <Route path="/contact"   element={<Contact />} />
        <Route path="/members"   element={<Members />} />  {/* Members component use kora hoiche */}

        {/* ── Login: already logged in হলে dashboard এ পাঠাবে ── */}
        <Route
          path="/login"
          element={
            !loading && user
              ? <Navigate to="/admin-dashboard" replace />
              : <Login />
          }
        />

        {/* ── Protected Admin Dashboard ── */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute user={user} loading={loading}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* ── 404 Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!isAdminPage && <Footer />}
    </div>
  );
};

export default App;