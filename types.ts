
export interface BrandGuideline {
  voice: string;
  tone: string;
  prohibitedTerms: string[];
  mandatoryPhrases: string[];
  description: string;
  baselineDocument: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface AuditIssue {
  severity: 'high' | 'medium' | 'low';
  type: 'messaging' | 'style' | 'terminology' | 'semantic-drift';
  originalText: string;
  contextSnippet: string;
  baselineReference: string;
  suggestedCorrection: string;
  reason: string;
  location?: string;
}

export interface AuditResult {
  score: number;
  semanticDrift: number;
  summary: string;
  issues: AuditIssue[];
  url?: string;
  scannedContent: string;
  sources?: GroundingSource[];
}

export enum AppState {
  CONFIGURATION = 'CONFIGURATION',
  AUDITING = 'AUDITING',
  RESULTS = 'RESULTS'
}
