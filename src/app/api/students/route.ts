import { NextResponse } from "next/server";
import { store } from "@/lib/store";
import { Role } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const institutionId = searchParams.get("institutionId") || undefined;
  const courseId = searchParams.get("courseId") || undefined;
  const search = searchParams.get("q")?.toLowerCase();

  let students = store.getStudents(institutionId);

  if (courseId) {
    students = students.filter((s) => s.courseId === courseId);
  }

  if (search) {
    students = students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(search) ||
        s.institutionalStudentId.toLowerCase().includes(search) ||
        s.apaarNormalized.includes(search)
    );
  }

  return NextResponse.json({ students, count: students.length });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const actorRole = (request.headers.get("x-user-role") as Role) || "INSTITUTION_ADMIN";
    const actorId = request.headers.get("x-user-id") || "INSTITUTION-PORTAL";
    const actorName = request.headers.get("x-user-name") || "Institutional Administrator";

    if (!body.apaarId || !body.fullName || !body.courseId || !body.institutionId) {
      return NextResponse.json(
        { error: "Missing mandatory fields: apaarId, fullName, courseId, institutionId" },
        { status: 400 }
      );
    }

    const student = store.addStudent(body, actorId, actorRole, actorName);
    return NextResponse.json({ success: true, student }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
