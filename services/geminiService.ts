
import { GoogleGenAI, Type } from "@google/genai";
import { BrandGuideline, AuditResult, GroundingSource } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function auditContent(
  content: string, 
  guidelines: BrandGuideline, 
  url?: string
): Promise<AuditResult> {
  const isUrlScan = !!url && !content;

  const prompt = `
    Perform an UNBIASED Brand Compliance Audit. 
    
    GROUND TRUTH (The Absolute Baseline Document):
    """
    ${guidelines.baselineDocument}
    """

    STRICT GUIDELINES:
    - Voice: ${guidelines.voice}
    - Tone: ${guidelines.tone}
    - Prohibited Terms: ${guidelines.prohibitedTerms.join(", ")}
    - Mandatory Phrases: ${guidelines.mandatoryPhrases.join(", ")}

    TARGET: ${isUrlScan ? `Examine the live contents of ${url}. Only audit what is currently on the page.` : 'Examine the provided text snippet.'}
    
    INSTRUCTIONS:
    1. Compare the target content to the GROUND TRUTH.
    2. A VIOLATION occurs if the target content:
       - Contradicts a fact in the Baseline Document.
       - Uses a prohibited term.
       - Omits a mandatory phrase in a relevant context.
       - Drifts significantly in tone (e.g., becomes "corporate jargon" instead of "approachable").
    3. DO NOT report hallucinations. If the web content is aligned, report 100% score and 0 issues.
    4. Provide the FULL text you retrieved from the target in the "auditedText" field.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: isUrlScan ? [{ googleSearch: {} }] : [],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          semanticDrift: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          auditedText: { type: Type.STRING },
          issues: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                severity: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
                type: { type: Type.STRING, enum: ['messaging', 'style', 'terminology', 'semantic-drift'] },
                originalText: { type: Type.STRING },
                contextSnippet: { type: Type.STRING },
                baselineReference: { type: Type.STRING },
                suggestedCorrection: { type: Type.STRING },
                reason: { type: Type.STRING },
                location: { type: Type.STRING }
              },
              required: ['severity', 'type', 'originalText', 'contextSnippet', 'baselineReference', 'suggestedCorrection', 'reason', 'location']
            }
          }
        },
        required: ['score', 'semanticDrift', 'summary', 'issues', 'auditedText']
      }
    }
  });

  const result = JSON.parse(response.text || '{}');
  
  // Extract grounding sources if they exist
  const sources: GroundingSource[] = [];
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks) {
    groundingChunks.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({ title: chunk.web.title, uri: chunk.web.uri });
      }
    });
  }

  return { 
    score: result.score ?? 0,
    semanticDrift: result.semanticDrift ?? 0,
    summary: result.summary ?? "Audit completed.",
    issues: result.issues ?? [],
    url: url || 'Manual Input',
    scannedContent: result.auditedText || content,
    sources: sources.length > 0 ? sources : undefined
  };
}
