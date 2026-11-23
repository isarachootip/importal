import { describe, expect, it } from "vitest";
import {
  transitionPackaging,
  type ApprovalRule,
  type PackagingMachineState,
} from "@/lib/domain/packaging-machine";

const DEFAULT_RULES: ApprovalRule[] = [
  { stageKey: "p1", stepOrder: 1, role: "IMPORT", isParallel: true, isEnabled: true },
  { stageKey: "p1", stepOrder: 1, role: "MER", isParallel: true, isEnabled: true },
  { stageKey: "p2", stepOrder: 1, role: "IMPORT", isParallel: true, isEnabled: true },
  { stageKey: "p2", stepOrder: 1, role: "MER", isParallel: true, isEnabled: true },
  { stageKey: "p3", stepOrder: 1, role: "IMPORT", isParallel: true, isEnabled: true },
  { stageKey: "p3", stepOrder: 1, role: "MER", isParallel: true, isEnabled: true },
  { stageKey: "approve_gm_vp", stepOrder: 1, role: "GM", isParallel: true, isEnabled: true },
  { stageKey: "approve_gm_vp", stepOrder: 1, role: "VP", isParallel: true, isEnabled: true },
  { stageKey: "approve_evp", stepOrder: 1, role: "EVP", isParallel: false, isEnabled: true },
];

function createState(overrides?: Partial<PackagingMachineState>): PackagingMachineState {
  return {
    caseNumber: 2,
    currentStep: "INFO",
    timelineStatus: "PENDING_IMPORT",
    piNumber: "PI-2026-001",
    packagingTypeCount: 2,
    requiredChecklistComplete: true,
    isMinorChange: false,
    minorChangeRuleEnabled: true,
    preQcRejectCount: 0,
    currentStepApprovals: [],
    approvalRules: DEFAULT_RULES,
    ...overrides,
  };
}

describe("Packaging state machine", () => {
  it("blocks INFO -> PRE_QC when checklist is incomplete or packaging types missing", () => {
    const incomplete = createState({ requiredChecklistComplete: false });
    expect(() =>
      transitionPackaging(incomplete, { type: "SUBMIT_PI", actorRoles: ["IMPORT"] })
    ).toThrow(/checklist/i);

    const noPkgTypes = createState({ packagingTypeCount: 0 });
    expect(() =>
      transitionPackaging(noPkgTypes, { type: "SUBMIT_PI", actorRoles: ["IMPORT"] })
    ).toThrow(/packaging/i);
  });

  it("handles Pre QC Reject back to INFO and increments reject counter", () => {
    const atPreQc = transitionPackaging(createState(), { type: "SUBMIT_PI", actorRoles: ["IMPORT"] });
    expect(atPreQc.currentStep).toBe("PRE_QC");
    expect(atPreQc.timelineStatus).toBe("PRE_QC_GD");

    const rejected = transitionPackaging(atPreQc, {
      type: "PRE_QC_REJECT",
      actorRoles: ["GD"],
      failedCodes: ["PREQC_NO_SKU_BARCODE"],
      reason: "ขาดไฟล์ SKU & Barcode",
    });
    expect(rejected.currentStep).toBe("INFO");
    expect(rejected.timelineStatus).toBe("PENDING_IMPORT");
    expect(rejected.preQcRejectCount).toBe(1);
  });

  it("skips Draft 2 and Draft 3 when all Proof 1 approvers approve", () => {
    let state = createState({ currentStep: "AW_DRAFT_1", timelineStatus: "ON_PROCESS" });
    state = transitionPackaging(state, { type: "UPLOAD_DRAFT_1", actorRoles: ["GD"], hasFile: true });
    expect(state.currentStep).toBe("PROOF_1");
    expect(state.timelineStatus).toBe("SENT_DRAFT_1");

    // Import approves -> still waiting on MER
    state = transitionPackaging(state, { type: "APPROVE_STEP", actorRoles: ["IMPORT"], actingRole: "IMPORT" });
    expect(state.currentStep).toBe("PROOF_1");

    // MER approves -> jumps straight to APPROVE_GM_VP
    state = transitionPackaging(state, { type: "APPROVE_STEP", actorRoles: ["MER"], actingRole: "MER" });
    expect(state.currentStep).toBe("APPROVE_GM_VP");
    expect(state.timelineStatus).toBe("APPROVE_FINAL");
  });

  it("routes Proof 1 revision -> REVISE_1 -> PROOF_2 -> ... -> PROOF_3 -> REVISE_3 -> APPROVE_GM_VP", () => {
    let state = createState({
      currentStep: "PROOF_1",
      timelineStatus: "SENT_DRAFT_1",
      currentStepApprovals: [
        { role: "IMPORT", stepOrder: 1, decision: "PENDING" },
        { role: "MER", stepOrder: 1, decision: "PENDING" },
      ],
    });

    // Reason is mandatory for revision request
    expect(() =>
      transitionPackaging(state, { type: "REQUEST_REVISION", actorRoles: ["MER"], actingRole: "MER", reason: "  " })
    ).toThrow(/เหตุผล/);

    state = transitionPackaging(state, {
      type: "REQUEST_REVISION",
      actorRoles: ["MER"],
      actingRole: "MER",
      reason: "แก้ไขขนาดฟอนต์",
    });
    expect(state.currentStep).toBe("REVISE_1");

    state = transitionPackaging(state, { type: "SUBMIT_REVISION", actorRoles: ["GD"], hasFile: true });
    expect(state.currentStep).toBe("PROOF_2");
    expect(state.timelineStatus).toBe("SENT_DRAFT_2");

    // Revise 2 -> Proof 3 -> Revise 3 -> Final
    state = transitionPackaging(state, {
      type: "REQUEST_REVISION",
      actorRoles: ["IMPORT"],
      actingRole: "IMPORT",
      reason: "เพิ่ม QR VDO",
    });
    state = transitionPackaging(state, { type: "SUBMIT_REVISION", actorRoles: ["GD"], hasFile: true });
    expect(state.currentStep).toBe("PROOF_3");
    expect(state.timelineStatus).toBe("SENT_DRAFT_3");

    state = transitionPackaging(state, {
      type: "REQUEST_REVISION",
      actorRoles: ["MER"],
      actingRole: "MER",
      reason: "ปรับสีโลโก้",
    });
    state = transitionPackaging(state, { type: "SUBMIT_REVISION", actorRoles: ["GD"], hasFile: true });
    expect(state.currentStep).toBe("APPROVE_GM_VP");
    expect(state.timelineStatus).toBe("APPROVE_FINAL");
  });

  it("handles Case 1 shortcut and Minor Change skipping EVP directly to FINAL_FILE", () => {
    const case1Minor = createState({
      caseNumber: 1,
      isMinorChange: true,
      minorChangeRuleEnabled: true,
      currentStep: "PRE_QC",
      timelineStatus: "PRE_QC_GD",
    });

    let state = transitionPackaging(case1Minor, { type: "PRE_QC_ACCEPT", actorRoles: ["GD"] });
    expect(state.currentStep).toBe("APPROVE_GM_VP");

    state = transitionPackaging(state, { type: "APPROVE_STEP", actorRoles: ["GM"], actingRole: "GM" });
    state = transitionPackaging(state, { type: "APPROVE_STEP", actorRoles: ["VP"], actingRole: "VP" });
    expect(state.currentStep).toBe("FINAL_FILE");

    state = transitionPackaging(state, { type: "UPLOAD_FINAL_FILE", actorRoles: ["GD"], hasFile: true });
    expect(state.currentStep).toBe("COMPLETED");
    expect(state.timelineStatus).toBe("APPROVED_FINAL");
  });

  it("handles EVP Revise Final loop back to APPROVE_GM_VP and enforces RBAC", () => {
    let state = createState({
      currentStep: "APPROVE_EVP",
      timelineStatus: "APPROVE_FINAL",
      currentStepApprovals: [{ role: "EVP", stepOrder: 1, decision: "PENDING" }],
    });

    expect(() =>
      transitionPackaging(state, { type: "APPROVE_STEP", actorRoles: ["IMPORT"], actingRole: "EVP" })
    ).toThrow(/สิทธิ์/);

    state = transitionPackaging(state, {
      type: "REQUEST_REVISION",
      actorRoles: ["EVP"],
      actingRole: "EVP",
      reason: "ปรับตำแหน่งโลโก้แบรนด์",
    });
    expect(state.currentStep).toBe("REVISE_FINAL");

    state = transitionPackaging(state, { type: "SUBMIT_FINAL_REVISION", actorRoles: ["GD"], hasFile: true });
    expect(state.currentStep).toBe("APPROVE_GM_VP");
  });

  it("supports configurable strict Excel approval mode (sequential Import -> MER -> GM -> VP & GM revise check)", () => {
    const strictRules: ApprovalRule[] = [
      { stageKey: "p1", stepOrder: 1, role: "IMPORT", isParallel: false, isEnabled: true },
      { stageKey: "p1", stepOrder: 2, role: "MER", isParallel: false, isEnabled: true },
      { stageKey: "p1", stepOrder: 3, role: "GM", isParallel: false, isEnabled: true },
      { stageKey: "p1", stepOrder: 4, role: "VP", isParallel: false, isEnabled: true },
      { stageKey: "r1", stepOrder: 1, role: "GM", isParallel: false, isEnabled: true },
      { stageKey: "approve_gm_vp", stepOrder: 1, role: "GM", isParallel: true, isEnabled: true },
    ];

    let state = createState({
      currentStep: "AW_DRAFT_1",
      timelineStatus: "ON_PROCESS",
      approvalRules: strictRules,
    });

    state = transitionPackaging(state, { type: "UPLOAD_DRAFT_1", actorRoles: ["GD"], hasFile: true });
    // MER cannot jump ahead of IMPORT in sequential mode
    expect(() =>
      transitionPackaging(state, { type: "APPROVE_STEP", actorRoles: ["MER"], actingRole: "MER" })
    ).toThrow(/ยังไม่ถึงคิว/);

    state = transitionPackaging(state, { type: "APPROVE_STEP", actorRoles: ["IMPORT"], actingRole: "IMPORT" });
    state = transitionPackaging(state, {
      type: "REQUEST_REVISION",
      actorRoles: ["MER"],
      actingRole: "MER",
      reason: "แก้ไขคำสะกด",
    });
    expect(state.currentStep).toBe("REVISE_1");

    // In strict mode with r1 GM rule enabled, GD submitting revision waits for GM approval
    state = transitionPackaging(state, { type: "SUBMIT_REVISION", actorRoles: ["GD"], hasFile: true });
    expect(state.currentStep).toBe("REVISE_1");

    state = transitionPackaging(state, { type: "APPROVE_STEP", actorRoles: ["GM"], actingRole: "GM" });
    expect(state.currentStep).toBe("PROOF_2");
  });
});
