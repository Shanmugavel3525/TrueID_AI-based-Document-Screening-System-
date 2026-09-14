import React from 'react';
import { ScanLine, FileCheck, History, AlertTriangle, Settings, LogOut, Radio, Info, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DeveloperProfile } from './DeveloperProfile';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: ShieldCheck },
    { id: 'new_screening', label: 'New Screening', icon: FileCheck },
    { id: 'history', label: 'History', icon: History },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-lg select-none">
      {/* Top Prototype & Problem Statement Header Bar */}
      <div className="bg-slate-950 px-4 py-1.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-300 bg-amber-950/70 border border-amber-800/80 px-2.5 py-0.5 rounded text-[11px] whitespace-nowrap">
            <Info className="w-3 h-3 flex-shrink-0" />
            PROTOTYPE MODEL
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-indigo-300 font-mono bg-indigo-950/60 px-2.5 py-0.5 rounded border border-indigo-800/60 text-[11px] whitespace-nowrap">
            <Radio className="w-3 h-3 text-indigo-400 animate-pulse flex-shrink-0" />
            Demo Environment | Simulated Registry Data
          </span>
          <span className="text-slate-500 font-mono text-[11px] hidden xl:inline whitespace-nowrap">
            NODE: SIMULATED-LANE-01
          </span>
        </div>
      </div>

      {/* Main Command Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Product Title */}
          <div
            className="flex items-center gap-3 cursor-pointer flex-shrink-0"
            onClick={() => onSelectTab('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/40 flex items-center justify-center text-cyan-400 shadow-inner flex-shrink-0">
              <ScanLine className="w-6 h-6" />
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="font-extrabold text-white text-base sm:text-lg tracking-tight leading-none">
                  TrueID
                </span>
                <span className="hidden lg:inline-flex items-center text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono font-bold tracking-wider whitespace-nowrap">
                  PROTOTYPE
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium whitespace-nowrap mt-1 leading-none">
                AI Document & Identity Screening
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 flex-shrink-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions Area: Developer Profile, User Profile & Sign Out */}
          <div className="flex items-center gap-2 sm:gap-3 pl-3 sm:pl-4 border-l border-slate-800 flex-shrink-0">
            <DeveloperProfile />

            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-200 leading-tight whitespace-nowrap">
                {user?.role === 'ADMIN' ? 'VisionX' : (user?.full_name || 'Demo Evaluator')}
              </div>
              <div className="flex items-center justify-end gap-1.5 mt-0.5 whitespace-nowrap">
                <span className="text-[10px] font-mono text-slate-400">
                  {user?.badge_number || 'EVAL-01'}
                </span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border whitespace-nowrap ${
                  user?.role === 'ADMIN'
                    ? 'bg-purple-950 text-purple-300 border-purple-800'
                    : user?.role === 'SUPERVISOR'
                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                }`}>
                  {user?.role || 'OFFICER'} (DEMO)
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out to Demo Selector"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/50 transition-colors cursor-pointer flex-shrink-0"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-between pb-3 gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};