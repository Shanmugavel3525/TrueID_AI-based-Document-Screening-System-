import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { NewScreening } from './pages/NewScreening';
import { CaseInspector } from './pages/CaseInspector';
import { History } from './pages/History';
import { Alerts } from './pages/Alerts';
import { Settings } from './pages/Settings';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [activeScreeningId, setActiveScreeningId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">
            Initializing Prototype Demonstration Environment...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handleNavigate = (tab: string, screeningId?: string) => {
    if (screeningId) {
      setActiveScreeningId(screeningId);
      setCurrentTab('inspector');
    } else {
      setCurrentTab(tab);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar currentTab={currentTab} onSelectTab={(tab) => handleNavigate(tab)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === 'dashboard' && (
          <Dashboard onNavigate={handleNavigate} />
        )}

        {currentTab === 'new_screening' && (
          <NewScreening
            onScreeningComplete={(id) => {
              setActiveScreeningId(id);
              setCurrentTab('inspector');
            }}
          />
        )}

        {currentTab === 'inspector' && activeScreeningId && (
          <CaseInspector
            screeningId={activeScreeningId}
            onBack={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'history' && (
          <History
            onInspect={(id) => {
              setActiveScreeningId(id);
              setCurrentTab('inspector');
            }}
          />
        )}

        {currentTab === 'alerts' && (
          <Alerts
            onInspect={(id) => {
              setActiveScreeningId(id);
              setCurrentTab('inspector');
            }}
          />
        )}

        {currentTab === 'settings' && <Settings />}
      </main>

      {/* Persistent Prototype Footer Notice */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3.5 px-4 text-center text-xs text-slate-400 space-y-1">
        <div className="font-semibold text-slate-300">
           TrueID — Prototype Demonstration System
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          Prototype • Demo Environment | Problem Statement ID: 26188
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
