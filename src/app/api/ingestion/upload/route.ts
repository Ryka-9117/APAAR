import { NextResponse } from "next/server";
import Papa from "papaparse";
import { store } from "@/lib/store";
import { validateBatchRows } from "@/lib/ingestion";
import { ImportBatch } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { csvContent, fileName, institutionId } = await request.json();

    if (!csvContent) {
      return NextResponse.json({ error: "No CSV content provided" }, { status: 400 });
    }

    const parsed = Papa.parse<Record<string, string>>(csvContent, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return NextResponse.json(
        { error: `CSV parsing failed: ${parsed.errors[0].message}` },
        { status: 400 }
      );
    }

    const validInstIds = new Set(store.getInstitutions().map((i) => i.id));
    const validCourseIds = new Set(store.getCourses().map((c) => c.id));
    const existingApaar = new Set(store.getStudents().map((s) => s.apaarNormalized));

    const rowResults = validateBatchRows(
      parsed.data,
      validInstIds,
      validCourseIds,
      existingApaar
    );

    const validCount = rowResults.filter((r) => r.status === "VALID").length;
    const warningCount = rowResults.filter((r) => r.status === "WARNING").length;
    const errorCount = rowResults.filter((r) => r.status === "ERROR").length;

    const batchId = `BATCH-${Date.now().toString().slice(-6)}`;
    const batch: ImportBatch = {
      id: batchId,
      institutionId: institutionId || "INST-DITS",
      fileName: fileName || "student_admissions_upload.csv",
      uploadedAt: new Date().toISOString(),
      totalRows: rowResults.length,
      validRows: validCount,
      warningRows: warningCount,
      errorRows: errorCount,
      status: "PREVIEWING",
      importedCount: 0,
      rowResults,
    };

    return NextResponse.json({ batch });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
