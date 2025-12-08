import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/ui/Layout';
import { Dashboard } from './pages/Dashboard';
import { FleetMap } from './pages/FleetMap';
import { FleetManager } from './pages/FleetManager';
import { ShiftManager } from './pages/ShiftManager';
import { SparePartsManager } from './pages/SparePartsManager';
import { MobileOperator } from './pages/MobileOperator';
import { SuperAdmin } from './pages/SuperAdmin';
import { TeamChat } from './pages/TeamChat';
import { DevTools } from './components/ui/DevTools';

const ProtectedRoute = ({ children, roles }: { children?: React.ReactNode, roles?: string[] }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-500">Initializing System...</div>;
  
  // Since we bypass login, user should always be present. 
  // If explicitly null (logic error), we just show a message instead of redirecting to login.
  if (!user) return <div className="p-10 text-center">User not initialized.</div>;

  if (roles && !roles.includes(user.role)) return <div className="p-10 text-center text-red-500 font-bold">Access Denied: Permission restrictions apply.</div>;

  return <>{children}</>;
};

const AppContent = () => {
    const { currentRole, currentPage } = useApp();

    // If AppContext thinks we are an operator (e.g. via DevTools switch), render mobile view
    if (currentRole === 'operator') {
         // Operator can see either Dashboard(MobileOperator) or Chat
        const renderOperatorPage = () => {
            if (currentPage === 'chat') return <TeamChat />;
            return <MobileOperator />;
        };

        return (
            <Layout>
                {renderOperatorPage()}
                <DevTools />
            </Layout>
        );
    }

    return (
        <>
            <Routes>
                {/* Default Route */}
                <Route path="/" element={
                    <ProtectedRoute>
                        <Layout><Dashboard /></Layout>
                    </ProtectedRoute>
                } />
                
                <Route path="/map" element={
                    <ProtectedRoute roles={['super_admin', 'manager', 'supervisor']}>
                        <Layout><FleetMap /></Layout>
                    </ProtectedRoute>
                } />
                <Route path="/machines" element={
                    <ProtectedRoute roles={['super_admin', 'manager']}>
                        <Layout><FleetManager /></Layout>
                    </ProtectedRoute>
                } />
                <Route path="/shifts" element={
                    <ProtectedRoute roles={['super_admin', 'manager', 'supervisor']}>
                        <Layout><ShiftManager /></Layout>
                    </ProtectedRoute>
                } />
                <Route path="/parts" element={
                    <ProtectedRoute roles={['super_admin', 'manager', 'supervisor']}>
                        <Layout><SparePartsManager /></Layout>
                    </ProtectedRoute>
                } />
                <Route path="/admin" element={
                    <ProtectedRoute roles={['super_admin']}>
                        <Layout><SuperAdmin /></Layout>
                    </ProtectedRoute>
                } />
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <DevTools />
        </>
    );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppProvider>
           <AppContent />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;