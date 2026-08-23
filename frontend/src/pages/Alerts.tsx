import React, { useState, useEffect } from 'react';
import { AlertOctagon, ShieldAlert, Eye, RefreshCw, CheckCircle2, Info } from 'lucide-react';
import { listScreeningsApi } from '../services/api';
import type { ScreeningSummary } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';

interface AlertsProps {
  onInspect: (screeningId: string) => void;
}

export const Alerts: React.FC<AlertsProps> = ({ onInspect }) => {
  const [alerts, setAlerts] = useState<ScreeningSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      // Fetch high risk screenings
      const data = await listScreeningsApi({ risk: 'HIGH', limit: 30 });
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  return (
    <div className="space-y-6">
      {/* Prototype Notice Banner */}
      <div className="bg-amber-950/40 border border-amber-800/60 p-3.5 rounded-xl shadow-sm text-xs text-amber-200/90 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300 mr-1">Simulated Watchlist Triage:</span>
          <span>
            The alert records displayed below are generated using mock watchlist entries (Interpol SLTD / Red Notice simulations) within this prototype demonstration environment.
          </span>
        </div>
      </div>

      {/* Top Alert Banner */}
      <div className="bg-slate-900 border border-rose-900/60 p-5 rounded-xl shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                <AlertOctagon className="w-3.5 h-3.5" />
                SIMULATED WATCHLIST TRIAGE
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight">
              Flagged Document & Identity Watchlist Triage Center
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              High-priority demonstration alerts demonstrating secondary inspection referral and manual review workflows
            </p>
          </div>

          <button
            onClick={loadAlerts}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Alert Feed</span>
          </button>
        </div>
      </div>

      {/* Alert Feed Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-16 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
            <p className="text-xs font-mono">Scanning simulated high-risk alert stream...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="col-span-2 py-16 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-200">No Unresolved High-Risk Alerts</h3>
            <p className="text-xs text-slate-500 mt-1">All flagged test cases in this session have been addressed or resolved.</p>
          </div>
        ) : (
          alerts.map((a) => (
            <div
              key={a.id}
              onClick={() => onInspect(a.id)}
              className="bg-slate-900 border border-rose-900/50 hover:border-rose-600/80 rounded-xl p-4 shadow-lg transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-rose-400 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    SIMULATED CASE #{a.id.slice(0, 8)}
                  </span>
                  <RiskBadge level={a.risk_level} score={a.risk_score} size="sm" />
                </div>

                <h3 className="text-base font-bold text-slate-100">
                  {a.traveler_name || 'DEMO SUBJECT'}
                </h3>
                <div className="text-xs font-mono text-slate-400 mt-0.5 flex items-center gap-2">
                  <span>DOC: {a.document_number}</span>
                  <span>•</span>
                  <span>NAT: {a.nationality}</span>
                  <span>•</span>
                  <span>{a.document_type} (MOCK)</span>
                </div>

                <div className="mt-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-900/60 text-xs font-mono text-rose-300">
                  ⚠️ Priority Anomaly: Risk Score {a.risk_score}/100 exceeds critical threshold. Manual verification recommended.
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <StatusBadge status={a.status} size="sm" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onInspect(a.id);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 transition-all text-xs cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect Dossier</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
