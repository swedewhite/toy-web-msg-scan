
import React, { useState } from 'react';
import Layout from './components/Layout';
import AuditView from './components/AuditView';
import { AppState, BrandGuideline, AuditResult } from './types';
import { DEFAULT_GUIDELINES, MOCK_SITES } from './constants';
import { auditContent } from './services/geminiService';

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
      
      if (contentSource === 'manual' && !manualContent.trim()) {
        throw new Error("Please paste text to audit.");
      }
      
      if (!guidelines.baselineDocument.trim()) {
        throw new Error("Baseline Messaging Document is required as Ground Truth.");
      }

      // Pass empty string for content if URL scanning, the service will use search grounding
      const contentToPass = contentSource === 'manual' ? manualContent : '';
      const result = await auditContent(contentToPass, guidelines, contentSource === 'url' ? targetUrl : undefined);
      
      setAuditResult(result);
      setAppState(AppState.RESULTS);
    } catch (err: any) {
      setError(err.message || "Audit failed. Check your API key and network.");
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
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Baseline Ground Truth
              </h2>
              <p className="text-sm text-gray-500 mb-4 italic">The "Source of Truth". Target content will be flagged if it deviates from this narrative.</p>
              <textarea 
                rows={8}
                value={guidelines.baselineDocument}
                onChange={(e) => setGuidelines({...guidelines, baselineDocument: e.target.value})}
                placeholder="Paste the approved brand narrative..."
                className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl shadow-inner focus:ring-2 focus:ring-green-500 focus:bg-white transition-all sm:text-sm font-medium leading-relaxed"
              />
            </section>

            <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
               <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                Target for Audit
              </h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Live URL (Real-time Scan)</label>
                  <div className="flex gap-3">
                    <input 
                      type="url"
                      placeholder="https://www.mongodb.com/products/atlas"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      className="flex-grow px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all sm:text-sm"
                    />
                    <button 
                      onClick={() => handleAudit('url')}
                      disabled={isLoading}
                      className="px-8 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 active:scale-95 disabled:bg-gray-400 disabled:active:scale-100 transition shadow-lg shadow-green-200"
                    >
                      {isLoading ? 'Reading Site...' : 'Scan Live URL'}
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-100"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                    <span className="px-3 bg-white text-gray-300">OR MANUALLY AUDIT COPY</span>
                  </div>
                </div>

                <div>
                  <textarea 
                    rows={6}
                    placeholder="Paste web copy here..."
                    value={manualContent}
                    onChange={(e) => setManualContent(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl shadow-inner focus:ring-2 focus:ring-green-500 focus:bg-white transition-all sm:text-sm font-medium"
                  />
                  <div className="mt-4 flex justify-end">
                    <button 
                      onClick={() => handleAudit('manual')}
                      disabled={isLoading}
                      className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black active:scale-95 disabled:bg-gray-400 disabled:active:scale-100 transition shadow-xl shadow-gray-200"
                    >
                      {isLoading ? 'Analyzing...' : 'Audit Manual Copy'}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.15em] mb-4">Hard Constraints</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Prohibited Terms</label>
                  <textarea 
                    rows={3}
                    value={guidelines.prohibitedTerms.join(', ')}
                    onChange={(e) => setGuidelines({...guidelines, prohibitedTerms: e.target.value.split(',').map(s => s.trim())})}
                    className="w-full px-3 py-1.5 bg-gray-50 text-gray-900 border border-gray-200 rounded-lg text-xs focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Voice & Tone</label>
                  <input 
                    type="text"
                    value={guidelines.voice}
                    onChange={(e) => setGuidelines({...guidelines, voice: e.target.value})}
                    className="w-full px-3 py-1.5 bg-gray-50 text-gray-900 border border-gray-200 rounded-lg text-xs mb-2"
                  />
                  <input 
                    type="text"
                    value={guidelines.tone}
                    onChange={(e) => setGuidelines({...guidelines, tone: e.target.value})}
                    className="w-full px-3 py-1.5 bg-gray-50 text-gray-900 border border-gray-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            </section>

            {error && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-200 text-red-700 text-xs font-bold animate-pulse flex gap-2">
                {error}
              </div>
            )}
          </div>
        </div>
      )}

      {appState === AppState.RESULTS && auditResult && (
        <AuditView result={auditResult} onReset={resetAudit} />
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <h2 className="text-xl font-black text-gray-900 mt-6">Accessing Live Site...</h2>
          <p className="text-gray-500 mt-2 max-w-xs">Gemini is visiting the URL and retrieving live content for a semantic delta audit.</p>
        </div>
      )}
    </Layout>
  );
};

export default App;
