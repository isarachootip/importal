import type { ArtworkStageKind, PackagingStepKey, RoleCode } from "@prisma/client";
import type { PackagingAction } from "@/lib/domain/packaging-machine";
import type { PackagingTransitionInput } from "@/lib/validations/packaging";

export function todayUtcDate(): Date {
  const iso = new Date().toISOString().slice(0, 10);
  return new Date(`${iso}T00:00:00.000Z`);
}

export function resolveRequiredArtworks(
  actionType: PackagingTransitionInput["type"],
  currentStep: PackagingStepKey
): ArtworkStageKind[] {
  switch (actionType) {
    case "UPLOAD_DRAFT_1":
      return ["DRAFT_1"];
    case "SUBMIT_REVISION":
      if (currentStep === "REVISE_1") return ["REVISE_1", "DRAFT_2"];
      if (currentStep === "REVISE_2") return ["REVISE_2", "DRAFT_3"];
      return ["REVISE_3"];
    case "SUBMIT_FINAL_REVISION":
      return ["REVISE_FINAL"];
    case "UPLOAD_FINAL_FILE":
      return ["FINAL_FILE"];
    default:
      return [];
  }
}

export function toMachineAction(
  input: PackagingTransitionInput,
  actorRoles: readonly RoleCode[],
  hasFile: boolean
): PackagingAction {
  switch (input.type) {
    case "SUBMIT_PI":
      return { type: "SUBMIT_PI", actorRoles };
    case "PRE_QC_REJECT":
      return { type: "PRE_QC_REJECT", actorRoles, failedCodes: input.failedCodes, reason: input.reason };
    case "PRE_QC_ACCEPT":
      return { type: "PRE_QC_ACCEPT", actorRoles };
    case "UPLOAD_DRAFT_1":
      return { type: "UPLOAD_DRAFT_1", actorRoles, hasFile };
    case "APPROVE_STEP":
      return { type: "APPROVE_STEP", actorRoles, actingRole: input.actingRole };
    case "REQUEST_REVISION":
      return { type: "REQUEST_REVISION", actorRoles, actingRole: input.actingRole, reason: input.reason };
    case "SUBMIT_REVISION":
      return { type: "SUBMIT_REVISION", actorRoles, hasFile };
    case "SUBMIT_FINAL_REVISION":
      return { type: "SUBMIT_FINAL_REVISION", actorRoles, hasFile };
    case "UPLOAD_FINAL_FILE":
      return { type: "UPLOAD_FINAL_FILE", actorRoles, hasFile };
  }
}

export function resolveAuditMeta(
  input: PackagingTransitionInput,
  userRoles: readonly RoleCode[]
): { actorRole: RoleCode; reason?: string } {
  const actorRole: RoleCode =
    input.type === "APPROVE_STEP" || input.type === "REQUEST_REVISION"
      ? input.actingRole
      : userRoles[0] ?? "IMPORT";

  let reason: string | undefined;
  if (input.type === "REQUEST_REVISION" || input.type === "PRE_QC_REJECT" || input.type === "APPROVE_STEP") {
    reason = input.reason;
  } else if (input.type === "PRE_QC_ACCEPT") {
    reason = input.note;
  }

  return { actorRole, reason };
}
