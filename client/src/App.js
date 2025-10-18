import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';
import {
  Profile,
  Vacancies,
  Responses,
  Searches,
  Settings,
  Billing,
  AdminDashboard,
  AdminUsers,
  AdminPayments,
  AdminResponses
} from './pages';

// Layout
import Layout from './components/Layout';

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/vacancies" element={
              <ProtectedRoute>
                <Layout>
                  <Vacancies />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/responses" element={
              <ProtectedRoute>
                <Layout>
                  <Responses />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/searches" element={
              <ProtectedRoute>
                <Layout>
                  <Searches />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/billing" element={
              <ProtectedRoute>
                <Layout>
                  <Billing />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Admin routes */}
            <Route path="/admin" element={
              <AdminRoute>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </AdminRoute>
            } />
            
            <Route path="/admin/users" element={
              <AdminRoute>
                <Layout>
                  <AdminUsers />
                </Layout>
              </AdminRoute>
            } />
            
            <Route path="/admin/payments" element={
              <AdminRoute>
                <Layout>
                  <AdminPayments />
                </Layout>
              </AdminRoute>
            } />
            
            <Route path="/admin/responses" element={
              <AdminRoute>
                <Layout>
                  <AdminResponses />
                </Layout>
              </AdminRoute>
            } />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
