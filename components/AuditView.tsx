
import React, { useState, useMemo } from 'react';
import { AuditResult, AuditIssue } from '../types';

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

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-amber-500';
    return 'text-red-600';
  };

  // Improved highlighting engine: Handles overlapping segments and case-insensitive matching
  const highlightedContent = useMemo(() => {
    const fullText = result.scannedContent || "";
    if (!fullText) return null;

    interface Marker {
      start: number;
      end: number;
      issue: AuditIssue;
      index: number;
    }

    const markers: Marker[] = [];
    result.issues.forEach((issue, idx) => {
      // Robust searching: find all occurrences of the violation text
      let lastIndex = 0;
      const searchStr = issue.originalText.toLowerCase();
      const lowerFullText = fullText.toLowerCase();

      while ((lastIndex = lowerFullText.indexOf(searchStr, lastIndex)) !== -1) {
        markers.push({
          start: lastIndex,
          end: lastIndex + issue.originalText.length,
          issue,
          index: idx
        });
        lastIndex += issue.originalText.length;
      }
    });

    // Sort markers by start index
    markers.sort((a, b) => a.start - b.start);

    // Merge/Process segments
    const segments: { text: string; issue?: AuditIssue; index?: number }[] = [];
    let currentPos = 0;

    markers.forEach((marker) => {
      if (marker.start >= currentPos) {
        // Text before the highlight
        if (marker.start > currentPos) {
          segments.push({ text: fullText.substring(currentPos, marker.start) });
        }
        // The highlight itself
        segments.push({ 
          text: fullText.substring(marker.start, marker.end), 
          issue: marker.issue, 
          index: marker.index 
        });
        currentPos = marker.end;
      }
    });

    // Remaining text after last highlight
    if (currentPos < fullText.length) {
      segments.push({ text: fullText.substring(currentPos) });
    }

    return segments;
  }, [result.scannedContent, result.issues]);

  const activeIssue = selectedIssueIndex !== null ? result.issues[selectedIssueIndex] : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Results</h2>
          <p className="text-gray-500 text-sm">Target: <span className="font-mono text-green-700 bg-green-50 px-1 rounded">{result.url}</span></p>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl border border-gray-200">
          <button 
            onClick={() => setViewMode('visual')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'visual' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Visual Review
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Deltas List
          </button>
          <div className="w-px h-4 bg-gray-300 mx-1"></div>
          <button 
            onClick={onReset}
            className="px-4 py-1.5 text-xs font-bold text-gray-600 hover:bg-white rounded-lg transition-all"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Truth Alignment</span>
          <div className={`text-4xl font-black ${getScoreColor(result.score)}`}>{result.score}%</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Semantic Drift</span>
          <div className="text-4xl font-black text-gray-900">{result.semanticDrift}%</div>
        </div>
        <div className="md:col-span-2 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Executive Summary</span>
          <p className="text-gray-600 text-xs leading-relaxed italic">"{result.summary}"</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Page View</h3>
            <span className="text-[10px] text-gray-400 font-medium">Click flags to see compliance reason</span>
          </div>
          <div className="flex-grow overflow-y-auto p-8 font-serif leading-loose text-lg text-gray-800 bg-[#fefefe]">
            <div className="max-w-2xl mx-auto whitespace-pre-wrap">
              {highlightedContent?.map((seg, i) => (
                seg.issue ? (
                  <button
                    key={i}
                    onClick={() => setSelectedIssueIndex(seg.index ?? null)}
                    className={`inline px-1 rounded-sm cursor-pointer transition-all duration-200 ${
                      selectedIssueIndex === seg.index 
                      ? 'bg-red-600 text-white ring-4 ring-red-100 scale-105 z-10' 
                      : 'bg-red-100 text-red-900 border-b-2 border-red-300 hover:bg-red-200'
                    }`}
                  >
                    {seg.text}
                  </button>
                ) : (
                  <span key={i}>{seg.text}</span>
                )
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col p-6 overflow-y-auto">
          {activeIssue ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${getSeverityColor(activeIssue.severity)}`}>
                  {activeIssue.severity} Priority
                </span>
                <button onClick={() => setSelectedIssueIndex(null)} className="text-gray-400">×</button>
              </div>

              <div>
                <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">Ground Truth Standard</label>
                <p className="text-blue-900 text-sm font-semibold p-3 bg-blue-50 rounded-xl border border-blue-100">
                  "{activeIssue.baselineReference}"
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-green-600 uppercase tracking-widest mb-2">Correction</label>
                <p className="text-green-900 text-sm font-bold p-3 bg-green-50 rounded-xl border border-green-100 italic">
                  {activeIssue.suggestedCorrection}
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Reason</label>
                <p className="text-gray-600 text-xs leading-relaxed">{activeIssue.reason}</p>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Select a violation to inspect</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditView;
