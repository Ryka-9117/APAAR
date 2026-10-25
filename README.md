# VIDYA Setu (विद्या सेतु)
### AICTE APAAR Student Intelligence & Verification Platform
> **“One Academic Identity. Trusted Records. Transparent Governance.”**

---

> [!IMPORTANT]
> **DEMO ENVIRONMENT DISCLAIMER**  
> All student identities, institutions, verification responses, and records displayed in this platform are simulated for demonstration purposes. This system does not connect to real AICTE or Ministry of Education production databases.

---

## 1. Executive Summary & Mission
**VIDYA Setu** is an enterprise-grade academic identity, student verification, and regulatory governance platform developed for the **All India Council for Technical Education (AICTE)**. Built around the national **APAAR (Automated Permanent Academic Account Registry)** identifier, VIDYA Setu addresses critical national higher-education governance challenges:

1. **Authentic Student Records**: Single source of truth for student enrolment across AICTE-approved institutions.
2. **AICTE APH Live Intake Guard**: Strict enforcement of approved institutional intake capacities and transparent separation of sanctioned seats from supernumerary quotas (TFW 5%, EWS 10%, PMSSS, NRI/OCI/FN 15%, Lateral Entry 10%) per the AICTE Approval Process Handbook (APH).
3. **Cross-Institution Duplicate Enrolment Detection**: Automated identification of simultaneous active full-time degree enrolments (violating AICTE Norms Section 4.3 and UGC guidelines) vs legitimate academic progression.
4. **Digital Credential Authenticity**: Cryptographically signed academic credentials using server-side HMAC-SHA256 signatures, verifiable via minimal public QR codes that leak **zero personal PII**.
5. **Consent-Based Employer Verification**: Time-limited verification requests authorized by students via simulated 6-digit OTP challenges, returning purpose-restricted verification responses.
6. **Digital Forensics for Uploaded PDFs**: Multi-layered PDF verification combining SHA-256 exact byte hashing, 16-bit perceptual layout block difference hashing (pHash), and side-by-side text diffing.
7. **Tamper-Evident SHA-256 Audit Trail**: Cryptographically chained audit log tracking every regulatory action, with an interactive demo tamper simulator demonstrating instant breach detection.

---

## 2. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | Next.js 15.1.7 (App Router, Server-Side Route Handlers, TypeScript) |
| **Styling & Design** | Tailwind CSS with AICTE Palette (Deep Navy `#10233F`, Primary Blue `#2457D6`, Teal `#0F9F95`, Background `#F4F7FB`) |
| **Icons & Visuals** | Zero-dependency native SVG icon engine (`src/components/icons.tsx`), pure SVG QR renderer, custom Indian State Heatmap |
| **Data Ingestion** | PapaParse CSV streaming parser with custom spreadsheet spell-checker pre-import validator |
| **Cryptography** | Node.js `crypto` (SHA-256, HMAC-SHA256, Canonical JSON Stringification, Luhn-10 Checksum) |
| **State Persistence** | Reactive singleton store (`VidyaSetuStore`) with atomic file persistence (`data/store.json`) and demo seed reset |
| **Testing** | Automated acceptance test suite running via `npx tsx scripts/test-acceptance.ts` (59/59 passing) |

---

## 3. Quickstart & Installation

### Prerequisites
- Node.js `v18.0.0` or higher (Tested on `v24.21.0`)
- npm `v9.0.0` or higher (Tested on `v11.19.0`)

### Installation & Run Steps
```bash
# 1. Clone or navigate to the repository
cd C:\Users\Admin\.gemini\antigravity-ide\scratch\vidya-setu

# 2. Run the automated test suite
npm run test:acceptance
# Expected output: ACCEPTANCE TEST RESULTS: 59 PASSED, 0 FAILED

# 3. Build the production application
npm run build

# 4. Start the production server
npm run start
# Server starts at http://localhost:3000

# Alternatively, for local development:
npm run dev
```

---

## 4. Acceptance Test Results
The automated acceptance test suite (`scripts/test-acceptance.ts`) directly verifies all core business rules against Section 25 of the Master Specification:

```
=============================================================
VIDYA Setu - AICTE APAAR Platform Acceptance Verification
=============================================================

[1] APAAR Identifier & Mock Registry Tests
  ✓ PASS: Valid 12-digit APAAR with calculated Luhn checksum passes format validation
  ✓ PASS: Seeded test APAAR passes format validation
  ✓ PASS: Malformed format is rejected
  ✓ PASS: Invalid Luhn checksum is rejected
  ✓ PASS: APAAR masking hides first 8 digits correctly: ••••-••••-5678
  ✓ PASS: Known identity with matching Name & DOB returns REGISTRY_MATCH
  ✓ PASS: Valid checksum APAAR not in registry returns IDENTITY_NOT_FOUND
  ✓ PASS: Identity with mismatched name returns NAME_MISMATCH
  ✓ PASS: Identity with mismatched DOB returns DOB_MISMATCH
  ✓ PASS: Malformed ID returns format failure outcome with isMatch=false
  ✓ PASS: Simulated gateway outage returns VERIFICATION_UNAVAILABLE

[2] AICTE APH Live Intake Guard Tests
  ✓ PASS: 72 enrolled out of 100 approved = 72% utilization
  ✓ PASS: 72% is categorized as NORMAL (< 90%)
  ✓ PASS: 92 enrolled out of 100 approved = 92% utilization
  ✓ PASS: 92% is categorized as WARNING (>= 90% and < 100%)
  ✓ PASS: 100 enrolled out of 100 approved = 100% utilization
  ✓ PASS: 100% is categorized as CAPACITY_REACHED
  ✓ PASS: 108 enrolled out of 100 approved = 108% utilization
  ✓ PASS: 108% is categorized as OVER_INTAKE
  ✓ PASS: Excess sanctioned seats calculation returns 8 excess seats
  ✓ PASS: Over-intake breach flagged with CRITICAL severity for AICTE regulatory action
  ✓ PASS: Sanctioned active enrolment strictly counts regular seats (72) and excludes supernumerary seats
  ✓ PASS: TFW quota is tracked separately (3 enrolled / 5 approved limit) without affecting sanctioned capacity denominator

[3] AICTE Cross-Institution Duplicate Enrolment Detector
  ✓ PASS: Concurrent full-time enrolment across 2 institutions triggers conflict alert
  ✓ PASS: Conflict type classified as CONCURRENT_FULL_TIME
  ✓ PASS: High confidence score (98%) assigned to dual active full-time degrees
  ✓ PASS: Conflict flagged as actionable for human investigator review
  ✓ PASS: Historical completed enrolment is NOT flagged as conflict
  ✓ PASS: Legitimate academic progression identified as HISTORICAL_SEQUENCE
  ✓ PASS: Permissible dual learning (Full-Time + Part-Time/Online under UGC norms) is not treated as violation
  ✓ PASS: Combination classified as PART_TIME_DUAL

[4] Cryptographic Credentials & QR Verification
  ✓ PASS: Generated HMAC-SHA256 signature is exactly 64 hex characters
  ✓ PASS: Valid credential payload and signature verify successfully
  ✓ PASS: Tampered payload with altered academic year fails HMAC-SHA256 signature verification
  ✓ PASS: Revoked credential fails verification check
  ✓ PASS: Verification failure response explicitly documents revocation
  ✓ PASS: Public verification payload does NOT contain full APAAR ID
  ✓ PASS: Public verification payload does NOT contain Student Date of Birth

[5] Tamper-Evident SHA-256 Audit Trail & Tamper Simulator
  ✓ PASS: Valid audit chain passes cryptographic verification
  ✓ PASS: All 2 chained events verified
  ✓ PASS: Tampered event in audit chain is caught by SHA-256 chain verification
  ✓ PASS: Broken link correctly identified at tamper location

[6] PDF Forensics & Perceptual Layout Analysis
  ✓ PASS: Identical PDF byte buffers produce identical SHA-256 hash
  ✓ PASS: Different PDF contents produce distinct SHA-256 hashes
  ✓ PASS: Identical documents have 100% perceptual layout similarity

[7] Ingestion & Spreadsheet Spell-Checker
  ✓ PASS: All 3 rows parsed and evaluated
  ✓ PASS: First row with valid fields passes validation with status VALID
  ✓ PASS: Second row with bad APAAR and date receives status ERROR
  ✓ PASS: Third row with duplicate APAAR within file receives status ERROR
  ✓ PASS: Row 2: Bad APAAR flagged with precise field error and suggested fix
  ✓ PASS: Row 2: Invalid DOB flagged with precise field error and ISO date format suggestion
  ✓ PASS: Row 2: Unknown Institution flagged with precise field error
  ✓ PASS: Row 3: Duplicate APAAR inside the same upload file caught by batch deduplicator

[8] Consent-Based Employer Verification Flow
  ✓ PASS: Simulated OTP challenge has 6 digits
  ✓ PASS: Initial consent status is PENDING
  ✓ PASS: Approved consent updates status to APPROVED
  ✓ PASS: Approved consent generates a secure time-limited verification token
  ✓ PASS: Denied consent blocks access and generates no verification token
  ✓ PASS: Denied consent has no access token

=============================================================
ACCEPTANCE TEST RESULTS: 59 PASSED, 0 FAILED
=============================================================
```

---

## 5. End-to-End Demonstration Journey Guide

The application supports the full 9-step demonstration journey directly from the web interface at `http://localhost:3000`:

### Demo 1: Bulk Upload & Spreadsheet Spell-Checker
1. Navigate to **Bulk Data Upload** in the persistent sidebar.
2. Click **Load Demo Spreadsheet with Deliberate Errors** (or download the Blank CSV template).
3. Observe the row-by-row spell-checker:
   - Row 1: Valid student (`VALID`).
   - Row 2: Malformed APAAR ID, invalid date format, unknown institution (`ERROR`).
   - Row 3: Duplicate APAAR in the same upload file (`ERROR`).
4. Click **Import Valid Records Only** to safely commit valid rows without database corruption.

### Demo 2: Verify Academic Identity (APAAR)
1. Navigate to **Student Registry**.
2. Locate student **Aarav Sharma** (`STU-1001`, APAAR `9842-1234-5678`).
3. Click **Run APAAR Check** or click the row to open the inspection drawer.
4. Observe the simulated validation result: `REGISTRY_MATCH`, reference ID `MOCK-APAAR-REQ-XXXXXX`, simulated provider `MOCK_ACADEMIC_BANK_OF_CREDITS_SIMULATOR`, and recommended regulatory action.

### Demo 3: Live Intake Guard Breach (108%)
1. Navigate to **Intake Monitor**.
2. Locate **Pune Institute of Engineering & Management** — *B.Tech Mechanical Engineering*.
3. Observe: **108 Enrolled / 100 Approved Seats = 108% (`OVER_INTAKE`)**.
4. Click **Inspect Breach** to open the AICTE Regulatory Investigation Drawer, showing the 8 excess sanctioned seats, separate supernumerary quotas (TFW, EWS, NRI), and AICTE APH penalty classifications.

### Demo 4: Cross-Institution Duplicate Enrolment
1. Navigate to **Duplicate Enrolments**.
2. Inspect Case `DUP-2024-001` (**Karan Patel**, APAAR `••••-••••-9012`):
   - Institution A: *Delhi Institute of Technology & Science* (B.Tech CSE, Full-Time, Active).
   - Institution B: *Vellore Engineering Academy* (B.Tech IT, Full-Time, Active).
   - Rule: *AICTE Norms Sec 4.3: Prohibition of Simultaneous Full-Time Regular Degrees in Separate Institutions*. Confidence: 98%.
3. Record an investigation decision (e.g. `RESOLVED_DUPLICATE` or `UNDER_REVIEW`) and observe the automatic SHA-256 audit entry.

### Demo 5: Digital Credentials & QR Verification
1. Navigate to **Digital Credentials**.
2. Preview student **Aarav Sharma's** official digital certificate.
3. Observe the generated **HMAC-SHA256 digital signature** and QR code.
4. Click **Verify Public QR** to open the minimal public verification gateway.
5. Notice that the public verification confirms authenticity while leaking **zero sensitive PII** (no APAAR ID, no birthdate, no residential address).

### Demo 6: Consent-Based Employer Verification
1. Switch role to **STUDENT** via the role switcher in the top header.
2. Navigate to **Employer Verification**.
3. View the pending verification request from *Tata Consultancy Services Ltd*.
4. Click **Review & Authorize**.
5. The system generates a simulated 6-digit OTP challenge (`749201`). Enter the OTP and approve.
6. Switch role to **EMPLOYER_VERIFIER** and observe the limited verification response (Course, Academic Year, Status, Issuer). Full APAAR, DOB, and unrelated student data remain strictly concealed.

### Demo 7: PDF Forensics Workspace
1. Navigate to **PDF Forensics**.
2. View the gallery of uploaded supporting documents.
3. Observe the three distinct forensic classifications:
   - **Exact Duplicate** (`DOC-FOR-001` vs `DOC-FOR-002`): 100% SHA-256 byte match.
   - **Perceptual Layout Similarity** (`DOC-FOR-003`): 93% visual layout similarity with altered candidate text.
   - **Human Review Flagged**: Explains indicators without automated punitive action.

### Demo 8: Tamper-Evident Audit Trail & Tamper Simulator
1. Navigate to **Audit Trail**.
2. Verify that the SHA-256 hash-chain status displays: `Chain Cryptographically Verified (Valid: true)`.
3. Click **Simulate Malicious Tamper (Demo Test)**:
   - The system modifies an event payload in the middle of the chain.
   - Verification immediately fails, displaying the exact broken link and payload discrepancy.
4. Click **Restore Original Event (Heal Chain)** to restore chain integrity.

### Demo 9: National Executive Dashboard & State Heatmap
1. Return to **Overview**.
2. Explore the National KPI metrics (Total Approved Intake, Active Enrolment, Over-Intake breaches, Duplicate Alerts).
3. Click on states in the interactive **State Heatmap** (e.g. *Delhi*, *Tamil Nadu*, *Maharashtra*) to filter institutional data and capacity metrics.

---

## 6. Seed Data & Scenarios Summary

The database is deterministically seeded with:
- **12 Fictional Institutions** across 10 Indian states (Delhi, Tamil Nadu, Karnataka, Maharashtra, West Bengal, Telangana, Rajasthan, Gujarat, Punjab, Madhya Pradesh).
- **9 Representative Engineering Courses** demonstrating all critical AICTE APH capacity benchmarks:
  - `COURSE-DITS-MECH`: 72 / 100 = 72% (`NORMAL`)
  - `COURSE-KNIE-AIML`: 92 / 100 = 92% (`WARNING`)
  - `COURSE-VEA-ECE`: 100 / 100 = 100% (`CAPACITY_REACHED`)
  - `COURSE-PIEM-MECH`: 108 / 100 = 108% (`OVER_INTAKE` breach)
- **160+ Synthetic Student Identities** with realistic Indian names, distinct seat categories, and synthetic APAAR IDs.
- **2 Cross-Institution Duplicate Cases** (Concurrent active full-time breach vs permissible dual learning).
- **3 Seeded PDF Forensics Documents** (Exact SHA-256 duplicate, perceptual layout match, and human review case).
- **Chained SHA-256 Audit Trail** linked to genesis hash `0000...0000`.

---

## 7. Role-Based Access Control Matrix

| Capability | AICTE Super Admin | Institutional Admin | Authorized Verifier | Employer Verifier | Student |
| :--- | :---: | :---: | :---: | :---: | :---: |
| National Analytics & Heatmap | Yes | Scoped to own inst. | No | No | No |
| Intake Approval & Breach Monitor | Yes | Scoped to own inst. | No | No | No |
| Bulk CSV/XLSX Upload | Yes | Scoped to own inst. | No | No | No |
| Duplicate Enrolment Review | Yes | View own conflicts | No | No | No |
| Issue / Revoke Digital Credentials| Yes | Scoped to own inst. | No | No | No |
| Run Mock APAAR Verification | Yes | Yes | Yes | No | View own |
| Authorize Employer Consent | No | No | No | No | Yes |
| Inspect SHA-256 Audit Chain | Yes | Scoped | No | No | No |
| Run Tamper Simulator | Yes (Demo only) | No | No | No | No |

---

## 8. Mock Services & Production Replacement Specifications

All external integrations are designed around strict TypeScript provider interfaces, allowing seamless transition to production services without modifying UI or business logic:

| Service | Current Mock Implementation | Production Replacement Endpoint |
| :--- | :--- | :--- |
| **APAAR / ABC Registry** | `MockApaarVerificationProvider` (`src/lib/apaar.ts`) | Ministry of Education DigiLocker / ABC API via OAuth2 & mTLS |
| **Institution Registry** | Seeded AICTE institutions (`src/lib/seed.ts`) | AICTE National Portal REST API / National Institutional Ranking Framework |
| **Course & Intake Caps** | AICTE APH calculation engine (`src/lib/intake.ts`) | AICTE Approval Bureau Annual Approval Letter (EoA) Database |
| **Cryptographic Signer** | Server-side HMAC-SHA256 (`src/lib/crypto.ts`) | National Informatics Centre (NIC) eSign Service / Hardware Security Module (HSM) |
| **Employer OTP Delivery** | Simulated in-memory OTP challenge (`src/lib/types.ts`) | CDAC Mobile Seva SMS Gateway / National SMS Portal |
| **Document Forensics** | Node.js SHA-256 & Perceptual layout hash (`src/lib/forensics.ts`) | Tesseract OCR & OpenCV Python microservice via gRPC |

---

## 9. Security & Privacy Safeguards
1. **Zero-PII Public QR Verification**: Public QR scanning endpoints never reveal full APAAR numbers, student date of birth, home address, or category reservations.
2. **Deterministic APAAR Masking**: The first 8 digits of APAAR identifiers are masked (`••••-••••-9012`) in all general tables, logs, and public views.
3. **Cryptographic Tamper-Evidence**: Student academic credentials use HMAC-SHA256 signatures, and all regulatory events form an unbroken SHA-256 hash chain starting from a documented genesis block.
4. **Time-Limited Tokens**: Employer verification access tokens expire automatically after 24 hours.

---

## 10. AICTE Rule Compliance Reference
This platform strictly adheres to:
- **AICTE Approval Process Handbook (APH)**:
  - Clause 5.1 & 5.2: Sanctioned Intake vs Supernumerary Quotas (TFW 5%, EWS 10%, PMSSS, NRI/OCI/FN 15%, Lateral Entry 10%).
  - Clause 4.3: Prohibition of simultaneous regular full-time degrees in separate institutions.
  - Clause 6: Regulatory inspection, show-cause triggers, and penalty classifications for over-intake admissions.
- **UGC Guidelines 2022**: Permissible dual degree provisions (one regular full-time degree + one distance/online degree).
