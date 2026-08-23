import React, { useState, useEffect } from 'react';
import {
  Sliders, Database, Plus, Trash2, RefreshCw,
  Save, CheckCircle2, Lock, FileText, Info
} from 'lucide-react';
import {
  getRiskWeightsApi, updateRiskWeightsApi,
  listRegistriesApi, createRegistryRecordApi, deleteRegistryRecordApi,
  listAuditLogsApi
} from '../services/api';
import type { RiskWeights, RegistryRecord, AuditLog } from '../types';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'WEIGHTS' | 'REGISTRIES' | 'AUDIT'>('WEIGHTS');

  // Weights State
  const [weights, setWeights] = useState<RiskWeights | null>(null);
  const [savingWeights, setSavingWeights] = useState(false);
  const [weightsMessage, setWeightsMessage] = useState<string | null>(null);

  // Registries State
  const [registries, setRegistries] = useState<RegistryRecord[]>([]);
  const [loadingRegistries, setLoadingRegistries] = useState(false);
  const [newRegModal, setNewRegModal] = useState(false);
  const [newRegType, setNewRegType] = useState('STOLEN_PASSPORT');
  const [newDocNo, setNewDocNo] = useState('');
  const [newName, setNewName] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newSeverity, setNewSeverity] = useState('HIGH');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const loadWeights = async () => {
    try {
      const data = await getRiskWeightsApi();
      setWeights(data);
    } catch (err) {
      console.error('Failed to load risk weights:', err);
    }
  };

  const loadRegistries = async () => {
    setLoadingRegistries(true);
    try {
      const data = await listRegistriesApi();
      setRegistries(data);
    } catch (err) {
      console.error('Failed to load registries:', err);
    } finally {
      setLoadingRegistries(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const data = await listAuditLogsApi();
      setAuditLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    loadWeights();
    loadRegistries();
    loadAuditLogs();
  }, []);

  const handleSaveWeights = async () => {
    if (!weights) return;
    setSavingWeights(true);
    setWeightsMessage(null);
    try {
      const updated = await updateRiskWeightsApi(weights);
      setWeights(updated);
      setWeightsMessage('Risk engine calculation weights updated successfully.');
      setTimeout(() => setWeightsMessage(null), 4000);
    } catch (err: any) {
      setWeightsMessage(err.message || 'Failed to update weights');
    } finally {
      setSavingWeights(false);
    }
  };

  const handleCreateRegistry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReason.trim()) return;
    try {
      await createRegistryRecordApi({
        registry_type: newRegType,
        document_number: newDocNo.trim() || undefined,
        full_name: newName.trim() || undefined,
        reason: newReason.trim(),
        severity: newSeverity
      });
      setNewRegModal(false);
      setNewDocNo('');
      setNewName('');
      setNewReason('');
      loadRegistries();
    } catch (err: any) {
      alert(err.message || 'Failed to add registry record');
    }
  };

  const handleDeleteRegistry = async (id: string) => {
    if (confirm('Are you sure you want to remove this simulated registry entry?')) {
      try {
        await deleteRegistryRecordApi(id);
        loadRegistries();
      } catch (err: any) {
        alert(err.message || 'Failed to delete record');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Prototype Notice Banner */}
      <div className="bg-amber-950/40 border border-amber-800/60 p-3.5 rounded-xl shadow-sm text-xs text-amber-200/90 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300 mr-1">Prototype Configurator:</span>
          <span>
            This panel configures demonstration risk weightings, manages mock/simulated database records, and audits test operations. No real-world government registries are connected.
          </span>
        </div>
      </div>

      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-md">
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">
          System Administration & Simulated Registry Configurator
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Tune explainable risk weights, manage simulated security databases, and inspect immutable audit trails
        </p>

        {/* Tab Switcher */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex gap-2 flex-wrap">
          {[
            { id: 'WEIGHTS', label: 'Risk Factor Weights', icon: Sliders },
            { id: 'REGISTRIES', label: 'SIMULATED REGISTRIES (Mock SLTD/Watchlist)', icon: Database },
            { id: 'AUDIT', label: 'Immutable Audit Log', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: Risk Factor Weights */}
      {activeTab === 'WEIGHTS' && weights && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                Multi-Factor Risk Score Weight Matrix
              </h2>
              <p className="text-xs text-slate-400">
                Adjust penalty points assigned to detected anomalies. Risk score is normalized to 0 - 100.
              </p>
            </div>

            <button
              onClick={handleSaveWeights}
              disabled={savingWeights}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{savingWeights ? 'Saving Weights...' : 'Save Configuration'}</span>
            </button>
          </div>

          {weightsMessage && (
            <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{weightsMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { key: 'watchlist_hit_weight', label: 'Wanted Person / Red Notice Watchlist Hit (Simulated)', min: 50, max: 100, step: 5 },
              { key: 'stolen_doc_weight', label: 'Interpol Stolen Travel Document (SLTD) Hit (Simulated)', min: 50, max: 100, step: 5 },
              { key: 'mrz_mismatch_weight', label: 'ICAO Doc 9303 MRZ Checksum Failure', min: 20, max: 80, step: 5 },
              { key: 'face_mismatch_weight', label: 'Biometric Face Verification Mismatch', min: 20, max: 80, step: 5 },
              { key: 'photo_splicing_weight', label: 'Photo Perimeter Discontinuity / Splicing', min: 20, max: 80, step: 5 },
              { key: 'ela_anomaly_weight', label: 'Error Level Analysis (ELA) Discrepancy', min: 10, max: 60, step: 5 },
              { key: 'expired_doc_weight', label: 'Expired Travel Document Penalty', min: 10, max: 60, step: 5 },
              { key: 'future_date_weight', label: 'Impossible Future Issue Date Penalty', min: 20, max: 70, step: 5 },
              { key: 'viz_mrz_mismatch_weight', label: 'Visual Printed Text vs MRZ Mismatch', min: 10, max: 50, step: 5 },
              { key: 'inconclusive_quality_weight', label: 'Degraded / Inconclusive Quality Flag', min: 5, max: 30, step: 5 },
            ].map((item) => (
              <div key={item.key} className="p-4 rounded-lg bg-slate-950 border border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-slate-200">
                    {item.label}
                  </label>
                  <span className="text-xs font-mono font-bold text-indigo-400">
                    +{(weights as any)[item.key]} pts
                  </span>
                </div>
                <input
                  type="range"
                  min={item.min}
                  max={item.max}
                  step={item.step}
                  value={(weights as any)[item.key]}
                  onChange={(e) =>
                    setWeights({ ...weights, [item.key]: parseFloat(e.target.value) })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Simulated Security Registries */}
      {activeTab === 'REGISTRIES' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
                <span>SIMULATED REGISTRY CHECK MANAGEMENT</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  MOCK DATA ONLY
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Manage synthetic records for Stolen Passports (SLTD), Interpol Red Notices, and Revoked Permits
              </p>
            </div>

            <button
              onClick={() => setNewRegModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Mock Record</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Registry Type</th>
                  <th className="py-3 px-3">Document Number</th>
                  <th className="py-3 px-3">Subject Name</th>
                  <th className="py-3 px-3">Reason / Description</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {loadingRegistries ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-mono">
                      Loading mock registry entries...
                    </td>
                  </tr>
                ) : registries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-mono">
                      No simulated registry records registered.
                    </td>
                  </tr>
                ) : (
                  registries.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-850/50">
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-300">
                        {r.registry_type} (SIMULATED)
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-100">
                        {r.document_number || '—'}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-200">
                        {r.full_name || '—'}
                      </td>
                      <td className="py-3 px-3 text-slate-400 max-w-xs truncate">
                        {r.reason}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            r.severity === 'CRITICAL'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {r.severity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteRegistry(r.id)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Add Registry Modal */}
          {newRegModal && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl">
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide mb-4">
                  Add Mock Registry Entry
                </h3>
                <form onSubmit={handleCreateRegistry} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Registry Database</label>
                    <select
                      value={newRegType}
                      onChange={(e) => setNewRegType(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono cursor-pointer"
                    >
                      <option value="STOLEN_PASSPORT">Interpol Stolen Travel Documents (SLTD Mock)</option>
                      <option value="WANTED_PERSON">Interpol Red Notice / Alert (Mock)</option>
                      <option value="REVOKED_DOCUMENT">Revoked Document Registry (Mock)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Document Number (Optional)</label>
                    <input
                      type="text"
                      value={newDocNo}
                      onChange={(e) => setNewDocNo(e.target.value)}
                      placeholder="e.g. Z8819203"
                      className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Subject Name (Optional)</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. VIKTOR KOROL"
                      className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Reason / Offense Description</label>
                    <textarea
                      value={newReason}
                      onChange={(e) => setNewReason(e.target.value)}
                      required
                      placeholder="e.g. Stolen passport reported in simulated transit..."
                      rows={3}
                      className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Severity Tier</label>
                    <select
                      value={newSeverity}
                      onChange={(e) => setNewSeverity(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono cursor-pointer"
                    >
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="MEDIUM">MEDIUM</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setNewRegModal(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow cursor-pointer"
                    >
                      Save Record
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Immutable Audit Log */}
      {activeTab === 'AUDIT' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wide flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>Immutable Security Audit Trail</span>
              </h2>
              <p className="text-xs text-slate-400">
                Append-only chronological log of all demonstration logins, uploads, screenings, and determinations
              </p>
            </div>

            <button
              onClick={loadAuditLogs}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin' : ''}`} />
              <span>Refresh Logs</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-3">Officer / User</th>
                  <th className="py-3 px-3">Action Type</th>
                  <th className="py-3 px-3">Resource</th>
                  <th className="py-3 px-3">IP Address</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200 font-mono text-[11px]">
                {loadingAudit ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-sans">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-sans">
                      No audit events recorded.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-850/50">
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-indigo-300 font-semibold">
                        {log.username || 'System'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                          {log.action_type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400">
                        {log.resource_type} {log.resource_id ? `#${log.resource_id.slice(0, 8)}` : ''}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {log.ip_address}
                      </td>
                      <td className="py-3 px-4 text-slate-400 truncate max-w-xs">
                        {JSON.stringify(log.details_json || {})}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
