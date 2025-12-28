
import React, { useState, useEffect } from 'react';
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
  const [hasKey, setHasKey] = useState<boolean>(true);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleAudit = async (contentSource: 'url' | 'manual') => {
    setIsLoading(true);
    setError(null);

    // If using Search Grounding, we may need a paid API key selection
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      const selected = await window.aistudio.hasSelectedApiKey();
      if (!selected) {
        await window.aistudio.openSelectKey();
        // Proceeding assuming selection was successful as per instructions
      }
    }

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

  const openKeyPicker = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  return (
    <Layout>
      {appState === AppState.CONFIGURATION && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            {!hasKey && (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-900">API Key Required for Web Scanning</p>
                    <p className="text-xs text-amber-700">Please select a paid API key to enable live URL analysis via Google Search.</p>
                  </div>
                </div>
                <button 
                  onClick={openKeyPicker}
                  className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition"
                >
                  Select Key
                </button>
              </div>
            )}

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
                      className="px-8 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition shadow-lg shadow-green-100"
                    >
                      {isLoading ? 'Scanning...' : 'Scan URL'}
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                  <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest text-gray-400"><span className="bg-white px-2">OR AUDIT TEXT</span></div>
                </div>
                <div>
                   <textarea 
                    rows={4}
                    placeholder="Paste copy here..."
                    value={manualContent}
                    onChange={(e) => setManualContent(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:bg-white transition-colors"
                  />
                  <div className="mt-3 flex justify-end">
                    <button 
                      onClick={() => handleAudit('manual')}
                      disabled={isLoading}
                      className="px-6 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-black transition"
                    >
                      Audit Paste
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
          <div className="lg:col-span-4 space-y-4">
             {error && (
               <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm font-bold animate-in slide-in-from-top-2">
                 <div className="flex gap-2">
                   <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   {error}
                 </div>
               </div>
             )}
             <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
               <h3 className="text-xs font-black text-blue-800 uppercase tracking-widest mb-3">Audit Logic</h3>
               <p className="text-xs text-blue-700 leading-relaxed">This tool uses Gemini 3 Flash with Search Grounding to compare your Ground Truth document against live web content, identifying messaging deltas, tone drift, and prohibited terminology.</p>
               <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="mt-4 block text-[10px] font-bold text-blue-600 underline">Learn about API billing</a>
             </div>
          </div>
        </div>
      )}

      {appState === AppState.RESULTS && auditResult && (
        <AuditView result={auditResult} onReset={resetAudit} />
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <h2 className="mt-4 font-black text-gray-900">Analyzing Brand Alignment...</h2>
          <p className="text-xs text-gray-400 mt-2 uppercase tracking-widest font-bold">Visiting Live Site & Grounding Narrative</p>
        </div>
      )}
    </Layout>
  );
};

export default App;
