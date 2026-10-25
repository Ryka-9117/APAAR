import {
  Institution,
  Course,
  Student,
  DuplicateCase,
  StudentCredential,
  ConsentRequest,
  AuditEvent,
  ForensicDocument,
} from "./types";
import { formatApaarId } from "./apaar";
import { GENESIS_HASH, sha256, computeAuditEventHash, signCredentialPayload } from "./crypto";
import { computeDocumentSha256, computePerceptualHash } from "./forensics";

export interface SeedData {
  institutions: Institution[];
  courses: Course[];
  students: Student[];
  duplicates: DuplicateCase[];
  credentials: StudentCredential[];
  consentRequests: ConsentRequest[];
  forensicDocuments: ForensicDocument[];
  auditEvents: AuditEvent[];
}

export function generateSeedData(): SeedData {
  // 1. 12 Fictional AICTE Institutions
  const institutions: Institution[] = [
    {
      id: "INST-DITS",
      code: "AICTE-DL-101",
      name: "Delhi Institute of Technology & Science",
      state: "Delhi",
      city: "New Delhi",
      type: "GOVERNMENT",
      establishedYear: 1988,
      accreditation: "NAAC_A_PLUS",
      approvedIntakeTotal: 720,
      contactEmail: "admin@dits.ac.in",
      contactPhone: "+91-11-27894000",
      riskScore: 24,
      riskFactors: [
        { factor: "Intake Adherence", weight: 0.1, description: "Normal utilization across most branches" },
        { factor: "Data Quality", weight: 0.14, description: "Minor duplicate flag in 1st year CSE" },
      ],
    },
    {
      id: "INST-VEA",
      code: "AICTE-TN-202",
      name: "Vellore Engineering Academy",
      state: "Tamil Nadu",
      city: "Vellore",
      type: "PRIVATE_AUTONOMOUS",
      establishedYear: 1994,
      accreditation: "NAAC_A_PLUS",
      approvedIntakeTotal: 600,
      contactEmail: "registrar@vea.edu.in",
      contactPhone: "+91-416-2243000",
      riskScore: 18,
      riskFactors: [{ factor: "Regulatory Compliance", weight: 0.18, description: "Exemplary digital records" }],
    },
    {
      id: "INST-MITR",
      code: "AICTE-MH-303",
      name: "Maharashtra Institute of Tech & Research",
      state: "Maharashtra",
      city: "Pune",
      type: "GOVT_AIDED",
      establishedYear: 1982,
      accreditation: "NBA_ACCREDITED",
      approvedIntakeTotal: 540,
      contactEmail: "principal@mitr.ac.in",
      contactPhone: "+91-20-25442000",
      riskScore: 78, // High risk due to 108% breach
      riskFactors: [
        { factor: "Intake Over-admissions", weight: 0.45, description: "B.Tech CSE exceeding intake by 8 seats (108%)" },
        { factor: "Cross-Institution Duplicate", weight: 0.33, description: "Concurrent student detected with DITS Delhi" },
      ],
    },
    {
      id: "INST-KNIE",
      code: "AICTE-KA-404",
      name: "Karnataka National Institute of Engineering",
      state: "Karnataka",
      city: "Bengaluru",
      type: "GOVERNMENT",
      establishedYear: 1976,
      accreditation: "NAAC_A_PLUS",
      approvedIntakeTotal: 800,
      contactEmail: "admissions@knie.ac.in",
      contactPhone: "+91-80-23600000",
      riskScore: 28,
      riskFactors: [{ factor: "Capacity Headroom", weight: 0.28, description: "Approaching 92% in AI/ML branch" }],
    },
    {
      id: "INST-GTC",
      code: "AICTE-GJ-505",
      name: "Gujarat Technological College",
      state: "Gujarat",
      city: "Ahmedabad",
      type: "AFFILIATED",
      establishedYear: 2001,
      accreditation: "NAAC_A",
      approvedIntakeTotal: 420,
      contactEmail: "dean@gtc.edu.in",
      contactPhone: "+91-79-26300000",
      riskScore: 35,
      riskFactors: [{ factor: "APAAR Verification", weight: 0.35, description: "3 pending student DOB mismatches" }],
    },
    {
      id: "INST-BITS-K",
      code: "AICTE-WB-606",
      name: "Bengal Institute of Tech & Science",
      state: "West Bengal",
      city: "Kolkata",
      type: "GOVT_AIDED",
      establishedYear: 1991,
      accreditation: "NBA_ACCREDITED",
      approvedIntakeTotal: 480,
      contactEmail: "admin@bitsk.edu.in",
      contactPhone: "+91-33-24146000",
      riskScore: 22,
      riskFactors: [{ factor: "Seat Allocation", weight: 0.22, description: "Normal utilization" }],
    },
    {
      id: "INST-TCAE",
      code: "AICTE-TS-707",
      name: "Telangana College of Advanced Engineering",
      state: "Telangana",
      city: "Hyderabad",
      type: "PRIVATE_AUTONOMOUS",
      establishedYear: 1999,
      accreditation: "NAAC_A_PLUS",
      approvedIntakeTotal: 660,
      contactEmail: "info@tcae.ac.in",
      contactPhone: "+91-40-23158000",
      riskScore: 30,
      riskFactors: [{ factor: "Dual Program Monitoring", weight: 0.3, description: "Part-time diploma verification underway" }],
    },
    {
      id: "INST-RIPE",
      code: "AICTE-RJ-808",
      name: "Rajasthan Institute of Polytech & Engg",
      state: "Rajasthan",
      city: "Jaipur",
      type: "AFFILIATED",
      establishedYear: 2005,
      accreditation: "PROVISIONAL",
      approvedIntakeTotal: 360,
      contactEmail: "contact@ripe.edu.in",
      contactPhone: "+91-141-2713000",
      riskScore: 48,
      riskFactors: [{ factor: "Document Quality", weight: 0.48, description: "Suspected altered certificate flagged in forensics" }],
    },
    {
      id: "INST-KATS",
      code: "AICTE-KL-909",
      name: "Kerala Academy of Technical Sciences",
      state: "Kerala",
      city: "Thiruvananthapuram",
      type: "GOVERNMENT",
      establishedYear: 1985,
      accreditation: "NAAC_A_PLUS",
      approvedIntakeTotal: 500,
      contactEmail: "academic@kats.ac.in",
      contactPhone: "+91-471-2598000",
      riskScore: 15,
      riskFactors: [{ factor: "Audit Integrity", weight: 0.15, description: "Fully verified blockchain hash records" }],
    },
    {
      id: "INST-UPIST",
      code: "AICTE-UP-110",
      name: "Uttar Pradesh Institute of Science & Tech",
      state: "Uttar Pradesh",
      city: "Lucknow",
      type: "GOVT_AIDED",
      establishedYear: 1990,
      accreditation: "NAAC_A",
      approvedIntakeTotal: 600,
      contactEmail: "registrar@upist.ac.in",
      contactPhone: "+91-522-2732000",
      riskScore: 42,
      riskFactors: [{ factor: "Supernumerary Quotas", weight: 0.42, description: "EWS admissions near threshold" }],
    },
    {
      id: "INST-PIEM",
      code: "AICTE-PB-111",
      name: "Punjab Institute of Engg & Management",
      state: "Punjab",
      city: "Chandigarh",
      type: "PRIVATE_AUTONOMOUS",
      establishedYear: 1997,
      accreditation: "NBA_ACCREDITED",
      approvedIntakeTotal: 450,
      contactEmail: "info@piem.edu.in",
      contactPhone: "+91-172-2753000",
      riskScore: 25,
      riskFactors: [{ factor: "Intake", weight: 0.25, description: "Standard enrolment" }],
    },
    {
      id: "INST-MPNTI",
      code: "AICTE-MP-112",
      name: "Madhya Pradesh National Tech Institute",
      state: "Madhya Pradesh",
      city: "Bhopal",
      type: "GOVERNMENT",
      establishedYear: 1980,
      accreditation: "NAAC_A_PLUS",
      approvedIntakeTotal: 550,
      contactEmail: "director@mpnti.ac.in",
      contactPhone: "+91-755-2670000",
      riskScore: 20,
      riskFactors: [{ factor: "Admissions", weight: 0.2, description: "Normal compliance" }],
    },
  ];

  // 2. Courses with target test scenarios (72%, 92%, 100%, 108%)
  const courses: Course[] = [
    // 72% Scenario: DITS Mechanical Engineering (72 enrolled / 100 approved = 72% -> NORMAL)
    {
      id: "COURSE-DITS-MECH",
      institutionId: "INST-DITS",
      code: "BTECH-MECH",
      name: "B.Tech Mechanical Engineering",
      degreeLevel: "UNDERGRADUATE",
      academicYear: "2024-25",
      approvedCapacity: 100,
      activeEnrolment: 72,
      supernumeraryLimits: { tfw: 5, ews: 10, nriOciFn: 15, pmsss: 2, lateralEntry: 10 },
      supernumeraryEnrolled: { tfw: 3, ews: 6, nriOciFn: 2, pmsss: 1, lateralEntry: 4 },
      utilizationPct: 72.0,
      status: "NORMAL",
      lastAuditTimestamp: "2024-09-01T10:00:00Z",
    },
    // 92% Scenario: KNIE AI & Machine Learning (92 enrolled / 100 approved = 92% -> WARNING)
    {
      id: "COURSE-KNIE-AIML",
      institutionId: "INST-KNIE",
      code: "BTECH-AIML",
      name: "B.Tech Artificial Intelligence & Machine Learning",
      degreeLevel: "UNDERGRADUATE",
      academicYear: "2024-25",
      approvedCapacity: 100,
      activeEnrolment: 92,
      supernumeraryLimits: { tfw: 5, ews: 10, nriOciFn: 15, pmsss: 2, lateralEntry: 10 },
      supernumeraryEnrolled: { tfw: 5, ews: 9, nriOciFn: 4, pmsss: 2, lateralEntry: 8 },
      utilizationPct: 92.0,
      status: "WARNING",
      lastAuditTimestamp: "2024-09-05T14:30:00Z",
    },
    // 100% Scenario: VEA Electronics & Communication (100 enrolled / 100 approved = 100% -> CAPACITY_REACHED)
    {
      id: "COURSE-VEA-ECE",
      institutionId: "INST-VEA",
      code: "BTECH-ECE",
      name: "B.Tech Electronics & Communication Engineering",
      degreeLevel: "UNDERGRADUATE",
      academicYear: "2024-25",
      approvedCapacity: 100,
      activeEnrolment: 100,
      supernumeraryLimits: { tfw: 5, ews: 10, nriOciFn: 15, pmsss: 2, lateralEntry: 10 },
      supernumeraryEnrolled: { tfw: 5, ews: 10, nriOciFn: 6, pmsss: 2, lateralEntry: 10 },
      utilizationPct: 100.0,
      status: "CAPACITY_REACHED",
      lastAuditTimestamp: "2024-09-10T11:15:00Z",
    },
    // 108% Scenario: MITR Computer Science & Engineering (108 enrolled / 100 approved = 108% -> OVER_INTAKE)
    {
      id: "COURSE-MITR-CSE",
      institutionId: "INST-MITR",
      code: "BTECH-CSE",
      name: "B.Tech Computer Science & Engineering",
      degreeLevel: "UNDERGRADUATE",
      academicYear: "2024-25",
      approvedCapacity: 100,
      activeEnrolment: 108,
      supernumeraryLimits: { tfw: 5, ews: 10, nriOciFn: 15, pmsss: 2, lateralEntry: 10 },
      supernumeraryEnrolled: { tfw: 5, ews: 10, nriOciFn: 7, pmsss: 2, lateralEntry: 10 },
      utilizationPct: 108.0,
      status: "OVER_INTAKE",
      lastAuditTimestamp: "2024-09-15T16:45:00Z",
    },
    // Additional courses across institutions
    {
      id: "COURSE-DITS-CSE",
      institutionId: "INST-DITS",
      code: "BTECH-CSE",
      name: "B.Tech Computer Science & Engineering",
      degreeLevel: "UNDERGRADUATE",
      academicYear: "2024-25",
      approvedCapacity: 120,
      activeEnrolment: 114,
      supernumeraryLimits: { tfw: 6, ews: 12, nriOciFn: 18, pmsss: 2, lateralEntry: 12 },
      supernumeraryEnrolled: { tfw: 6, ews: 11, nriOciFn: 5, pmsss: 2, lateralEntry: 9 },
      utilizationPct: 95.0,
      status: "WARNING",
      lastAuditTimestamp: "2024-09-12T09:30:00Z",
    },
    {
      id: "COURSE-GTC-IT",
      institutionId: "INST-GTC",
      code: "BTECH-IT",
      name: "B.Tech Information Technology",
      degreeLevel: "UNDERGRADUATE",
      academicYear: "2024-25",
      approvedCapacity: 80,
      activeEnrolment: 65,
      supernumeraryLimits: { tfw: 4, ews: 8, nriOciFn: 12, pmsss: 2, lateralEntry: 8 },
      supernumeraryEnrolled: { tfw: 3, ews: 5, nriOciFn: 2, pmsss: 1, lateralEntry: 4 },
      utilizationPct: 81.25,
      status: "NORMAL",
      lastAuditTimestamp: "2024-09-08T12:00:00Z",
    },
    {
      id: "COURSE-BITS-EE",
      institutionId: "INST-BITS-K",
      code: "BTECH-EE",
      name: "B.Tech Electrical Engineering",
      degreeLevel: "UNDERGRADUATE",
      academicYear: "2024-25",
      approvedCapacity: 90,
      activeEnrolment: 70,
      supernumeraryLimits: { tfw: 4, ews: 9, nriOciFn: 13, pmsss: 2, lateralEntry: 9 },
      supernumeraryEnrolled: { tfw: 2, ews: 4, nriOciFn: 1, pmsss: 1, lateralEntry: 5 },
      utilizationPct: 77.8,
      status: "NORMAL",
      lastAuditTimestamp: "2024-09-02T10:00:00Z",
    },
    {
      id: "COURSE-TCAE-DS",
      institutionId: "INST-TCAE",
      code: "BTECH-DS",
      name: "B.Tech Data Science",
      degreeLevel: "UNDERGRADUATE",
      academicYear: "2024-25",
      approvedCapacity: 60,
      activeEnrolment: 54,
      supernumeraryLimits: { tfw: 3, ews: 6, nriOciFn: 9, pmsss: 2, lateralEntry: 6 },
      supernumeraryEnrolled: { tfw: 3, ews: 5, nriOciFn: 3, pmsss: 1, lateralEntry: 4 },
      utilizationPct: 90.0,
      status: "WARNING",
      lastAuditTimestamp: "2024-09-14T15:20:00Z",
    },
    {
      id: "COURSE-RIPE-CIVIL",
      institutionId: "INST-RIPE",
      code: "BTECH-CIVIL",
      name: "B.Tech Civil Engineering",
      degreeLevel: "UNDERGRADUATE",
      academicYear: "2024-25",
      approvedCapacity: 60,
      activeEnrolment: 42,
      supernumeraryLimits: { tfw: 3, ews: 6, nriOciFn: 9, pmsss: 2, lateralEntry: 6 },
      supernumeraryEnrolled: { tfw: 1, ews: 2, nriOciFn: 0, pmsss: 0, lateralEntry: 3 },
      utilizationPct: 70.0,
      status: "NORMAL",
      lastAuditTimestamp: "2024-09-04T11:45:00Z",
    },
  ];

  // 3. 150+ Synthetic Students with realistic Indian names and distinct scenarios
  const firstNames = [
    "Aarav", "Priya", "Rohan", "Ananya", "Vikram", "Neha", "Aditya", "Ishaan",
    "Sanya", "Kabir", "Meera", "Arjun", "Diya", "Siddharth", "Tanvi", "Rahul",
    "Pooja", "Varun", "Rhea", "Manish", "Divya", "Karan", "Sneha", "Nikhil",
    "Kavya", "Akash", "Swati", "Gaurav", "Anjali", "Harsh"
  ];
  const lastNames = [
    "Sharma", "Nair", "Kulkarni", "Iyer", "Rathore", "Verma", "Patel", "Gupta",
    "Reddy", "Banerjee", "Singh", "Chopra", "Deshmukh", "Menon", "Joshi", "Bose",
    "Mishra", "Pillai", "Choudhury", "Bhatnagar", "Mehta", "Sen", "Yadav", "Ghosh"
  ];

  const students: Student[] = [];

  // Anchor Student 1: Aarav Sharma (Key demo student for APAAR verify, Credential Issue, Consent flow)
  students.push({
    id: "STU-1001",
    apaarId: "9842-1234-5678",
    apaarNormalized: "984212345678",
    institutionalStudentId: "DITS-2024-CSE-001",
    fullName: "Aarav Sharma",
    dob: "2003-05-14",
    gender: "MALE",
    category: "GENERAL",
    seatCategory: "SANCTIONED_OPEN",
    nriStatus: false,
    ociStatus: false,
    foreignNational: false,
    institutionId: "INST-DITS",
    courseId: "COURSE-DITS-CSE",
    academicYear: "2024-25",
    admissionDate: "2024-07-15",
    programmeMode: "FULL_TIME",
    enrolmentStatus: "ACTIVE",
    apaarStatus: "REGISTRY_MATCH",
    apaarVerifiedAt: "2024-07-20T10:00:00Z",
    supportingDocHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    supportingDocName: "Aarav_Sharma_Class12_Certificate.pdf",
    lastUpdated: "2024-07-20T10:00:00Z",
  });

  // Anchor Student 2: Sameer Deshmukh (Concurrent Duplicate Anchor at MITR)
  // Has same APAAR as Aarav Sharma to trigger cross-institution duplicate alert!
  students.push({
    id: "STU-1002",
    apaarId: "9842-1234-5678",
    apaarNormalized: "984212345678",
    institutionalStudentId: "MITR-2024-CSE-089",
    fullName: "Aarav Sharma",
    dob: "2003-05-14",
    gender: "MALE",
    category: "GENERAL",
    seatCategory: "SANCTIONED_OPEN",
    nriStatus: false,
    ociStatus: false,
    foreignNational: false,
    institutionId: "INST-MITR",
    courseId: "COURSE-MITR-CSE", // Course with 108% over-intake
    academicYear: "2024-25",
    admissionDate: "2024-07-22",
    programmeMode: "FULL_TIME",
    enrolmentStatus: "ACTIVE",
    apaarStatus: "REGISTRY_MATCH",
    apaarVerifiedAt: "2024-07-23T11:30:00Z",
    supportingDocHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    supportingDocName: "Aarav_Sharma_Transfer_Cert.pdf",
    lastUpdated: "2024-07-23T11:30:00Z",
  });

  // Anchor Student 3: Priya Nair (Legitimate sequence anchor: B.Tech completed -> M.Tech)
  students.push({
    id: "STU-1003",
    apaarId: "7621-4589-2314",
    apaarNormalized: "762145892314",
    institutionalStudentId: "KNIE-2020-CSE-045",
    fullName: "Priya Nair",
    dob: "2002-11-20",
    gender: "FEMALE",
    category: "OBC",
    seatCategory: "TFW",
    nriStatus: false,
    ociStatus: false,
    foreignNational: false,
    institutionId: "INST-KNIE",
    courseId: "COURSE-KNIE-AIML",
    academicYear: "2020-24",
    admissionDate: "2020-08-01",
    programmeMode: "FULL_TIME",
    enrolmentStatus: "COMPLETED",
    apaarStatus: "REGISTRY_MATCH",
    apaarVerifiedAt: "2020-08-05T09:00:00Z",
    lastUpdated: "2024-06-30T17:00:00Z",
  });

  students.push({
    id: "STU-1004",
    apaarId: "7621-4589-2314",
    apaarNormalized: "762145892314",
    institutionalStudentId: "VEA-2024-ECE-012",
    fullName: "Priya Nair",
    dob: "2002-11-20",
    gender: "FEMALE",
    category: "OBC",
    seatCategory: "SANCTIONED_OPEN",
    nriStatus: false,
    ociStatus: false,
    foreignNational: false,
    institutionId: "INST-VEA",
    courseId: "COURSE-VEA-ECE",
    academicYear: "2024-25",
    admissionDate: "2024-07-28",
    programmeMode: "FULL_TIME",
    enrolmentStatus: "ACTIVE",
    apaarStatus: "REGISTRY_MATCH",
    apaarVerifiedAt: "2024-08-01T14:10:00Z",
    lastUpdated: "2024-08-01T14:10:00Z",
  });

  // Anchor Student 5: Devendra Patel (Name / DOB Mismatch Scenario)
  students.push({
    id: "STU-1005",
    apaarId: "9012-3456-7812",
    apaarNormalized: "901234567812",
    institutionalStudentId: "GTC-2024-IT-033",
    fullName: "Devendra K Patel", // Mismatched spelling vs registry "Devendra Patel"
    dob: "2003-03-28", // Mismatched date vs registry "2003-03-25"
    gender: "MALE",
    category: "OBC",
    seatCategory: "SANCTIONED_OPEN",
    nriStatus: false,
    ociStatus: false,
    foreignNational: false,
    institutionId: "INST-GTC",
    courseId: "COURSE-GTC-IT",
    academicYear: "2024-25",
    admissionDate: "2024-07-22",
    programmeMode: "FULL_TIME",
    enrolmentStatus: "ACTIVE",
    apaarStatus: "DOB_MISMATCH",
    lastUpdated: "2024-07-22T16:00:00Z",
  });

  // Anchor Student 6: Identity Not Found in simulated registry
  students.push({
    id: "STU-1006",
    apaarId: "4444-5555-6666",
    apaarNormalized: "444455556666",
    institutionalStudentId: "RIPE-2024-CIV-007",
    fullName: "Karan Johar",
    dob: "2003-09-12",
    gender: "MALE",
    category: "GENERAL",
    seatCategory: "SANCTIONED_OPEN",
    nriStatus: false,
    ociStatus: false,
    foreignNational: false,
    institutionId: "INST-RIPE",
    courseId: "COURSE-RIPE-CIVIL",
    academicYear: "2024-25",
    admissionDate: "2024-08-02",
    programmeMode: "FULL_TIME",
    enrolmentStatus: "ACTIVE",
    apaarStatus: "IDENTITY_NOT_FOUND",
    lastUpdated: "2024-08-02T11:00:00Z",
  });

  // Procedurally generate 150+ realistic students across courses & institutions
  let stuCounter = 1007;
  for (let instIdx = 0; instIdx < institutions.length; instIdx++) {
    const inst = institutions[instIdx];
    const instCourses = courses.filter((c) => c.institutionId === inst.id);
    const assignedCourse = instCourses.length > 0 ? instCourses[0] : courses[0];

    const countForInst = inst.id === "INST-MITR" ? 22 : 12;

    for (let k = 0; k < countForInst; k++) {
      const fn = firstNames[(stuCounter * 7) % firstNames.length];
      const ln = lastNames[(stuCounter * 11) % lastNames.length];
      const birthYear = 2002 + ((stuCounter + k) % 3);
      const birthMonth = String(((stuCounter * 3) % 12) + 1).padStart(2, "0");
      const birthDay = String(((stuCounter * 5) % 27) + 1).padStart(2, "0");
      
      // Generate deterministic 12-digit APAAR with valid check digit
      const prefix = String(30000000000 + stuCounter * 137).slice(0, 11);
      // Calculate Luhn check digit
      let sum = 0;
      for (let i = 0; i < 11; i++) {
        let d = parseInt(prefix.charAt(i), 10);
        if (i % 2 === 0) {
          d *= 2;
          if (d > 9) d -= 9;
        }
        sum += d;
      }
      const checkDigit = (10 - (sum % 10)) % 10;
      const normalizedApaar = `${prefix}${checkDigit}`;

      const seatCategories: Student["seatCategory"][] = [
        "SANCTIONED_OPEN", "SANCTIONED_OPEN", "SANCTIONED_OPEN", "TFW", "EWS",
        "PMSSS", "NRI_OCI_FN", "LATERAL_ENTRY"
      ];
      const seatCat = seatCategories[stuCounter % seatCategories.length];

      students.push({
        id: `STU-${stuCounter}`,
        apaarId: formatApaarId(normalizedApaar),
        apaarNormalized: normalizedApaar,
        institutionalStudentId: `${inst.id.replace("INST-", "")}-2024-${assignedCourse.code.slice(6)}-${String(k + 1).padStart(3, "0")}`,
        fullName: `${fn} ${ln}`,
        dob: `${birthYear}-${birthMonth}-${birthDay}`,
        gender: k % 3 === 0 ? "FEMALE" : "MALE",
        category: k % 4 === 0 ? "OBC" : k % 5 === 0 ? "SC" : k % 6 === 0 ? "EWS" : "GENERAL",
        seatCategory: seatCat,
        nriStatus: seatCat === "NRI_OCI_FN",
        ociStatus: false,
        foreignNational: false,
        institutionId: inst.id,
        courseId: assignedCourse.id,
        academicYear: "2024-25",
        admissionDate: "2024-07-20",
        programmeMode: "FULL_TIME",
        enrolmentStatus: "ACTIVE",
        apaarStatus: stuCounter % 15 === 0 ? "IDENTITY_NOT_FOUND" : "REGISTRY_MATCH",
        apaarVerifiedAt: "2024-07-25T10:00:00Z",
        lastUpdated: "2024-07-25T10:00:00Z",
      });

      stuCounter++;
    }
  }

  // 4. Duplicate Cases
  const duplicates: DuplicateCase[] = [
    {
      id: "DUP-CASE-1001",
      apaarId: "9842-1234-5678",
      apaarNormalized: "984212345678",
      studentName: "Aarav Sharma",
      institutionAId: "INST-DITS",
      institutionBId: "INST-MITR",
      courseAId: "COURSE-DITS-CSE",
      courseBId: "COURSE-MITR-CSE",
      programmeModeA: "FULL_TIME",
      programmeModeB: "FULL_TIME",
      academicYearA: "2024-25",
      academicYearB: "2024-25",
      admissionDateA: "2024-07-15",
      admissionDateB: "2024-07-22",
      statusA: "ACTIVE",
      statusB: "ACTIVE",
      conflictType: "CONCURRENT_FULL_TIME",
      confidenceScore: 98,
      ruleTriggered: "AICTE Norms Sec 4.3: Prohibition of Simultaneous Full-Time Regular Degrees in Separate Institutions",
      reviewStatus: "OPEN",
      investigationHistory: [
        {
          timestamp: "2024-08-01T09:15:00Z",
          actor: "AICTE_AUTOMATED_DETECTOR",
          action: "FLAGGED_INSPECTION",
          notes: "Identical APAAR detected in concurrent Full-Time B.Tech programmes in Delhi and Pune.",
        },
      ],
    },
    {
      id: "DUP-CASE-1002",
      apaarId: "7621-4589-2314",
      apaarNormalized: "762145892314",
      studentName: "Priya Nair",
      institutionAId: "INST-KNIE",
      institutionBId: "INST-VEA",
      courseAId: "COURSE-KNIE-AIML",
      courseBId: "COURSE-VEA-ECE",
      programmeModeA: "FULL_TIME",
      programmeModeB: "FULL_TIME",
      academicYearA: "2020-24",
      academicYearB: "2024-25",
      admissionDateA: "2020-08-01",
      admissionDateB: "2024-07-28",
      statusA: "COMPLETED",
      statusB: "ACTIVE",
      conflictType: "HISTORICAL_SEQUENCE",
      confidenceScore: 10,
      ruleTriggered: "Legitimate Academic Progression",
      reviewStatus: "RESOLVED_LEGITIMATE",
      assignedReviewer: "Dr. K. S. Raman (AICTE Evaluation Officer)",
      resolutionReason: "Verified degree completion certificate from KNIE. Normal progression to higher study at VEA.",
      investigationHistory: [
        {
          timestamp: "2024-08-02T11:00:00Z",
          actor: "AICTE_AUTOMATED_DETECTOR",
          action: "SYSTEM_CHECK",
          notes: "Sequential enrolments detected.",
        },
        {
          timestamp: "2024-08-03T14:20:00Z",
          actor: "Dr. K. S. Raman",
          action: "RESOLVED_LEGITIMATE",
          notes: "Prior course marked COMPLETED with provisional degree certificate verified.",
        },
      ],
    },
  ];

  // 5. Digital Credentials with Cryptographic Signatures
  const aaravCredPayload: StudentCredential["payload"] = {
    studentId: "STU-1001",
    studentName: "Aarav Sharma",
    maskedApaar: "••••-••••-5678",
    institutionalStudentId: "DITS-2024-CSE-001",
    institutionName: "Delhi Institute of Technology & Science",
    courseName: "B.Tech Computer Science & Engineering",
    academicYear: "2024-25",
    cgpa: 9.12,
    completionStatus: "ENROLLED_AUTHENTIC",
  };
  const aaravSignature = signCredentialPayload(aaravCredPayload);

  // Revoked credential scenario
  const revokedCredPayload: StudentCredential["payload"] = {
    studentId: "STU-1006",
    studentName: "Karan Johar",
    maskedApaar: "••••-••••-6666",
    institutionalStudentId: "RIPE-2024-CIV-007",
    institutionName: "Rajasthan Institute of Polytech & Engg",
    courseName: "B.Tech Civil Engineering",
    academicYear: "2024-25",
    completionStatus: "REVOKED_DOCUMENT_ANOMALY",
  };
  const revokedSignature = signCredentialPayload(revokedCredPayload);

  const credentials: StudentCredential[] = [
    {
      id: "CRED-VS-2024-9842",
      studentId: "STU-1001",
      credentialNumber: "VS-CRED-2024-9842",
      issuingInstitutionId: "INST-DITS",
      courseId: "COURSE-DITS-CSE",
      academicYear: "2024-25",
      issueDate: "2024-08-10T10:00:00Z",
      expiryDate: "2028-06-30T23:59:59Z",
      status: "ACTIVE",
      payload: aaravCredPayload,
      signature: aaravSignature,
    },
    {
      id: "CRED-VS-2024-4444",
      studentId: "STU-1006",
      credentialNumber: "VS-CRED-2024-4444",
      issuingInstitutionId: "INST-RIPE",
      courseId: "COURSE-RIPE-CIVIL",
      academicYear: "2024-25",
      issueDate: "2024-08-12T11:00:00Z",
      expiryDate: "2028-06-30T23:59:59Z",
      status: "REVOKED",
      revocationReason: "Identity document anomaly detected in AICTE PDF forensics audit",
      revokedAt: "2024-08-20T16:30:00Z",
      revokedBy: "AICTE Regulatory Directorate",
      payload: revokedCredPayload,
      signature: revokedSignature,
    },
  ];

  // 6. Employer Consent Request
  const consentRequests: ConsentRequest[] = [
    {
      id: "CONSENT-REQ-901",
      credentialId: "CRED-VS-2024-9842",
      studentId: "STU-1001",
      requestingEmployer: "Tata Consultancy Services — Background Verification Directorate",
      purpose: "Pre-employment verification of academic credentials and AICTE enrolment authenticity",
      requestedFields: ["courseName", "academicYear", "completionStatus", "institutionName"],
      status: "PENDING",
      requestedAt: "2024-09-18T10:30:00Z",
      expiresAt: "2024-09-25T23:59:59Z",
      otpChallenge: {
        code: "849201",
        expiresAt: "2024-09-25T23:59:59Z",
        attemptsRemaining: 3,
      },
    },
  ];

  // 7. Forensic Documents (Seeded Exact Duplicates & Visually Similar Pairs)
  const docTextAarav = "CENTRAL BOARD OF SECONDARY EDUCATION SENIOR SCHOOL CERTIFICATE EXAMINATION 2024 ROLL NO 12345678 AARAV SHARMA PHYSICS 95 CHEMISTRY 94 MATHEMATICS 98 ENGLISH 92 PASS";
  const docTextDuplicate = "CENTRAL BOARD OF SECONDARY EDUCATION SENIOR SCHOOL CERTIFICATE EXAMINATION 2024 ROLL NO 12345678 AARAV SHARMA PHYSICS 95 CHEMISTRY 94 MATHEMATICS 98 ENGLISH 92 PASS";
  const docTextAltered = "CENTRAL BOARD OF SECONDARY EDUCATION SENIOR SCHOOL CERTIFICATE EXAMINATION 2024 ROLL NO 12345678 SAMEER DESHMUKH PHYSICS 95 CHEMISTRY 94 MATHEMATICS 98 ENGLISH 92 PASS";

  const shaExact = sha256(docTextAarav);
  const pHashA = computePerceptualHash(docTextAarav);
  const pHashAltered = computePerceptualHash(docTextAltered);

  const forensicDocuments: ForensicDocument[] = [
    {
      id: "FORENSIC-DOC-01",
      studentId: "STU-1001",
      studentName: "Aarav Sharma",
      institutionId: "INST-DITS",
      fileName: "CBSE_Class12_Certificate_Aarav.pdf",
      fileSizeBytes: 245120,
      fileSha256: shaExact,
      perceptualHash: pHashA,
      pageCount: 1,
      uploadedAt: "2024-07-15T14:00:00Z",
      extractedText: docTextAarav,
      metadata: {
        creator: "Acrobat PDF Maker 24",
        producer: "Adobe PDF Library 24.1",
        creationDate: "2024-05-20T10:00:00Z",
        modifiedDate: "2024-05-20T10:00:00Z",
        title: "CBSE Certificate 2024",
      },
      findings: [
        {
          type: "CLEAN",
          severity: "LOW",
          explanation: "Original authentic digital upload.",
        },
      ],
      reviewStatus: "VERIFIED_LEGITIMATE",
    },
    // Exact byte duplicate uploaded by different applicant
    {
      id: "FORENSIC-DOC-02",
      studentId: "STU-1002",
      studentName: "Sameer Deshmukh",
      institutionId: "INST-MITR",
      fileName: "CBSE_Class12_Certificate_Copy.pdf",
      fileSizeBytes: 245120,
      fileSha256: shaExact,
      perceptualHash: pHashA,
      pageCount: 1,
      uploadedAt: "2024-07-22T16:00:00Z",
      extractedText: docTextDuplicate,
      metadata: {
        creator: "Acrobat PDF Maker 24",
        producer: "Adobe PDF Library 24.1",
        creationDate: "2024-05-20T10:00:00Z",
        modifiedDate: "2024-05-20T10:00:00Z",
        title: "CBSE Certificate 2024",
      },
      findings: [
        {
          type: "EXACT_DUPLICATE",
          severity: "CRITICAL",
          matchedDocId: "FORENSIC-DOC-01",
          matchedFileName: "CBSE_Class12_Certificate_Aarav.pdf",
          similarityScore: 100,
          explanation: "Exact cryptographic SHA-256 match detected. Identical PDF bytes submitted under separate applicant in another state.",
        },
      ],
      reviewStatus: "CONFIRMED_ANOMALY",
      reviewerNotes: "Confirmed byte match with STU-1001 file. Flagged for institutional inquiry.",
    },
    // Visually similar / template reused document
    {
      id: "FORENSIC-DOC-03",
      studentId: "STU-1005",
      studentName: "Devendra Patel",
      institutionId: "INST-RIPE",
      fileName: "Higher_Secondary_Marksheet_Scanned.pdf",
      fileSizeBytes: 248900,
      fileSha256: sha256(docTextAltered),
      perceptualHash: pHashAltered,
      pageCount: 1,
      uploadedAt: "2024-08-05T12:00:00Z",
      extractedText: docTextAltered,
      metadata: {
        creator: "Scanner Utility v3",
        producer: "Ghostscript 9.5",
        creationDate: "2024-07-10T12:00:00Z",
        modifiedDate: "2024-07-09T08:00:00Z", // Suspicious: modified earlier than created
        title: "Scan0042",
      },
      findings: [
        {
          type: "TEXT_TAMPER_SUSPECTED",
          severity: "HIGH",
          matchedDocId: "FORENSIC-DOC-01",
          matchedFileName: "CBSE_Class12_Certificate_Aarav.pdf",
          similarityScore: 88,
          explanation: "High visual layout similarity (88%) to known certificate template, but applicant name and registration tokens show text discrepancy.",
        },
        {
          type: "METADATA_ANOMALY",
          severity: "LOW",
          explanation: "Modified timestamp is earlier than creation timestamp.",
        },
      ],
      reviewStatus: "FLAGGED",
      reviewerNotes: "Awaiting physical certificate inspection by AICTE verification wing.",
    },
  ];

  // 8. Cryptographic Hash-Chained Audit Trail
  const initialAuditEvents: Omit<AuditEvent, "currentHash">[] = [
    {
      id: "EVT-001",
      eventNumber: 1,
      timestamp: "2024-07-01T00:00:00Z",
      actorId: "AICTE-SYS-ROOT",
      actorRole: "AICTE_ADMIN",
      actorName: "AICTE Genesis Engine",
      actionType: "GENESIS_INITIALIZATION",
      targetEntity: "AICTE_PLATFORM",
      targetReference: "VIDYA-SETU-ROOT",
      result: "SUCCESS",
      metadata: { version: "1.0.0", standard: "AICTE APH 2024-25", genesis: true },
      previousHash: GENESIS_HASH,
    },
    {
      id: "EVT-002",
      eventNumber: 2,
      timestamp: "2024-07-10T09:00:00Z",
      actorId: "INST-DITS-ADMIN",
      actorRole: "INSTITUTION_ADMIN",
      actorName: "Dr. S. K. Gupta (DITS Registrar)",
      institutionId: "INST-DITS",
      actionType: "APPROVED_INTAKE_CONFIRMED",
      targetEntity: "COURSE_ALLOTMENT",
      targetReference: "COURSE-DITS-CSE",
      result: "SUCCESS",
      metadata: { approvedCapacity: 120, academicYear: "2024-25" },
      previousHash: "", // to be filled in loop
    },
    {
      id: "EVT-003",
      eventNumber: 3,
      timestamp: "2024-07-15T10:05:00Z",
      actorId: "INST-DITS-ADMIN",
      actorRole: "INSTITUTION_ADMIN",
      actorName: "Dr. S. K. Gupta (DITS Registrar)",
      institutionId: "INST-DITS",
      actionType: "STUDENT_ENROLMENT_CREATED",
      targetEntity: "STUDENT_RECORD",
      targetReference: "STU-1001",
      result: "SUCCESS",
      metadata: { studentName: "Aarav Sharma", apaarId: "9842-1234-5678", seatCategory: "SANCTIONED_OPEN" },
      previousHash: "",
    },
    {
      id: "EVT-004",
      eventNumber: 4,
      timestamp: "2024-07-20T10:00:00Z",
      actorId: "AICTE-SYS-VAL",
      actorRole: "AICTE_ADMIN",
      actorName: "AICTE APAAR Gateway Simulator",
      actionType: "APAAR_REGISTRY_VERIFICATION",
      targetEntity: "STUDENT_IDENTITY",
      targetReference: "STU-1001",
      result: "SUCCESS",
      metadata: { outcome: "REGISTRY_MATCH", luhnChecksumValid: true },
      previousHash: "",
    },
    {
      id: "EVT-005",
      eventNumber: 5,
      timestamp: "2024-07-22T16:05:00Z",
      actorId: "INST-MITR-ADMIN",
      actorRole: "INSTITUTION_ADMIN",
      actorName: "Prof. V. N. Joshi (MITR Registrar)",
      institutionId: "INST-MITR",
      actionType: "STUDENT_ENROLMENT_CREATED",
      targetEntity: "STUDENT_RECORD",
      targetReference: "STU-1002",
      result: "SUCCESS",
      metadata: { studentName: "Aarav Sharma", courseId: "COURSE-MITR-CSE" },
      previousHash: "",
    },
    {
      id: "EVT-006",
      eventNumber: 6,
      timestamp: "2024-07-23T11:35:00Z",
      actorId: "AICTE-SYS-SEC",
      actorRole: "AICTE_ADMIN",
      actorName: "AICTE Duplicate Detector Service",
      actionType: "DUPLICATE_ENROLMENT_FLAGGED",
      targetEntity: "DUPLICATE_CASE",
      targetReference: "DUP-CASE-1001",
      result: "SUCCESS",
      metadata: { conflictType: "CONCURRENT_FULL_TIME", confidenceScore: 98 },
      previousHash: "",
    },
    {
      id: "EVT-007",
      eventNumber: 7,
      timestamp: "2024-08-10T10:00:00Z",
      actorId: "INST-DITS-ADMIN",
      actorRole: "INSTITUTION_ADMIN",
      actorName: "Dr. S. K. Gupta",
      institutionId: "INST-DITS",
      actionType: "DIGITAL_CREDENTIAL_ISSUED",
      targetEntity: "STUDENT_CREDENTIAL",
      targetReference: "CRED-VS-2024-9842",
      result: "SUCCESS",
      metadata: { algorithm: "HMAC-SHA256", keyId: "aicte-vidya-root-key-2024" },
      previousHash: "",
    },
    {
      id: "EVT-008",
      eventNumber: 8,
      timestamp: "2024-09-15T16:45:00Z",
      actorId: "AICTE-SYS-INTAKE",
      actorRole: "AICTE_ADMIN",
      actorName: "Live Intake Guard Monitor",
      actionType: "INTAKE_BREACH_DETECTED",
      targetEntity: "COURSE_CAPACITY",
      targetReference: "COURSE-MITR-CSE",
      result: "SUCCESS",
      metadata: { approvedCapacity: 100, activeEnrolment: 108, utilizationPct: 108.0, excessSeats: 8 },
      previousHash: "",
    },
  ];

  // Sequentially link hashes
  const auditEvents: AuditEvent[] = [];
  let prevHash = GENESIS_HASH;
  for (let idx = 0; idx < initialAuditEvents.length; idx++) {
    const raw = initialAuditEvents[idx];
    const eventWithoutHash = { ...raw, previousHash: prevHash };
    const currHash = computeAuditEventHash(eventWithoutHash);
    const completeEvent: AuditEvent = { ...eventWithoutHash, currentHash: currHash };
    auditEvents.push(completeEvent);
    prevHash = currHash;
  }

  return {
    institutions,
    courses,
    students,
    duplicates,
    credentials,
    consentRequests,
    forensicDocuments,
    auditEvents,
  };
}
