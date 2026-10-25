import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { ImportBatch, Student, SeatCategory, ProgrammeMode } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { batch, importOnlyValid } = await request.json() as {
      batch: ImportBatch;
      importOnlyValid: boolean;
    };

    if (!batch || !batch.rowResults) {
      return NextResponse.json({ error: "Missing batch or row results" }, { status: 400 });
    }

    const rowsToImport = importOnlyValid
      ? batch.rowResults.filter((r) => r.canImport)
      : batch.rowResults;

    let importedCount = 0;
    const actorRole = "INSTITUTION_ADMIN";
    const actorId = "INSTITUTION-UPLOAD-SVC";
    const actorName = "Bulk Data Uploader";

    for (const r of rowsToImport) {
      const raw = r.raw;
      const apaarId = raw["apaar_id"] || raw["APAAR ID"] || "";
      const instId = raw["institution_id"] || raw["Institution ID"] || batch.institutionId;
      const courseId = raw["course_id"] || raw["Course ID"] || "";
      const fullName = raw["student_full_name"] || raw["Student Full Name"] || "";
      const dob = raw["dob"] || raw["Date of Birth"] || "2003-01-01";
      const studentId = raw["institutional_student_id"] || `INST-${Date.now().toString().slice(-4)}`;
      const seatCat = (raw["seat_category"] || "SANCTIONED_OPEN") as SeatCategory;
      const progMode = (raw["programme_mode"] || "FULL_TIME") as ProgrammeMode;

      store.addStudent(
        {
          apaarId,
          apaarNormalized: apaarId.replace(/[\s-]/g, ""),
          institutionalStudentId: studentId,
          fullName,
          dob,
          gender: "MALE",
          category: "GENERAL",
          seatCategory: seatCat,
          nriStatus: seatCat === "NRI_OCI_FN",
          ociStatus: false,
          foreignNational: false,
          institutionId: instId,
          courseId,
          academicYear: raw["academic_year"] || "2024-25",
          admissionDate: raw["admission_date"] || new Date().toISOString().slice(0, 10),
          programmeMode: progMode,
          enrolmentStatus: "ACTIVE",
          apaarStatus: "REGISTRY_MATCH",
          apaarVerifiedAt: new Date().toISOString(),
        },
        actorId,
        actorRole,
        actorName
      );

      importedCount++;
    }

    batch.status = "COMMITTED";
    batch.importedCount = importedCount;
    store.addImportBatch(batch);

    return NextResponse.json({
      success: true,
      importedCount,
      totalProcessed: batch.totalRows,
      batchId: batch.id,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
