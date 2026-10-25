import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { computeDocumentSha256, computePerceptualHash } from "@/lib/forensics";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const institutionId = searchParams.get("institutionId") || undefined;
  const docs = store.getForensicDocuments(institutionId);
  return NextResponse.json({ documents: docs, count: docs.length });
}

export async function POST(request: Request) {
  try {
    const { fileName, fileContentBase64, extractedText, metadata, institutionId, studentId, studentName } = await request.json();

    if (!fileName || !fileContentBase64) {
      return NextResponse.json({ error: "Missing fileName or file content" }, { status: 400 });
    }

    const buffer = Buffer.from(fileContentBase64, "base64");
    const fileSha256 = computeDocumentSha256(buffer);
    const pHash = computePerceptualHash(extractedText || fileName, metadata || {});

    const doc = store.addForensicDocument({
      fileName,
      fileSizeBytes: buffer.length,
      fileSha256,
      perceptualHash: pHash,
      pageCount: 1,
      extractedText: extractedText || `SCANNED_DOCUMENT_CONTENT: ${fileName}`,
      metadata: metadata || {
        creator: "Demo Uploader",
        creationDate: new Date().toISOString(),
      },
      institutionId: institutionId || "INST-DITS",
      studentId,
      studentName,
    });

    return NextResponse.json({ success: true, document: doc }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
