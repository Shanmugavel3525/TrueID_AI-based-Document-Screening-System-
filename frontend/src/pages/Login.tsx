import React, { useState } from 'react';
import { ScanLine, Lock, User, Key, AlertCircle, ArrowRight, ShieldCheck, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';

import { DeveloperProfile } from '../components/layout/DeveloperProfile';

export const Login: React.FC = () => {
  const { login, quickDemoLogin, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setError(null);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials or inactive account');
    }
  };

  const handleDemoLogin = async (role: UserRole) => {
    setError(null);
    try {
      await quickDemoLogin(role);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Subtle Grid Texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />

      {/* Top Bar with Developer Button */}
      <div className="absolute top-4 right-4 z-20">
        <DeveloperProfile />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Prototype Header Banner */}
        <div className="mb-4 text-center">
          <span className="inline-flex items-center gap-1.5 font-mono font-bold text-amber-300 bg-amber-950/80 border border-amber-800 px-3 py-1 rounded-full text-xs shadow-md">
            <Info className="w-3.5 h-3.5" />
            PROTOTYPE MODEL • FOR DEMONSTRATION ONLY
          </span>
        </div>

        {/* Emblem & Title */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 shadow-xl shadow-indigo-950/50 mb-3">
            <ScanLine className="w-9 h-9" />
          </div>
          <div className="text-xs font-semibold text-indigo-400 uppercase tracking-widest font-mono">
            Problem Statement ID: 26188 Concept
          </div>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-100 tracking-tight">
            DocVerify AI
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            AI-Based Fake Identity & Document Screening System — Prototype Model
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-slate-900 border border-slate-800 py-7 px-4 shadow-2xl rounded-xl sm:px-9">
            {error && (
              <div className="mb-5 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Evaluator Username
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. officer, supervisor, or admin"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Passcode
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Authenticating Demo Session...
                    </span>
                  ) : (
                    <>
                      <span>Enter Prototype Terminal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Demo Evaluation Section */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="text-center mb-3">
                <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">
                  One-Click Demo Evaluation Profiles
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('OFFICER')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-slate-800/90 hover:bg-emerald-950/60 border border-slate-700 hover:border-emerald-700 text-slate-300 hover:text-emerald-300 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 mb-1 text-emerald-400" />
                  <span className="text-xs font-bold">Officer</span>
                  <span className="text-[10px] text-slate-500 font-mono">officer123</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('SUPERVISOR')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-slate-800/90 hover:bg-amber-950/60 border border-slate-700 hover:border-amber-700 text-slate-300 hover:text-amber-300 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 mb-1 text-amber-400" />
                  <span className="text-xs font-bold">Supervisor</span>
                  <span className="text-[10px] text-slate-500 font-mono">super123</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('ADMIN')}
                  className="flex flex-col items-center justify-center p-2.5 rounded-lg bg-slate-800/90 hover:bg-purple-950/60 border border-slate-700 hover:border-purple-700 text-slate-300 hover:text-purple-300 transition-all cursor-pointer"
                >
                  <Key className="w-4 h-4 mb-1 text-purple-400" />
                  <span className="text-xs font-bold">Admin</span>
                  <span className="text-[10px] text-slate-500 font-mono">admin123</span>
                </button>
              </div>
            </div>

            {/* Legal / Prototype Disclaimer */}
            <div className="mt-5 text-center p-2.5 rounded bg-slate-950/60 border border-slate-800">
              <p className="text-[10px] text-slate-400 leading-tight">
                <strong>PROTOTYPE DEMONSTRATION SYSTEM:</strong> Not an official government verification portal. Results are generated for research, demonstration, and evaluation purposes only.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
