import type { ApprovalDecision, PackagingStepKey, RoleCode, TimelineBoardStatus } from "@prisma/client";

export interface ApprovalRule {
  stageKey: string;
  stepOrder: number;
  role: RoleCode;
  isParallel: boolean;
  isEnabled: boolean;
}

export interface StepApprovalSlot {
  role: RoleCode;
  stepOrder: number;
  decision: ApprovalDecision;
}

export interface PackagingMachineState {
  caseNumber: number;
  currentStep: PackagingStepKey;
  timelineStatus: TimelineBoardStatus;
  piNumber: string | null;
  packagingTypeCount: number;
  requiredChecklistComplete: boolean;
  isMinorChange: boolean;
  minorChangeRuleEnabled: boolean;
  preQcRejectCount: number;
  currentStepApprovals: StepApprovalSlot[];
  approvalRules: ApprovalRule[];
}

export type PackagingAction =
  | { type: "SUBMIT_PI"; actorRoles: readonly RoleCode[] }
  | { type: "PRE_QC_REJECT"; actorRoles: readonly RoleCode[]; failedCodes: string[]; reason?: string }
  | { type: "PRE_QC_ACCEPT"; actorRoles: readonly RoleCode[] }
  | { type: "UPLOAD_DRAFT_1"; actorRoles: readonly RoleCode[]; hasFile: boolean }
  | { type: "APPROVE_STEP"; actorRoles: readonly RoleCode[]; actingRole: RoleCode }
  | { type: "REQUEST_REVISION"; actorRoles: readonly RoleCode[]; actingRole: RoleCode; reason: string }
  | { type: "SUBMIT_REVISION"; actorRoles: readonly RoleCode[]; hasFile: boolean }
  | { type: "SUBMIT_FINAL_REVISION"; actorRoles: readonly RoleCode[]; hasFile: boolean }
  | { type: "UPLOAD_FINAL_FILE"; actorRoles: readonly RoleCode[]; hasFile: boolean };

export const STEP_TO_RULE_STAGE: Partial<Record<PackagingStepKey, string>> = {
  PROOF_1: "p1",
  PROOF_2: "p2",
  PROOF_3: "p3",
  REVISE_1: "r1",
  REVISE_2: "r2",
  REVISE_3: "r3",
  APPROVE_GM_VP: "approve_gm_vp",
  APPROVE_EVP: "approve_evp",
  REVISE_FINAL: "rfinal",
};

export function mapStepToBoardStatus(step: PackagingStepKey): TimelineBoardStatus {
  switch (step) {
    case "INFO":
      return "PENDING_IMPORT";
    case "PRE_QC":
      return "PRE_QC_GD";
    case "AW_DRAFT_1":
      return "ON_PROCESS";
    case "PROOF_1":
    case "REVISE_1":
      return "SENT_DRAFT_1";
    case "PROOF_2":
    case "REVISE_2":
      return "SENT_DRAFT_2";
    case "PROOF_3":
    case "REVISE_3":
      return "SENT_DRAFT_3";
    case "APPROVE_GM_VP":
    case "APPROVE_EVP":
    case "REVISE_FINAL":
    case "FINAL_FILE":
      return "APPROVE_FINAL";
    case "COMPLETED":
      return "APPROVED_FINAL";
  }
}

export function buildApprovalsForStep(step: PackagingStepKey, rules: ApprovalRule[]): StepApprovalSlot[] {
  const stageKey = STEP_TO_RULE_STAGE[step];
  if (!stageKey) return [];
  return rules
    .filter((r) => r.stageKey === stageKey && r.isEnabled)
    .sort((a, b) => a.stepOrder - b.stepOrder)
    .map((r) => ({ role: r.role, stepOrder: r.stepOrder, decision: "PENDING" as ApprovalDecision }));
}
