import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import DistributionPage from './components/Distribution/DistributionPage';
import AnalyticsPage from './components/Analytics/AnalyticsPage';
import CreditCardPage from './components/CreditCards/CreditCardPage';
import ExpensesPage from './components/Expenses/ExpensesPage';

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
            <Route path="credit-cards" element={<CreditCardPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </Router>
  );
}

export default App;
