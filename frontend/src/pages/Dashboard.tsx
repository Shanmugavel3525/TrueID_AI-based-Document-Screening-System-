import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, AlertOctagon, Clock,
  FilePlus, ArrowUpRight, RefreshCw,
  TrendingUp, Cpu, Info, ArrowRight,
  Scan, CheckSquare, Layers, Camera, Database, Shield
} from 'lucide-react';
import { getDashboardStatsApi, listScreeningsApi } from '../services/api';
import type { DashboardStats, ScreeningSummary } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';

interface DashboardProps {
  onNavigate: (tab: string, screeningId?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentScreenings, setRecentScreenings] = useState<ScreeningSummary[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const pipelineRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    try {
      const [statsData, screeningsData] = await Promise.all([
        getDashboardStatsApi(),
        listScreeningsApi({ limit: 8 })
      ]);
      setStats(statsData);
      setRecentScreenings(screeningsData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const scrollToPipeline = () => {
    pipelineRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const total = stats?.total_screenings || 1;
  const lowPct = Math.round(((stats?.low_risk_count || 0) / total) * 100);
  const medPct = Math.round(((stats?.medium_risk_count || 0) / total) * 100);
  const highPct = Math.round(((stats?.high_risk_count || 0) / total) * 100);

  return (
    <div className="space-y-6">
      {/* 1. Official Prototype Information Banner */}
      <div className="bg-amber-950/40 border border-amber-800/60 p-4 rounded-xl shadow-sm text-xs text-amber-200/90 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-amber-300 uppercase tracking-wider text-[11px] flex items-center gap-2">
            <span>Prototype Model System</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-300 border border-amber-700/60">
              DEMONSTRATION & EVALUATION
            </span>
          </div>
          <p className="leading-relaxed text-slate-300">
            This platform is a <strong>prototype proof-of-concept</strong> developed to demonstrate AI-assisted identity and document screening functions. Results are intended for <strong>evaluation and decision-support demonstration only</strong>
          </p>
        </div>
      </div>

      {/* 2. Main Page Hero / Introduction */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 rounded-xl shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-3xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800">
                PROTOTYPE SYSTEM • FOR DEMONSTRATION
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-mono">
                SIMULATED ENVIRONMENT
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              AI-Based Fake Identity & Document Screening System
            </h1>
            <p className="text-sm text-slate-300 font-normal leading-relaxed">
              Prototype model for AI-assisted document verification, tampering detection, face verification, and risk-based screening.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('new_screening')}
              className="flex items-center gap-2 px-5 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <FilePlus className="w-4 h-4" />
              <span>Start Screening</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>

            <button
              onClick={scrollToPipeline}
              className="flex items-center gap-2 px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Explore Prototype</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Today's Prototype Statistics (KPI Cards) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Today's Prototype Statistics
            </h2>
            <span className="text-[10px] font-mono text-slate-500">(Simulated Evaluation Metrics)</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-400 text-xs font-mono transition-all"
          >
            <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Screenings */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Demo Screenings
              </span>
              <div className="p-2 rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-900">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-100 font-mono">
                {stats?.today_screenings ?? '—'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ({stats?.total_screenings ?? 0} total)
              </span>
            </div>
            <div className="mt-2 flex items-center text-[11px] text-indigo-400 font-medium">
              <span>Prototype Pipeline Active</span>
            </div>
          </div>

          {/* Low Risk / Clean */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Low Risk (Clean)
              </span>
              <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-900">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                {stats?.low_risk_count ?? '—'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ({lowPct}%)
              </span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              Automated pass candidate
            </div>
          </div>

          {/* Medium Risk */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Medium Risk (Review)
              </span>
              <div className="p-2 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-900">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-amber-400 font-mono">
                {stats?.medium_risk_count ?? '—'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ({medPct}%)
              </span>
            </div>
            <div className="mt-2 text-[11px] text-amber-400">
              Manual review recommended
            </div>
          </div>

          {/* High Risk / Flagged */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                High Risk (Flagged)
              </span>
              <div className="p-2 rounded-lg bg-rose-950/60 text-rose-400 border border-rose-900">
                <AlertOctagon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-rose-400 font-mono">
                {stats?.high_risk_count ?? '—'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                ({highPct}%)
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-rose-400 font-semibold">
              <span>Watchlist & Forgery Flags</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. AI-Assisted Screening Pipeline Visualization */}
      <div ref={pipelineRef} className="bg-slate-900 border border-indigo-950 p-5 rounded-xl shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>AI-Assisted Screening Pipeline Architecture</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              6-stage multi-factor verification workflow executed on each ingested identity credential
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            PIPELINE v1.0-DEMO
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { step: '1', title: 'OCR Extraction', desc: 'Dual-engine text & MRZ reading', icon: Scan },
            { step: '2', title: 'ICAO 9303 Check', desc: '7-3-1 check digit validation', icon: CheckSquare },
            { step: '3', title: 'Tampering ELA', desc: 'Compression & edge forensics', icon: Layers },
            { step: '4', title: 'Face Biometrics', desc: '512D Cosine similarity match', icon: Camera },
            { step: '5', title: 'Simulated Registry', desc: 'Mock SLTD & Red Notice check', icon: Database },
            { step: '6', title: 'Risk Assessment', desc: 'Explainable factor scoring', icon: Shield },
          ].map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center justify-center font-mono text-[10px] font-bold">
                    {s.step}
                  </span>
                  <Icon className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">{s.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{s.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Main Operations Grid (Recent Screenings + Risk Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Screening Queue (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
                <span>Recent Screening Activity</span>
                <span className="text-[10px] font-mono text-amber-400 font-semibold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-900">
                  SIMULATED TEST CASES
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Demo records evaluated through the prototype pipeline
              </p>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <span>View All History</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Subject / Traveler</th>
                  <th className="py-3 px-3">Document</th>
                  <th className="py-3 px-3">Risk Assessment</th>
                  <th className="py-3 px-3">Determination</th>
                  <th className="py-3 px-3">Officer</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {recentScreenings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                      No demo screenings executed yet. Click '+ Start Screening' to run a test case.
                    </td>
                  </tr>
                ) : (
                  recentScreenings.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-slate-850/50 transition-colors cursor-pointer"
                      onClick={() => onNavigate('inspector', s.id)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-100">
                          {s.traveler_name || 'Synthetic Demo Subject'}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          NAT: {s.nationality || 'IND'}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-mono font-medium text-slate-200">
                          {s.document_number || 'N/A'}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase">
                          {s.document_type} (SIMULATED)
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <RiskBadge level={s.risk_level} score={s.risk_score} size="sm" />
                      </td>

                      <td className="py-3.5 px-3">
                        <StatusBadge status={s.status} size="sm" />
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="text-slate-300 font-medium">
                          {s.officer_name || 'Evaluator'}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {s.officer_badge}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('inspector', s.id);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700 hover:border-indigo-500 transition-all text-xs font-medium"
                        >
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Risk Analytics & Priority Alerts */}
        <div className="space-y-6">
          {/* Risk Distribution Breakdown */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide mb-3 flex items-center justify-between">
              <span>Risk Distribution Ratio</span>
              <span className="text-xs text-slate-500 font-mono">{stats?.total_screenings || 0} Demo Cases</span>
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1 font-mono">
                  <span className="text-emerald-400 font-semibold">Low Risk (Clean)</span>
                  <span className="text-slate-400">{lowPct}% ({stats?.low_risk_count || 0})</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${lowPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-mono">
                  <span className="text-amber-400 font-semibold">Medium Risk (Warning)</span>
                  <span className="text-slate-400">{medPct}% ({stats?.medium_risk_count || 0})</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${medPct}%` }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1 font-mono">
                  <span className="text-rose-400 font-semibold">High Risk (Flagged)</span>
                  <span className="text-slate-400">{highPct}% ({stats?.high_risk_count || 0})</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${highPct}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* High Priority Alerts Widget */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                <span>Simulated Watchlist Hits</span>
              </span>
              <button
                onClick={() => onNavigate('alerts')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                All Alerts
              </button>
            </h3>

            <div className="space-y-2.5">
              {(stats?.recent_alerts || []).length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500 bg-slate-950/40 rounded-lg">
                  No critical simulated watchlist hits active.
                </div>
              ) : (
                stats?.recent_alerts.map((a, idx) => (
                  <div
                    key={idx}
                    onClick={() => onNavigate('inspector', a.screening_id)}
                    className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/60 hover:border-rose-700 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-rose-300">
                        {a.traveler_name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        DOC: {a.document_number} (MOCK)
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-xs font-bold text-rose-400">
                        SCORE: {a.risk_score}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Prototype Notice Box */}
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl shadow-sm text-xs font-mono text-slate-400 space-y-2">
            <div className="font-bold text-slate-300 uppercase tracking-wide flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              <span>Prototype Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400 font-sans">
              This is a demonstration system built completely for internal hackathon..
            </p>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
              <span>Environment: Demo Proof-of-Concept</span>
              <span>v1.0-DEMO</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
