import { describe, expect, it } from "vitest";
import type { JobRecord } from "@/lib/domain/job-types";
import { resolveMdsgChain } from "@/lib/domain/mdsg-resolver";
import { applyJobTransition } from "@/lib/domain/workflow-transitions";

function baseJob(pattern = 4): JobRecord {
  return {
    id: "J1",
    jobCode: "J1001",
    pi: "PI-2611-010",
    piDate: "2026-11-02",
    bu: "TWD",
    supplier: "Supplier A (CN)",
    brand: "Kassa",
    pattern,
    sdept: 102,
    sdepts: [102],
    folder: "https://drive.example.com/PI-2611-010",
    items: 10,
    license: "ไม่มี",
    packages: ["Color Box"],
    importer: "คุณหมู",
    designer: "คุณพีท",
    brief: "Y",
    photo: false,
    history: [{ sub: "Info Checking", d: "2026-11-03", by: "import", act: "แจ้งงานออกแบบ (Create Job)", note: "", mark: "create" }],
    edits: [],
    files: [],
    skus: [],
  };
}

describe("MDSG Sdept Resolver & Workflow State Machine", () => {
  it("resolves exact Buyer (DIV), GM, VP, and EVP (for New Pattern) from Sdept 102", () => {
    const chain = resolveMdsgChain([102], 4);
    expect(chain.slots.map((s) => s.roleLabel)).toEqual([
      "Buyer",
      "GM",
      "VP",
      "EVP (New Pattern)",
    ]);
    expect(chain.slots[0]?.people.some((p) => p.email === "rothanakit@chg.co.th")).toBe(true);
    expect(chain.slots[1]?.people.some((p) => p.email === "chsassawat@chg.co.th")).toBe(true);
    expect(chain.slots[2]?.people.some((p) => p.email === "ranittaya@chg.co.th")).toBe(true);
    expect(chain.slots[3]?.people.some((p) => p.email === "BhChodok@chg.co.th")).toBe(true);
  });

  it("handles Info Checking -> Photo Shoot -> Info Checking -> Drafting -> combined Import/MDSG fail -> Revising", () => {
    let job = baseJob(3);
    // 1. No factory photos -> Photo Shoot (+7 days)
    const r1 = applyJobTransition(job, {
      kind: "check",
      actorRole: "designer",
      today: "2026-11-04",
      designer: "คุณพีท",
      brief: "Y",
      availablePhoto: "No",
      missingItems: [],
      note: "",
    });
    job = r1.job;
    expect(job.photo).toBe(true);
    expect(job.history.at(-1)?.sub).toBe("Photo Shoot");

    // 2. Photographer uploads -> Info Checking
    job = applyJobTransition(job, { kind: "photo", actorRole: "photographer", today: "2026-11-06", note: "" }).job;
    expect(job.history.at(-1)?.sub).toBe("Info Checking");

    // 3. Designer confirms complete -> Drafting
    job = applyJobTransition(job, {
      kind: "check",
      actorRole: "designer",
      today: "2026-11-09",
      designer: "คุณพีท",
      brief: "N",
      availablePhoto: "Yes",
      missingItems: [],
      note: "",
    }).job;
    expect(job.history.at(-1)?.sub).toBe("Drafting");
    expect(job.history.at(-1)?.mark).toBe("info");

    // 4. Designer sends Draft 1 -> Import Review
    job = applyJobTransition(job, {
      kind: "draft",
      actorRole: "designer",
      today: "2026-11-12",
      linkUrl: "https://drive.example.com/draft1",
      uploadedFiles: [],
      note: "",
    }).job;
    expect(job.history.at(-1)?.sub).toBe("Import Review");
    expect(job.files.some((f) => f.link && f.name === "https://drive.example.com/draft1")).toBe(true);

    // 5. Import Fails -> MUST STILL go to MDSG Review!
    job = applyJobTransition(job, {
      kind: "imp",
      actorRole: "import",
      today: "2026-11-13",
      result: "fail",
      reason: "แก้สี / ฟอนต์ / โลโก้",
      linkUrl: "https://drive.example.com/import-comment",
      uploadedFiles: [],
      note: "ขยับโลโก้",
    }).job;
    expect(job.history.at(-1)?.sub).toBe("MDSG Review");

    // 6. MDSG Passes -> since Import failed, combined result sends to Revising!
    job = applyJobTransition(job, {
      kind: "mdsg",
      actorRole: "mdsg",
      today: "2026-11-13",
      result: "pass",
      reason: "",
      reviewerComments: ["Buyer โอเค"],
      linkUrl: "",
      uploadedFiles: [],
      note: "",
    }).job;
    expect(job.history.at(-1)?.sub).toBe("Revising");
    expect(job.history.at(-1)?.mark).toBe("fail");
  });

  it("routes EVP Revising directly back to EVP Review and supports optional PO Number on Send to Factory", () => {
    let job = baseJob(2);
    job.history.push(
      { sub: "Drafting", d: "2026-11-04", by: "designer", act: "Info Complete", note: "", mark: "info" },
      { sub: "Present AW", d: "2026-11-10", by: "mdsg", act: "Confirm AW", note: "", mark: "confirm" },
      { sub: "EVP Review", d: "2026-11-11", by: "designer", act: "Present AW", note: "" }
    );

    job = applyJobTransition(job, {
      kind: "evp",
      actorRole: "evp",
      today: "2026-11-12",
      result: "fail",
      reason: "ข้อความบนบรรจุภัณฑ์ไม่ถูกต้อง",
      linkUrl: "",
      uploadedFiles: [],
      note: "",
    }).job;
    expect(job.history.at(-1)?.sub).toBe("EVP Revising");

    job = applyJobTransition(job, {
      kind: "evpfix",
      actorRole: "designer",
      today: "2026-11-13",
      linkUrl: "",
      uploadedFiles: [],
      note: "แก้แล้ว",
    }).job;
    expect(job.history.at(-1)?.sub).toBe("EVP Review");

    job = applyJobTransition(job, {
      kind: "evp",
      actorRole: "evp",
      today: "2026-11-13",
      result: "pass",
      reason: "",
      linkUrl: "",
      uploadedFiles: [],
      note: "",
    }).job;
    expect(job.history.at(-1)?.sub).toBe("Final AW");

    job = applyJobTransition(job, {
      kind: "final",
      actorRole: "designer",
      today: "2026-11-16",
      uploadedFiles: [],
      note: "",
    }).job;
    expect(job.history.at(-1)?.sub).toBe("Send to Factory");

    job = applyJobTransition(job, {
      kind: "factory",
      actorRole: "import",
      today: "2026-11-17",
      leadtime: 45,
      poNumber: "PO-2026-999",
      skuFileName: "SKU_PI.xlsx",
      skus: [{ sku: "8850001", created: "2026-10-20", gr: null }],
      note: "",
    }).job;
    expect(job.history.at(-1)?.sub).toBe("In Production");
    expect(job.poNumber).toBe("PO-2026-999");
    expect(job.leadtime).toBe(45);

    job = applyJobTransition(job, {
      kind: "grSync",
      actorRole: "system",
      today: "2026-11-25",
    }).job;
    expect(job.history.at(-1)?.sub).toBe("Goods Received");
    expect(job.skus[0]?.gr).toBe("2026-11-25");
  });
});
