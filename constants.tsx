
import { BrandGuideline } from './types';

export const DEFAULT_BASELINE_DOC = `MongoDB is the developer data platform that provides the services and tools necessary to build distributed applications at the speed and scale users demand. MongoDB’s document model is the most natural way to work with data, and its distributed architecture allows you to place data where you need it. Our mission is to empower innovators to create, maintain, and transform the world's applications. We focus on flexibility, scalability, and developer productivity above all else. We are the unified platform for modern applications.`;

export const DEFAULT_GUIDELINES: BrandGuideline = {
  voice: "Developer-centric, authoritative yet approachable, and forward-thinking.",
  tone: "Helpful, technical but clear, avoiding corporate jargon where possible.",
  prohibitedTerms: [
    "Legacy database",
    "Old school",
    "NoSQL only",
    "Traditional SQL",
    "Cheap",
    "Easy"
  ],
  mandatoryPhrases: [
    "Developer Data Platform",
    "Flexible Schema",
    "Multi-cloud",
    "Operational Data Store"
  ],
  description: "Guidelines focused on MongoDB's evolution from a niche NoSQL database to a comprehensive Developer Data Platform.",
  baselineDocument: DEFAULT_BASELINE_DOC
};

export const MOCK_SITES = [
  { label: "MongoDB Home", url: "https://www.mongodb.com" },
  { label: "MongoDB Products", url: "https://www.mongodb.com/products/capabilities" },
  { label: "MongoDB Pricing", url: "https://www.mongodb.com/pricing" }
];
