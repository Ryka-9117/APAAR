import { Course, SeatCategory } from "./types";

export interface IntakeCalculationResult {
  approvedCapacity: number;
  activeSanctionedEnrolment: number;
  totalActiveEnrolment: number;
  remainingSanctionedSeats: number;
  utilizationPct: number;
  status: "NORMAL" | "WARNING" | "CAPACITY_REACHED" | "OVER_INTAKE";
  supernumeraryStatus: {
    tfw: { approvedLimit: number; enrolled: number; isWithinLimit: boolean };
    ews: { approvedLimit: number; enrolled: number; isWithinLimit: boolean };
    nriOciFn: { approvedLimit: number; enrolled: number; isWithinLimit: boolean };
    pmsss: { approvedLimit: number; enrolled: number; isWithinLimit: boolean };
    lateralEntry: { approvedLimit: number; enrolled: number; isWithinLimit: boolean };
  };
  breachDetails?: {
    isOverIntake: boolean;
    excessSanctionedSeats: number;
    excessSupernumerarySeats: number;
    severity: "NONE" | "LOW" | "HIGH" | "CRITICAL";
    regulatoryRuleViolated?: string;
  };
}

/**
 * Calculates AICTE APH intake utilization and checks regulatory limits
 */
export function calculateCourseIntake(course: Course): IntakeCalculationResult {
  const approvedCapacity = course.approvedCapacity;
  const activeSanctionedEnrolment = course.activeEnrolment;

  // Sanctioned utilization strictly divides active sanctioned enrolment by approved capacity
  const utilizationPct =
    approvedCapacity > 0
      ? Number(((activeSanctionedEnrolment / approvedCapacity) * 100).toFixed(1))
      : 0;

  // AICTE Approval Process Handbook (APH) Thresholds
  let status: "NORMAL" | "WARNING" | "CAPACITY_REACHED" | "OVER_INTAKE" = "NORMAL";
  if (utilizationPct > 100) {
    status = "OVER_INTAKE";
  } else if (utilizationPct === 100) {
    status = "CAPACITY_REACHED";
  } else if (utilizationPct >= 90) {
    status = "WARNING";
  } else {
    status = "NORMAL";
  }

  // Supernumerary quota calculations (AICTE APH Clause 5.1 & 5.2)
  const tfwEnrolled = course.supernumeraryEnrolled?.tfw || 0;
  const tfwLimit = course.supernumeraryLimits?.tfw ?? Math.floor(approvedCapacity * 0.05);

  const ewsEnrolled = course.supernumeraryEnrolled?.ews || 0;
  const ewsLimit = course.supernumeraryLimits?.ews ?? Math.floor(approvedCapacity * 0.10);

  const nriEnrolled = course.supernumeraryEnrolled?.nriOciFn || 0;
  const nriLimit = course.supernumeraryLimits?.nriOciFn ?? Math.floor(approvedCapacity * 0.15);

  const pmsssEnrolled = course.supernumeraryEnrolled?.pmsss || 0;
  const pmsssLimit = course.supernumeraryLimits?.pmsss || 2;

  const lateralEnrolled = course.supernumeraryEnrolled?.lateralEntry || 0;
  const lateralLimit = course.supernumeraryLimits?.lateralEntry ?? Math.floor(approvedCapacity * 0.10);

  const supernumeraryStatus = {
    tfw: { approvedLimit: tfwLimit, enrolled: tfwEnrolled, isWithinLimit: tfwEnrolled <= tfwLimit },
    ews: { approvedLimit: ewsLimit, enrolled: ewsEnrolled, isWithinLimit: ewsEnrolled <= ewsLimit },
    nriOciFn: { approvedLimit: nriLimit, enrolled: nriEnrolled, isWithinLimit: nriEnrolled <= nriLimit },
    pmsss: { approvedLimit: pmsssLimit, enrolled: pmsssEnrolled, isWithinLimit: pmsssEnrolled <= pmsssLimit },
    lateralEntry: { approvedLimit: lateralLimit, enrolled: lateralEnrolled, isWithinLimit: lateralEnrolled <= lateralLimit },
  };

  const isSanctionedOver = activeSanctionedEnrolment > approvedCapacity;
  const excessSanctionedSeats = Math.max(0, activeSanctionedEnrolment - approvedCapacity);

  let excessSupernumerarySeats = 0;
  if (tfwEnrolled > tfwLimit) excessSupernumerarySeats += tfwEnrolled - tfwLimit;
  if (ewsEnrolled > ewsLimit) excessSupernumerarySeats += ewsEnrolled - ewsLimit;
  if (nriEnrolled > nriLimit) excessSupernumerarySeats += nriEnrolled - nriLimit;
  if (pmsssEnrolled > pmsssLimit) excessSupernumerarySeats += pmsssEnrolled - pmsssLimit;
  if (lateralEnrolled > lateralLimit) excessSupernumerarySeats += lateralEnrolled - lateralLimit;

  const totalExcess = excessSanctionedSeats + excessSupernumerarySeats;

  let severity: "NONE" | "LOW" | "HIGH" | "CRITICAL" = "NONE";
  if (totalExcess > 5) severity = "CRITICAL";
  else if (totalExcess > 0) severity = "HIGH";
  else if (status === "WARNING") severity = "LOW";

  const totalActiveEnrolment =
    activeSanctionedEnrolment +
    tfwEnrolled +
    ewsEnrolled +
    nriEnrolled +
    pmsssEnrolled +
    lateralEnrolled;

  return {
    approvedCapacity,
    activeSanctionedEnrolment,
    totalActiveEnrolment,
    remainingSanctionedSeats: approvedCapacity - activeSanctionedEnrolment,
    utilizationPct,
    status,
    supernumeraryStatus,
    breachDetails: {
      isOverIntake: status === "OVER_INTAKE" || totalExcess > 0,
      excessSanctionedSeats,
      excessSupernumerarySeats,
      severity,
      regulatoryRuleViolated:
        status === "OVER_INTAKE"
          ? `AICTE Approval Process Handbook (APH) Section 7.2: Total active admissions (${activeSanctionedEnrolment}) exceed AICTE approved intake (${approvedCapacity}) by ${excessSanctionedSeats} seats.`
          : undefined,
    },
  };
}

/**
 * Maps student seatCategory to sanctioned vs supernumerary classification
 */
export function isSupernumeraryCategory(category: SeatCategory): boolean {
  return ["TFW", "EWS", "PMSSS", "NRI_OCI_FN", "LATERAL_ENTRY", "KASHMIRI_MIGRANT"].includes(category);
}
