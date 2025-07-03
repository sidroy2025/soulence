import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { initializeDemoData } from './services/mockApi';

// Pages
import { LoginPage } from './pages/LoginPage';
import { MoodPage } from './pages/MoodPage';
import { DashboardPage } from './pages/DashboardPage';
import { CrisisPage } from './pages/CrisisPage';
import AcademicPage from './pages/AcademicPage';
import { SleepPage } from './pages/SleepPage';

// Components
import { LoadingSpinner } from './components/LoadingSpinner';
import { DebugInfo } from './components/DebugInfo';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;
  const isLoading = authStore.isLoading ?? false;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;
  const isLoading = authStore.isLoading ?? false;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

function App() {
  const authStore = useAuthStore();
  const { loadUser, isAuthenticated, isLoading } = authStore;

  // Initialize demo data and load user on app start
  React.useEffect(() => {
    console.log('App initializing...');
    try {
      initializeDemoData();
      console.log('Demo data initialized');
      if (isAuthenticated) {
        console.log('User is authenticated, loading user data...');
        loadUser();
      }
    } catch (error) {
      console.error('Error during app initialization:', error);
    }
  }, [loadUser, isAuthenticated]);

  // Debug: App render state
  console.log('App render - isAuthenticated:', isAuthenticated, 'authStore keys:', Object.keys(authStore));

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } 
          />

          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/mood" 
            element={
              <ProtectedRoute>
                <MoodPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/crisis" 
            element={
              <ProtectedRoute>
                <CrisisPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/academic" 
            element={
              <ProtectedRoute>
                <AcademicPage />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/sleep" 
            element={
              <ProtectedRoute>
                <SleepPage />
              </ProtectedRoute>
            } 
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#059669',
              },
            },
            error: {
              style: {
                background: '#DC2626',
              },
            },
          }}
        />
        
      </div>
    </Router>
  );
}

export default App;