
import React, { useState, useMemo } from 'react';
import { AuditResult, AuditIssue } from '../types.ts';

interface AuditViewProps {
  result: AuditResult;
  onReset: () => void;
}

const AuditView: React.FC<AuditViewProps> = ({ result, onReset }) => {
  const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual');
  const [selectedIssueIndex, setSelectedIssueIndex] = useState<number | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const highlightedContent = useMemo(() => {
    const fullText = result.scannedContent || "";
    if (!fullText) return null;

    interface Marker { start: number; end: number; issue: AuditIssue; index: number; }
    const markers: Marker[] = [];
    result.issues.forEach((issue, idx) => {
      let lastIndex = 0;
      const searchStr = issue.originalText.toLowerCase();
      const lowerFullText = fullText.toLowerCase();
      while ((lastIndex = lowerFullText.indexOf(searchStr, lastIndex)) !== -1) {
        markers.push({ start: lastIndex, end: lastIndex + issue.originalText.length, issue, index: idx });
        lastIndex += issue.originalText.length;
      }
    });

    markers.sort((a, b) => a.start - b.start);
    const segments: { text: string; issue?: AuditIssue; index?: number }[] = [];
    let currentPos = 0;

    markers.forEach((marker) => {
      if (marker.start >= currentPos) {
        if (marker.start > currentPos) segments.push({ text: fullText.substring(currentPos, marker.start) });
        segments.push({ text: fullText.substring(marker.start, marker.end), issue: marker.issue, index: marker.index });
        currentPos = marker.end;
      }
    });
    if (currentPos < fullText.length) segments.push({ text: fullText.substring(currentPos) });
    return segments;
  }, [result.scannedContent, result.issues]);

  const activeIssue = selectedIssueIndex !== null ? result.issues[selectedIssueIndex] : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 text-gray-900">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Results</h2>
          <p className="text-sm text-gray-500">Target: <span className="font-mono text-green-700">{result.url}</span></p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setViewMode('visual')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${viewMode === 'visual' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Visual Review</button>
          <button onClick={onReset} className="px-4 py-2 text-xs font-bold bg-gray-900 text-white rounded-lg hover:bg-black">Reset</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 text-center shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Alignment</span>
          <div className="text-3xl font-black text-green-600">{result.score}%</div>
        </div>
        <div className="md:col-span-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Grounding Sources (Confirmed Scan)</span>
           <div className="flex flex-wrap gap-2">
             {result.sources?.map((s, i) => (
               <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 hover:bg-blue-100 underline transition-colors">
                 {s.title}
               </a>
             )) || <span className="text-[10px] text-gray-400 italic">No external sources logged.</span>}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col shadow-sm">
          <div className="px-6 py-4 bg-gray-50 border-b font-bold text-xs uppercase tracking-widest text-gray-500">Live Scanned Text</div>
          <div className="flex-grow overflow-y-auto p-8 font-serif leading-loose text-lg text-gray-900 bg-white">
            {highlightedContent?.map((seg, i) => (
              seg.issue ? (
                <span 
                  key={i} 
                  onClick={() => setSelectedIssueIndex(seg.index ?? null)} 
                  className={`inline px-1 rounded cursor-pointer transition-all ${selectedIssueIndex === seg.index ? 'bg-red-600 text-white ring-4 ring-red-100' : 'bg-red-100 text-red-900 border-b-2 border-red-300 hover:bg-red-200'}`}
                >
                  {seg.text}
                </span>
              ) : (
                <span key={i} className="whitespace-pre-wrap text-gray-900">{seg.text}</span>
              )
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 p-6 overflow-y-auto shadow-sm flex flex-col">
          {activeIssue ? (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase border border-red-200 bg-red-50 text-red-800">Violation Found</span>
              <div>
                <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Baseline Truth</label>
                <p className="text-sm font-semibold text-blue-900 p-3 bg-blue-50 rounded-xl border border-blue-100">"{activeIssue.baselineReference}"</p>
              </div>
              <div>
                <label className="block text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Suggested Fix</label>
                <p className="text-sm font-bold text-green-900 p-3 bg-green-50 rounded-xl border border-green-100 italic">{activeIssue.suggestedCorrection}</p>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">{activeIssue.reason}</p>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-2">
              <svg className="w-8 h-8 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Select a highlight to inspect</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditView;
