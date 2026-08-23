import React, { useState, useRef } from 'react';
import {
  Upload, Camera, FileText, CheckCircle2, AlertCircle,
  ArrowRight, Zap, Sparkles, RefreshCw, X, Info
} from 'lucide-react';
import { uploadDocumentApi, createScreeningApi } from '../services/api';

interface NewScreeningProps {
  onScreeningComplete: (screeningId: string) => void;
}

const PRESET_DEMO_CASES = [
  { id: 'case_1', label: '1. Clean Valid Passport (Indian Passport - Rajesh Sharma) [SIMULATED]', doc_type: 'PASSPORT', file_sample: 'sample_case_1.jpg' },
  { id: 'case_2', label: '2. Expired Passport (British Passport - John Davis) [SIMULATED]', doc_type: 'PASSPORT', file_sample: 'sample_case_2.jpg' },
  { id: 'case_3', label: '3. Tampered MRZ Checksum (German Passport - Markus Weber) [SIMULATED]', doc_type: 'PASSPORT', file_sample: 'sample_case_3.jpg' },
  { id: 'case_4', label: '4. Spliced Photo / ELA Discrepancy (US Passport - David Miller) [SIMULATED]', doc_type: 'PASSPORT', file_sample: 'sample_case_4.jpg' },
  { id: 'case_5', label: '5. Face Biometric Mismatch (Impersonator - Emily Clarke) [SIMULATED]', doc_type: 'PASSPORT', file_sample: 'sample_case_5.jpg' },
  { id: 'case_6', label: '6. Interpol Red Notice Watchlist Hit (Viktor Korol) [SIMULATED]', doc_type: 'PASSPORT', file_sample: 'sample_case_6.jpg' },
  { id: 'case_7', label: '7. Stolen Travel Document SLTD Hit (#Z8819203) [SIMULATED]', doc_type: 'PASSPORT', file_sample: 'sample_case_7.jpg' },
  { id: 'case_8', label: '8. Compounding Signals (Expired + Spliced + MRZ) [SIMULATED]', doc_type: 'PASSPORT', file_sample: 'sample_case_8.jpg' },
  { id: 'case_9', label: '9. Low Quality / Blurry Scanned ID (Suresh Kumar) [SIMULATED]', doc_type: 'NATIONAL_ID', file_sample: 'sample_case_9.jpg' },
  { id: 'case_10', label: '10. Revoked Border Entry Permit (Alexei Petrov) [SIMULATED]', doc_type: 'PERMIT', file_sample: 'sample_case_10.jpg' },
];

export const NewScreening: React.FC<NewScreeningProps> = ({ onScreeningComplete }) => {
  const [docType, setDocType] = useState<string>('PASSPORT');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  
  const [livePhotoFile, setLivePhotoFile] = useState<File | null>(null);
  const [livePreview, setLivePreview] = useState<string | null>(null);
  
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const liveInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setDocPreview(URL.createObjectURL(file));
      setSelectedPreset('');
      setError(null);
    }
  };

  const handleLivePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLivePhotoFile(file);
      setLivePreview(URL.createObjectURL(file));
    }
  };

  const handlePresetSelect = async (presetId: string) => {
    setSelectedPreset(presetId);
    setError(null);
    const preset = PRESET_DEMO_CASES.find(c => c.id === presetId);
    if (!preset) return;

    setDocType(preset.doc_type);
    
    // Fetch synthetic sample file from backend static storage
    try {
      const sampleUrl = `/storage/samples/${preset.file_sample}`;
      const res = await fetch(sampleUrl);
      if (res.ok) {
        const blob = await res.blob();
        const file = new File([blob], preset.file_sample, { type: 'image/jpeg' });
        setSelectedFile(file);
        setDocPreview(sampleUrl);
      }
    } catch (err) {
      console.warn('Could not pre-load sample image:', err);
    }
  };

  const handleRunScreening = async () => {
    if (!selectedFile) {
      setError('Please upload a document image or select a synthetic test case to proceed.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      setAnalysisStep('1/6: Uploading & Computing SHA-256 Checksum...');
      const uploadedDoc = await uploadDocumentApi(selectedFile, docType);

      setAnalysisStep('2/6: Extracting OCR Fields & Parsing ICAO 9303 MRZ...');
      await new Promise(r => setTimeout(r, 600));

      setAnalysisStep('3/6: Performing Error Level Analysis (ELA) & Forensics...');
      await new Promise(r => setTimeout(r, 600));

      setAnalysisStep('4/6: Computing Biometric Facial Embeddings...');
      await new Promise(r => setTimeout(r, 500));

      setAnalysisStep('5/6: Cross-referencing Stolen SLTD & Red Notice Registries (Simulated)...');
      await new Promise(r => setTimeout(r, 500));

      setAnalysisStep('6/6: Evaluating Multi-Factor Explainable Risk Score...');
      const screeningResult = await createScreeningApi(
        uploadedDoc.id,
        livePhotoFile,
        selectedPreset ? JSON.stringify({ preset_id: selectedPreset }) : undefined
      );

      onScreeningComplete(screeningResult.id);
    } catch (err: any) {
      setError(err.message || 'Screening pipeline execution failed');
      setIsAnalyzing(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setDocPreview(null);
    setLivePhotoFile(null);
    setLivePreview(null);
    setSelectedPreset('');
    setError(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Prototype Model Notice Banner */}
      <div className="bg-amber-950/40 border border-amber-800/60 p-3.5 rounded-xl shadow-sm text-xs text-amber-200/90 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300 mr-1">Prototype Demo Ingestion:</span>
          <span>
            This intake module operates in a demonstration environment using configured AI models and simulated registries. Upload sample identity documents or choose from preloaded synthetic cases below.
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Initiate Document & Biometric Screening</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Ingest passport, visa, or identity credential for automated OCR, MRZ validation, forensics, and risk analysis
            </p>
          </div>
          {selectedFile && (
            <button
              onClick={clearSelection}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* Document Type Selector Tabs */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap gap-2">
          {[
            { id: 'PASSPORT', label: 'Passport (TD3)' },
            { id: 'VISA', label: 'Visa (TD2)' },
            { id: 'NATIONAL_ID', label: 'National ID / Aadhaar (TD1)' },
            { id: 'DRIVING_LICENCE', label: 'Driving Licence' },
            { id: 'PERMIT', label: 'Border Entry Permit' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setDocType(t.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                docType === t.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Demo Case Selector */}
      <div className="bg-slate-900/90 border border-indigo-900/50 p-4 rounded-xl shadow-md">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>Select Preloaded Synthetic Case (Simulated Evaluation):</span>
          </label>
          <span className="text-[11px] font-mono text-slate-400">
            10 Standard Scenarios Preloaded
          </span>
        </div>
        <select
          value={selectedPreset}
          onChange={(e) => handlePresetSelect(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        >
          <option value="">-- Choose a Synthetic Evaluation Case or Upload Your Own File Below --</option>
          {PRESET_DEMO_CASES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Dual Ingestion Grid: Document Upload + Live Biometric Photo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Document Ingestion Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>1. Document Image Ingestion</span>
              </h2>
              <span className="text-[10px] text-slate-500 font-mono">JPG, PNG, PDF (Max 15MB)</span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
            />

            {docPreview ? (
              <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950/80 group">
                <img
                  src={docPreview}
                  alt="Document Preview"
                  className="w-full h-52 object-contain p-2"
                />
                <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 shadow cursor-pointer"
                  >
                    Change Image
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-lg p-8 text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-850/40 flex flex-col items-center justify-center h-52"
              >
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-200">
                  Click to browse or drag document here
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Passport booklet page, ID card front, or Visa slip
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 text-[11px] text-slate-400 font-mono">
            {selectedFile ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Loaded: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            ) : (
              <span>Status: Awaiting document source</span>
            )}
          </div>
        </div>

        {/* Live Passenger Photo Ingestion Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-indigo-400" />
                <span>2. Passenger Live Biometrics (Optional)</span>
              </h2>
              <span className="text-[10px] text-slate-500 font-mono">Simulated Live Camera</span>
            </div>

            <input
              type="file"
              ref={liveInputRef}
              onChange={handleLivePhotoSelect}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />

            {livePreview ? (
              <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950/80 group">
                <img
                  src={livePreview}
                  alt="Live Capture Preview"
                  className="w-full h-52 object-contain p-2"
                />
                <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => liveInputRef.current?.click()}
                    className="px-3 py-1.5 rounded bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 shadow cursor-pointer"
                  >
                    Replace Photo
                  </button>
                  <button
                    onClick={() => {
                      setLivePhotoFile(null);
                      setLivePreview(null);
                    }}
                    className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => liveInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-lg p-8 text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-850/40 flex flex-col items-center justify-center h-52"
              >
                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                  <Camera className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-200">
                  Upload or Capture Passenger Live Portrait
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enables 1:1 facial biometric cosine distance comparison
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 text-[11px] text-slate-400 font-mono">
            {livePhotoFile ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Live Portrait Ready
              </span>
            ) : (
              <span>Mode: Will extract document photo only if omitted</span>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline 6-Stage Execution Overview & Trigger */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
              Prototype Verification Pipeline
            </div>
            <div className="text-sm font-semibold text-slate-100 mt-0.5">
              OCR • ICAO 9303 Checksums • Error Level Analysis • 512D Biometrics • Simulated Registry Check
            </div>
          </div>

          <button
            onClick={handleRunScreening}
            disabled={isAnalyzing || !selectedFile}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>{analysisStep || 'Analyzing Document...'}</span>
              </>
            ) : (
              <>
                <span>Execute Prototype Screening</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
