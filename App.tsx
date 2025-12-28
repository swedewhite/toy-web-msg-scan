
import React, { useState } from 'react';
import Layout from './components/Layout.tsx';
import AuditView from './components/AuditView.tsx';
import { AppState, BrandGuideline, AuditResult } from './types.ts';
import { DEFAULT_GUIDELINES } from './constants.tsx';
import { auditContent } from './services/geminiService.ts';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.CONFIGURATION);
  const [guidelines, setGuidelines] = useState<BrandGuideline>(DEFAULT_GUIDELINES);
  const [targetUrl, setTargetUrl] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAudit = async (contentSource: 'url' | 'manual') => {
    setIsLoading(true);
    setError(null);
    try {
      if (contentSource === 'url' && !targetUrl) {
        throw new Error("Please enter a URL to scan.");
      }
      
      const contentToPass = contentSource === 'manual' ? manualContent : '';
      const result = await auditContent(contentToPass, guidelines, contentSource === 'url' ? targetUrl : undefined);
      
      setAuditResult(result);
      setAppState(AppState.RESULTS);
    } catch (err: any) {
      setError(err.message || "Audit failed. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetAudit = () => {
    setAppState(AppState.CONFIGURATION);
    setAuditResult(null);
    setError(null);
  };

  return (
    <Layout>
      {appState === AppState.CONFIGURATION && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-green-600 transition-all duration-300 group-hover:w-2"></div>
              <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                Baseline Ground Truth
              </h2>
              <p className="text-sm text-gray-500 mb-4 italic">The absolute source of truth for narrative and terminology.</p>
              <textarea 
                rows={8}
                value={guidelines.baselineDocument}
                onChange={(e) => setGuidelines({...guidelines, baselineDocument: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:bg-white transition-colors"
              />
            </section>

            <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
               <h2 className="text-xl font-black text-gray-900 mb-4">Target for Audit</h2>
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Live URL Scan</label>
                  <div className="flex gap-3">
                    <input 
                      type="url"
                      placeholder="https://www.mongodb.com/products/atlas"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      className="flex-grow px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                    />
                    <button 
                      onClick={() => handleAudit('url')}
                      disabled={isLoading}
                      className="px-8 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition"
                    >
                      {isLoading ? 'Scanning...' : 'Scan URL'}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
          <div className="lg:col-span-4">
             {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-bold">{error}</div>}
          </div>
        </div>
      )}

      {appState === AppState.RESULTS && auditResult && (
        <AuditView result={auditResult} onReset={resetAudit} />
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <h2 className="mt-4 font-black text-gray-900">Analyzing Site Deltas...</h2>
        </div>
      )}
    </Layout>
  );
};

export default App;
