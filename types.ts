
export interface BrandGuideline {
  voice: string;
  tone: string;
  prohibitedTerms: string[];
  mandatoryPhrases: string[];
  description: string;
  baselineDocument: string;
}

export interface AuditIssue {
  severity: 'high' | 'medium' | 'low';
  type: 'messaging' | 'style' | 'terminology' | 'semantic-drift';
  originalText: string;
  contextSnippet: string; // Larger snippet from web copy for context
  baselineReference: string; // The specific standard/truth from the baseline
  suggestedCorrection: string;
  reason: string;
  location?: string;
  startIndex?: number; // Optional marker for highlighting
}

export interface AuditResult {
  score: number; // 0-100 (Alignment Score)
  semanticDrift: number; // 0-100 (How much it veers away)
  summary: string;
  issues: AuditIssue[];
  url?: string;
  scannedContent: string; // The full text that was audited
}

export enum AppState {
  CONFIGURATION = 'CONFIGURATION',
  AUDITING = 'AUDITING',
  RESULTS = 'RESULTS'
}
