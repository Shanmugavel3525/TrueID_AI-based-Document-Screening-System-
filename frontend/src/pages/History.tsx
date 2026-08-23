import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Eye, Download, FileText, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { listScreeningsApi } from '../services/api';
import type { ScreeningSummary } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';

interface HistoryProps {
  onInspect: (screeningId: string) => void;
}

export const History: React.FC<HistoryProps> = ({ onInspect }) => {
  const [screenings, setScreenings] = useState<ScreeningSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filters
  const [search, setSearch] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [docTypeFilter, setDocTypeFilter] = useState<string>('ALL');
  
  // Pagination
  const [page, setPage] = useState<number>(1);
  const pageSize = 15;

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await listScreeningsApi({
        search: search || undefined,
        risk: riskFilter !== 'ALL' ? riskFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        doc_type: docTypeFilter !== 'ALL' ? docTypeFilter : undefined,
        skip: (page - 1) * pageSize,
        limit: pageSize
      });
      setScreenings(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [page, riskFilter, statusFilter, docTypeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadHistory();
  };

  const handleDownloadPDF = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/api/screenings/${id}/report`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Prototype Notice Banner */}
      <div className="bg-amber-950/40 border border-amber-800/60 p-3.5 rounded-xl shadow-sm text-xs text-amber-200/90 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300 mr-1">Demo Environment:</span>
          <span>
            The screening history below consists of simulated test runs and synthetic evaluation cases recorded within this demonstration instance.
          </span>
        </div>
      </div>

      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                PROTOTYPE REPOSITORY
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span>Screening History & Case Audit Repository</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Review past demonstration inspections, biometric comparisons, and officer decision-support determinations
            </p>
          </div>

          <button
            onClick={loadHistory}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Grid</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Subject, Doc No, Officer..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
          </form>

          {/* Risk Filter */}
          <div>
            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk</option>
              <option value="MANUAL_REVIEW">Manual Review Recommended</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="CLEARED">Cleared</option>
              <option value="REFER_SECONDARY">Refer Secondary</option>
              <option value="REJECTED">Entry Rejected</option>
              <option value="DETAINED">Detained</option>
              <option value="IN_PROGRESS">In Progress</option>
            </select>
          </div>

          {/* Document Type Filter */}
          <div>
            <select
              value={docTypeFilter}
              onChange={(e) => {
                setDocTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Document Types</option>
              <option value="PASSPORT">Passport (TD3)</option>
              <option value="VISA">Visa (TD2)</option>
              <option value="NATIONAL_ID">National ID (TD1)</option>
              <option value="DRIVING_LICENCE">Driving Licence</option>
              <option value="PERMIT">Border Permit</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Data Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Evaluation Time</th>
                <th className="py-3 px-3">Subject Name</th>
                <th className="py-3 px-3">Document Details</th>
                <th className="py-3 px-3">Risk Assessment</th>
                <th className="py-3 px-3">Officer Determination</th>
                <th className="py-3 px-3">Officer Badge</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-mono">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                    <span>Loading demonstration repository...</span>
                  </td>
                </tr>
              ) : screenings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-mono">
                    No matching demonstration records found.
                  </td>
                </tr>
              ) : (
                screenings.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-850/60 transition-colors cursor-pointer"
                    onClick={() => onInspect(s.id)}
                  >
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {new Date(s.started_at).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-100">
                        {s.traveler_name || 'DEMO SUBJECT'}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        NAT: {s.nationality || 'IND'}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-mono">
                      <div className="font-medium text-slate-200">
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

                    <td className="py-3.5 px-3 font-mono text-[11px]">
                      <div className="text-slate-300 font-medium">{s.officer_name || 'Evaluator'}</div>
                      <div className="text-slate-500 text-[10px]">{s.officer_badge}</div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspect(s.id);
                          }}
                          className="p-1.5 rounded bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                          title="Inspect Case"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDownloadPDF(s.id, e)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-indigo-300 border border-slate-700 transition-all cursor-pointer"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Showing Page {page}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1.5 rounded bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={screenings.length < pageSize}
              className="p-1.5 rounded bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
