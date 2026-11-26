import {
  DESIGNER_STAFF,
  IMPORT_STAFF,
  SPECIAL_STAFF,
  type StaffMemberDef,
} from "./directory-import-design";
import { MDSG_STAFF } from "./directory-mdsg";

export interface MdsgChainSlot {
  roleLabel: string;
  people: StaffMemberDef[];
  summaryNames: string;
}

export interface MdsgResolvedChain {
  slots: MdsgChainSlot[];
  allPeople: StaffMemberDef[];
}

const ALL_STAFF: StaffMemberDef[] = [
  ...DESIGNER_STAFF,
  ...IMPORT_STAFF,
  ...MDSG_STAFF,
  ...SPECIAL_STAFF,
];

export function findStaffByDisplayName(displayName: string): StaffMemberDef | undefined {
  return ALL_STAFF.find((s) => s.displayName === displayName || s.nickname === displayName);
}

export function resolveMdsgChain(sdeptCodes: number[], patternId: number): MdsgResolvedChain {
  const codes = new Set(sdeptCodes);
  const matching = MDSG_STAFF.filter((m) => m.sdeptCodes.some((c) => codes.has(c)));

  const buyers = matching.filter((m) => m.orgLevel === "DIV");
  const gms = matching.filter((m) => m.orgLevel === "GM");
  const vps = matching.filter((m) => m.orgLevel === "VP");

  const slots: MdsgChainSlot[] = [
    {
      roleLabel: "Buyer",
      people: buyers,
      summaryNames: buyers.map((p) => p.displayName).join(", ") || "Buyer ตาม Sdept",
    },
    {
      roleLabel: "GM",
      people: gms,
      summaryNames: gms.map((p) => p.displayName).join(", ") || "GM ตาม Sdept",
    },
    {
      roleLabel: "VP",
      people: vps,
      summaryNames: vps.map((p) => p.displayName).join(", ") || "VP ตาม Sdept",
    },
  ];

  if (patternId >= 4) {
    const evp = SPECIAL_STAFF.filter((s) => s.role === "evp");
    slots.push({
      roleLabel: "EVP (New Pattern)",
      people: evp,
      summaryNames: evp.map((p) => p.displayName).join(", "),
    });
  }

  return {
    slots,
    allPeople: [...buyers, ...gms, ...vps],
  };
}

export function resolveMdsgRecipients(sdeptCodes: number[]): {
  displayLabel: string;
  emails: string[];
} {
  const chain = resolveMdsgChain(sdeptCodes, 2);
  const names = chain.allPeople.map((p) => p.nickname);
  const uniqNames = [...new Set(names)];
  const displayLabel = uniqNames.length > 0
    ? `MDSG (${uniqNames.slice(0, 4).join(", ")}${uniqNames.length > 4 ? ` +${uniqNames.length - 4}` : ""} · Sdept ${sdeptCodes.join(", ")})`
    : `MDSG · Buyer / GM / VP (Sdept ${sdeptCodes.join(", ")})`;
  return {
    displayLabel,
    emails: [...new Set(chain.allPeople.map((p) => p.email))],
  };
}
