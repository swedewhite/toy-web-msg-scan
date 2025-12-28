
import { GoogleGenAI, Type } from "@google/genai";
import { BrandGuideline, AuditResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export async function auditContent(
  content: string, 
  guidelines: BrandGuideline, 
  url?: string
): Promise<AuditResult> {
  // If a URL is provided, we use the googleSearch tool to let Gemini "read" the live site.
  // If content is provided manually, we audit that string directly.
  const isUrlScan = !!url && !content;

  const prompt = `
    Perform a strict Brand Compliance Audit.
    
    GROUND TRUTH (The Baseline Messaging Document):
    """
    ${guidelines.baselineDocument}
    """

    STRICT GUIDELINES:
    - Voice: ${guidelines.voice}
    - Tone: ${guidelines.tone}
    - Prohibited Terms: ${guidelines.prohibitedTerms.join(", ")}
    - Mandatory Phrases: ${guidelines.mandatoryPhrases.join(", ")}

    ${isUrlScan 
      ? `TARGET: Please visit and analyze the live content at the URL: ${url}`
      : `TARGET WEB CONTENT:
    """
    ${content}
    """`
    }

    TASK:
    1. ${isUrlScan ? 'Access the live content of the URL provided.' : 'Analyze the provided text.'}
    2. Compare it to the GROUND TRUTH document. Any deviation in facts, tone, or terminology is a VIOLATION.
    3. Calculate "Semantic Drift" (0-100%) and "Alignment Score" (0-100%).
    4. For EVERY violation:
       - originalText: The EXACT text snippet as it appears in the target source.
       - contextSnippet: The surrounding paragraph.
       - baselineReference: The specific truth from the baseline it violates.
       - suggestedCorrection: How to fix it.
       - reason: Why it is a violation.
    5. VERY IMPORTANT: Return the "auditedText" property containing the FULL text you retrieved/analyzed so the UI can render it for the user.

    Return as JSON.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      // Use search grounding for live URL lookups
      tools: isUrlScan ? [{ googleSearch: {} }] : [],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          semanticDrift: { type: Type.NUMBER },
          summary: { type: Type.STRING },
          auditedText: { type: Type.STRING, description: "The full text retrieved from the URL or provided for auditing." },
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
  return { 
    score: result.score ?? 0,
    semanticDrift: result.semanticDrift ?? 0,
    summary: result.summary ?? "Audit completed.",
    issues: result.issues ?? [],
    url: url || 'Manual Input',
    scannedContent: result.auditedText || content
  };
}
