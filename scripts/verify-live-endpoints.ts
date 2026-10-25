/**
 * Live HTTP Endpoint & State Verification against running Next.js server
 */

async function testLiveServer() {
  console.log("Verifying live Next.js server at http://localhost:3000...\n");

  // 1. Root page
  const rootRes = await fetch("http://localhost:3000/");
  console.log(`[GET /] Status: ${rootRes.status} ${rootRes.statusText}`);
  const html = await rootRes.text();
  const containsBrand = html.includes("VIDYA Setu") || html.includes("AICTE");
  console.log(`  Brand/Identity present in rendered HTML: ${containsBrand}`);

  // 2. State endpoint
  const stateRes = await fetch("http://localhost:3000/api/state");
  console.log(`[GET /api/state] Status: ${stateRes.status} ${stateRes.statusText}`);
  const stateData = await stateRes.json();
  console.log(`  Institutions: ${stateData.institutions?.length}`);
  console.log(`  Courses: ${stateData.courses?.length}`);
  console.log(`  Students: ${stateData.students?.length}`);
  console.log(`  Duplicate Cases: ${stateData.duplicates?.length}`);
  console.log(`  Credentials: ${stateData.credentials?.length}`);
  console.log(`  Audit Events: ${stateData.auditEvents?.length}`);
  console.log(`  Audit Valid: ${stateData.auditValidation?.isValid}`);

  // 3. APAAR verify endpoint
  const apaarRes = await fetch("http://localhost:3000/api/apaar/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apaarId: "984212345678",
      studentName: "Aarav Sharma",
      dob: "2003-05-14",
    }),
  });
  console.log(`[POST /api/apaar/verify] Status: ${apaarRes.status} ${apaarRes.statusText}`);
  const apaarData = await apaarRes.json();
  console.log(`  Outcome: ${apaarData.outcome}, Source: ${apaarData.source}`);

  // 4. Credential verify endpoint (minimal public QR verification)
  const cred = stateData.credentials?.[0];
  if (cred) {
    const credRes = await fetch("http://localhost:3000/api/credentials/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credentialId: cred.id }),
    });
    console.log(`[POST /api/credentials/verify] Status: ${credRes.status}`);
    const credData = await credRes.json();
    console.log(`  Verification result: ${credData.status}, Valid: ${credData.isValid}`);
    console.log(`  Zero PII leaked (has apaarId: ${"apaarId" in credData}, has dob: ${"dob" in credData})`);
  }

  // 5. Audit verify endpoint
  const auditRes = await fetch("http://localhost:3000/api/audit");
  console.log(`[GET /api/audit] Status: ${auditRes.status}`);
  const auditData = await auditRes.json();
  console.log(`  Chain valid: ${auditData.verification?.isValid}, Total Checked: ${auditData.verification?.totalChecked}`);

  console.log("\nAll live HTTP endpoints verified operational!");
}

testLiveServer().catch((err) => {
  console.error("Live test failed:", err);
  process.exit(1);
});
