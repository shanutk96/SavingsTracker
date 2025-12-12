import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import DistributionPage from './components/Distribution/DistributionPage';
import AnalyticsPage from './components/Analytics/AnalyticsPage';

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        {!user ? (
          <Route path="*" element={<Login />} />
        ) : (
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="distribution" element={<DistributionPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </Router>
  );
}

export default App;
