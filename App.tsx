
import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/ui/Layout';
import { Dashboard } from './pages/Dashboard';
import { FleetManager } from './pages/FleetManager';
import { ShiftManager } from './pages/ShiftManager';
import { MobileOperator } from './pages/MobileOperator';
import { SuperAdmin } from './pages/SuperAdmin';
import { SparePartsManager } from './pages/SparePartsManager';
import { TeamChat } from './pages/TeamChat';
import { Card, Button } from './components/ui/Common';
import { DevTools } from './components/ui/DevTools';

const AppContent = () => {
  const { currentPage, currentRole, setPage } = useApp();

  // Role-based rendering logic for Operator (Mobile view mainly)
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

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'machines':
        return <FleetManager />;
      case 'shifts':
        return <ShiftManager />;
      case 'sites':
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-slate-300">Sites Module</h2>
                <p className="text-slate-400">Under Construction for this Demo</p>
                <Button className="mt-4" onClick={() => setPage('dashboard')}>Go Back</Button>
            </div>
        );
      case 'fuel':
        return (
             <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Fuel Logs</h2>
                <p>Detailed Fuel tracking implementation would go here.</p>
                {/* Reusing logic from shifts for brevity in this response */}
             </Card>
        );
      case 'maintenance':
        return (
             <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Maintenance Jobs</h2>
                <p>Maintenance tracking implementation would go here.</p>
             </Card>
        );
      case 'spare_parts':
        return <SparePartsManager />;
      case 'reports':
        return (
             <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Reports Center</h2>
                <p>Export functionality and advanced aggregation reports.</p>
             </Card>
        );
      case 'admin':
        return <SuperAdmin />;
      case 'chat':
        return <TeamChat />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {renderPage()}
      </div>
      <DevTools />
    </Layout>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
