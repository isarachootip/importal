import type { PackagingStepKey, RoleCode } from "@prisma/client";
import {
  buildApprovalsForStep,
  mapStepToBoardStatus,
  type PackagingAction,
  type PackagingMachineState,
  type StepApprovalSlot,
} from "./packaging-machine-types";

export type { ApprovalRule, PackagingAction, PackagingMachineState, StepApprovalSlot } from "./packaging-machine-types";
export { buildApprovalsForStep, mapStepToBoardStatus } from "./packaging-machine-types";

function assertActorHasAny(actorRoles: readonly RoleCode[], allowed: readonly RoleCode[]): void {
  if (actorRoles.includes("ADMIN")) return;
  if (!allowed.some((r) => actorRoles.includes(r))) {
    throw new Error(`สิทธิ์ไม่เพียงพอสำหรับขั้นตอนนี้ (ต้องการ: ${allowed.join(", ")})`);
  }
}

function getPendingMinOrder(slots: StepApprovalSlot[]): number | null {
  const pending = slots.filter((s) => s.decision === "PENDING");
  if (pending.length === 0) return null;
  return Math.min(...pending.map((s) => s.stepOrder));
}

function moveToStep(state: PackagingMachineState, nextStep: PackagingStepKey): PackagingMachineState {
  return {
    ...state,
    currentStep: nextStep,
    timelineStatus: mapStepToBoardStatus(nextStep),
    currentStepApprovals: buildApprovalsForStep(nextStep, state.approvalRules),
  };
}

function handleApproveStep(
  state: PackagingMachineState,
  actorRoles: readonly RoleCode[],
  actingRole: RoleCode
): PackagingMachineState {
  assertActorHasAny(actorRoles, [actingRole]);
  const minOrder = getPendingMinOrder(state.currentStepApprovals);
  if (minOrder === null) {
    throw new Error(`ไม่มีคิวอนุมัติที่รออยู่ในขั้น ${state.currentStep}`);
  }

  const slotIndex = state.currentStepApprovals.findIndex(
    (s) => s.role === actingRole && s.decision === "PENDING" && s.stepOrder === minOrder
  );
  if (slotIndex === -1) {
    throw new Error(`ยังไม่ถึงคิวอนุมัติของบทบาท ${actingRole}`);
  }

  const updated = state.currentStepApprovals.map((slot, idx) =>
    idx === slotIndex ? { ...slot, decision: "APPROVED" as const } : slot
  );

  const allDone = updated.every((s) => s.decision === "APPROVED");
  if (!allDone) {
    return { ...state, currentStepApprovals: updated };
  }

  const skipEvp = state.isMinorChange && state.minorChangeRuleEnabled;
  switch (state.currentStep) {
    case "PROOF_1":
    case "PROOF_2":
    case "PROOF_3":
      return moveToStep(state, "APPROVE_GM_VP");
    case "REVISE_1":
      return moveToStep(state, "PROOF_2");
    case "REVISE_2":
      return moveToStep(state, "PROOF_3");
    case "REVISE_3":
      return moveToStep(state, "APPROVE_GM_VP");
    case "APPROVE_GM_VP":
      return moveToStep(state, skipEvp ? "FINAL_FILE" : "APPROVE_EVP");
    case "APPROVE_EVP":
      return moveToStep(state, "FINAL_FILE");
    default:
      throw new Error(`ขั้น ${state.currentStep} ไม่รองรับการกดอนุมัติ`);
  }
}

function handleRequestRevision(
  state: PackagingMachineState,
  actorRoles: readonly RoleCode[],
  actingRole: RoleCode,
  reason: string
): PackagingMachineState {
  assertActorHasAny(actorRoles, [actingRole]);
  if (!reason.trim()) {
    throw new Error("กรุณาระบุเหตุผลในการขอแก้ไข");
  }
  const hasSlot = state.currentStepApprovals.some((s) => s.role === actingRole && s.decision === "PENDING");
  if (!hasSlot) {
    throw new Error(`บทบาท ${actingRole} ไม่ได้อยู่ในคิวตรวจของขั้น ${state.currentStep}`);
  }

  switch (state.currentStep) {
    case "PROOF_1":
      return moveToStep(state, "REVISE_1");
    case "PROOF_2":
      return moveToStep(state, "REVISE_2");
    case "PROOF_3":
      return moveToStep(state, "REVISE_3");
    case "APPROVE_GM_VP":
    case "APPROVE_EVP":
      return moveToStep(state, "REVISE_FINAL");
    default:
      throw new Error(`ขั้น ${state.currentStep} ไม่รองรับการขอแก้ไข`);
  }
}

export function transitionPackaging(
  state: PackagingMachineState,
  action: PackagingAction
): PackagingMachineState {
  switch (action.type) {
    case "SUBMIT_PI": {
      assertActorHasAny(action.actorRoles, ["IMPORT"]);
      if (state.currentStep !== "INFO") throw new Error("ส่งข้อมูล PI ได้เฉพาะขั้น INFO เท่านั้น");
      if (!state.piNumber?.trim()) throw new Error("กรุณากรอกเลข PI ก่อนส่งงาน");
      if (state.packagingTypeCount < 1) throw new Error("กรุณาเลือกรูปแบบ Packaging อย่างน้อย 1 รายการ");
      if (!state.requiredChecklistComplete) throw new Error("กรุณาติ๊ก Checklist ข้อมูลส่ง GD ให้ครบก่อนส่ง");
      return moveToStep(state, "PRE_QC");
    }

    case "PRE_QC_REJECT": {
      assertActorHasAny(action.actorRoles, ["GD"]);
      if (state.currentStep !== "PRE_QC") throw new Error("Reject Pre QC ได้เฉพาะขั้น PRE_QC เท่านั้น");
      if (action.failedCodes.length === 0 && !action.reason?.trim()) {
        throw new Error("กรุณาเลือกข้อที่ไม่ผ่านหรือระบุหมายเหตุเมื่อ Reject");
      }
      return { ...moveToStep(state, "INFO"), preQcRejectCount: state.preQcRejectCount + 1 };
    }

    case "PRE_QC_ACCEPT": {
      assertActorHasAny(action.actorRoles, ["GD"]);
      if (state.currentStep !== "PRE_QC") throw new Error("รับงาน Pre QC ได้เฉพาะขั้น PRE_QC เท่านั้น");
      const isCase1Shortcut = state.caseNumber === 1 || (state.isMinorChange && state.minorChangeRuleEnabled);
      return moveToStep(state, isCase1Shortcut ? "APPROVE_GM_VP" : "AW_DRAFT_1");
    }

    case "UPLOAD_DRAFT_1": {
      assertActorHasAny(action.actorRoles, ["GD"]);
      if (state.currentStep !== "AW_DRAFT_1") throw new Error("ส่ง Draft 1 ได้เฉพาะขั้น AW_DRAFT_1 เท่านั้น");
      if (!action.hasFile) throw new Error("กรุณาแนบไฟล์ Artwork Draft 1");
      return moveToStep(state, "PROOF_1");
    }

    case "APPROVE_STEP":
      return handleApproveStep(state, action.actorRoles, action.actingRole);

    case "REQUEST_REVISION":
      return handleRequestRevision(state, action.actorRoles, action.actingRole, action.reason);

    case "SUBMIT_REVISION": {
      assertActorHasAny(action.actorRoles, ["GD"]);
      if (!action.hasFile) throw new Error("กรุณาแนบไฟล์ Artwork ที่แก้ไขแล้ว");
      const hasGmCheck = state.currentStepApprovals.some((s) => s.decision === "PENDING");
      if (hasGmCheck) {
        // Configurable strict mode: GD submitted revision, awaiting GM review inside REVISE_N
        return state;
      }
      if (state.currentStep === "REVISE_1") return moveToStep(state, "PROOF_2");
      if (state.currentStep === "REVISE_2") return moveToStep(state, "PROOF_3");
      if (state.currentStep === "REVISE_3") return moveToStep(state, "APPROVE_GM_VP");
      throw new Error(`ขั้น ${state.currentStep} ไม่ใช่ขั้น Revise`);
    }

    case "SUBMIT_FINAL_REVISION": {
      assertActorHasAny(action.actorRoles, ["GD"]);
      if (state.currentStep !== "REVISE_FINAL") throw new Error("ส่งงานแก้ Final ได้เฉพาะขั้น REVISE_FINAL เท่านั้น");
      if (!action.hasFile) throw new Error("กรุณาแนบไฟล์ Artwork ที่แก้ไขแล้ว");
      return moveToStep(state, "APPROVE_GM_VP");
    }

    case "UPLOAD_FINAL_FILE": {
      assertActorHasAny(action.actorRoles, ["GD"]);
      if (state.currentStep !== "FINAL_FILE") throw new Error("อัปโหลด Final File ได้หลังอนุมัติ Final เท่านั้น");
      if (!action.hasFile) throw new Error("กรุณาแนบ Final File สำหรับส่งโรงงาน");
      return moveToStep(state, "COMPLETED");
    }
  }
}
