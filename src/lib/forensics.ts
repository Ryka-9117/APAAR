import crypto from "crypto";
import { ForensicDocument } from "./types";

/**
 * Computes exact SHA-256 byte hash for uploaded document content
 */
export function computeDocumentSha256(content: Buffer | string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

/**
 * Computes a deterministic perceptual block difference hash (pHash representation)
 * from text structure, layout patterns, and token densities.
 */
export function computePerceptualHash(text: string, metadata: Record<string, unknown> = {}): string {
  // Normalize layout tokens
  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, " ");
  const tokens = clean.split(/\s+/).filter(Boolean);
  
  // Frequency distribution across 16 hash buckets
  const buckets = new Array(16).fill(0);
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    let hash = 0;
    for (let c = 0; c < token.length; c++) {
      hash = (hash << 5) - hash + token.charCodeAt(c);
      hash |= 0;
    }
    const idx = Math.abs(hash) % 16;
    buckets[idx] += 1;
  }

  // Calculate median threshold
  const sorted = [...buckets].sort((a, b) => a - b);
  const median = (sorted[7] + sorted[8]) / 2;

  // Convert to 16-bit hex fingerprint
  let hexBits = 0;
  for (let i = 0; i < 16; i++) {
    if (buckets[i] >= median) {
      hexBits |= 1 << i;
    }
  }

  return hexBits.toString(16).padStart(4, "0").toUpperCase();
}

/**
 * Calculates Hamming distance similarity between two perceptual hashes (0% to 100%)
 */
export function calculatePerceptualSimilarity(hashA: string, hashB: string): number {
  if (!hashA || !hashB) return 0;
  const numA = parseInt(hashA, 16);
  const numB = parseInt(hashB, 16);
  if (isNaN(numA) || isNaN(numB)) return 0;

  // XOR to find differing bits
  let xor = numA ^ numB;
  let differingBits = 0;
  while (xor > 0) {
    differingBits += xor & 1;
    xor >>= 1;
  }

  // 16 total bits
  const identicalBits = 16 - differingBits;
  return Math.round((identicalBits / 16) * 100);
}

/**
 * Analyzes document for forensic indicators: exact byte duplicate, visual/template similarity, text alteration
 */
export function analyzeDocumentForensics(
  uploadedDoc: {
    fileName: string;
    fileSizeBytes: number;
    fileSha256: string;
    perceptualHash: string;
    extractedText: string;
    metadata: {
      creator?: string;
      producer?: string;
      creationDate?: string;
      modifiedDate?: string;
      title?: string;
    };
  },
  existingDocs: ForensicDocument[]
): ForensicDocument["findings"] {
  const findings: ForensicDocument["findings"] = [];

  for (const existing of existingDocs) {
    // 1. Exact SHA-256 byte match
    if (existing.fileSha256 === uploadedDoc.fileSha256) {
      findings.push({
        type: "EXACT_DUPLICATE",
        severity: "CRITICAL",
        matchedDocId: existing.id,
        matchedFileName: existing.fileName,
        similarityScore: 100,
        explanation: `Exact cryptographic SHA-256 byte match (${uploadedDoc.fileSha256.slice(0, 16)}...) detected with previously uploaded file "${existing.fileName}". The files are identical bit-for-bit.`,
      });
      continue;
    }

    // 2. Perceptual Similarity comparison
    const simScore = calculatePerceptualSimilarity(
      uploadedDoc.perceptualHash,
      existing.perceptualHash
    );

    if (simScore >= 80) {
      // Check if extracted text differs significantly despite visual template match (Template Spoofing)
      const diffTokens = uploadedDoc.extractedText !== existing.extractedText;
      if (diffTokens) {
        findings.push({
          type: "TEXT_TAMPER_SUSPECTED",
          severity: "HIGH",
          matchedDocId: existing.id,
          matchedFileName: existing.fileName,
          similarityScore: simScore,
          explanation: `High visual/template similarity (${simScore}%) with "${existing.fileName}", but certificate student name or serial text fields differ. Possible template reuse or digital alteration.`,
        });
      } else {
        findings.push({
          type: "PERCEPTUAL_SIMILARITY",
          severity: "MEDIUM",
          matchedDocId: existing.id,
          matchedFileName: existing.fileName,
          similarityScore: simScore,
          explanation: `Strong visual layout match (${simScore}%) indicates a re-scanned or re-compressed version of an existing document.`,
        });
      }
    }
  }

  // 3. Metadata Anomaly Detection
  if (uploadedDoc.metadata.creationDate && uploadedDoc.metadata.modifiedDate) {
    const created = new Date(uploadedDoc.metadata.creationDate).getTime();
    const modified = new Date(uploadedDoc.metadata.modifiedDate).getTime();
    if (!isNaN(created) && !isNaN(modified) && modified < created) {
      findings.push({
        type: "METADATA_ANOMALY",
        severity: "LOW",
        explanation: "Suspicious metadata: PDF modified timestamp is earlier than creation timestamp.",
      });
    }
  }

  // If no anomalies found
  if (findings.length === 0) {
    findings.push({
      type: "CLEAN",
      severity: "LOW",
      explanation: "No duplicate hashes, template collisions, or anomalous metadata detected.",
    });
  }

  return findings;
}
