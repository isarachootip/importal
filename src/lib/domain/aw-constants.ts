import { DESIGNER_STAFF, IMPORT_STAFF, SDEPT_MASTER, type TrackerRoleKey } from "./directory-import-design";

export interface PatternDef {
  id: number;
  name: string;
  desc: string;
  grp: "Approval Pattern" | "New Pattern";
  info: number;
  brief: number;
  aw: number;
  prod: number;
  log: number;
  total: number;
}

export const PATTERNS: PatternDef[] = [
  { id: 2, name: "2) Old SKUs & Use approval Pattern", desc: "SKU เก่า ทำใส่ Pattern ล่าสุด", grp: "Approval Pattern", info: 2, brief: 2, aw: 15, prod: 55, log: 20, total: 94 },
  { id: 3, name: "3) New SKUs & Use approval Pattern", desc: "SKU ใหม่ ทำใส่ Pattern ล่าสุด", grp: "Approval Pattern", info: 7, brief: 2, aw: 15, prod: 55, log: 20, total: 99 },
  { id: 4, name: "4) Old SKUs & Design New Pattern", desc: "SKU เก่า ออกแบบ Pattern ใหม่", grp: "New Pattern", info: 2, brief: 2, aw: 25, prod: 55, log: 20, total: 104 },
  { id: 5, name: "5) New SKUs & Design New Pattern", desc: "SKU ใหม่ ออกแบบ Pattern ใหม่", grp: "New Pattern", info: 7, brief: 2, aw: 25, prod: 55, log: 20, total: 109 },
];

export const BU_LIST = ["TWD", "PWB", "Go Wholesales", "OFM"] as const;

export const BRANDS = [
  "Kassa", "Luzio", "Italuce", "Workon", "Gianttech", "Giant Kingkong", "Giant Kingkong Pro",
  "Calina", "Fonte", "Karten", "Verezzo", "Kassa Home", "Kassa Hotel", "Murano",
  "Fugo", "Wippy", "Cuna", "Zagio", "Mamaru", "Smart", "Krafte", "One Best",
] as const;

export const LICENSE_LIST = ["ไม่มี", "TISI (มอก.)", "อย."] as const;
export const OTHER_SUPPLIER = "อื่นๆ (ระบุ)";
export const SUPPLIERS = [
  "Supplier A (CN)", "Supplier B (CN)", "Supplier C (VN)",
  "Supplier D (IN)", "Supplier E (CN)", "Supplier F (TW)",
] as const;

export const PACKAGES = ["Color Box", "Color Card", "Brown Box", "Blister Card", "Sticker", "คู่มือ"] as const;

export const REASONS = [
  "ข้อมูลสินค้า / ขนาดไม่ครบ",
  "แก้สี / ฟอนต์ / โลโก้",
  "ข้อความบนบรรจุภัณฑ์ไม่ถูกต้อง",
  "โรงงานเปลี่ยนสเปกบรรจุภัณฑ์",
  "อื่นๆ",
] as const;

export const CANCEL_REASONS = ["ยกเลิก PI", "เปลี่ยน Supplier", "ยกเลิกสินค้า", "อื่นๆ"] as const;

export const CHECK_ITEMS = [
  "Product information",
  "Product's Pictures",
  "Packaging's Size & Dimension",
  "Reference Design",
  "มอก.",
  "Shipping Mark",
  "Others",
] as const;

export const IMPORTER_NAMES = IMPORT_STAFF.map((x) => x.displayName);
export const DESIGNER_NAMES = DESIGNER_STAFF.map((x) => x.displayName);

export const ROLES_META: Record<TrackerRoleKey, { name: string; defaultUser: string; ini: string }> = {
  import: { name: "Import", defaultUser: "คุณหมู", ini: "IM" },
  mdsg: { name: "MDSG (Buyer / GM / VP)", defaultUser: "คุณกฤต (Thanakit)", ini: "MD" },
  evp: { name: "EVP MDSG", defaultUser: "K.Chodok (EVP)", ini: "EV" },
  designer: { name: "Designer", defaultUser: "คุณพีท", ini: "DS" },
  photographer: { name: "Photographer", defaultUser: "Photo Team", ini: "PH" },
  mgmt: { name: "ผู้บริหาร", defaultUser: "Management", ini: "MG" },
};

export const ROLE_TH: Record<string, string> = {
  import: "Import",
  mdsg: "MDSG",
  evp: "EVP MDSG",
  designer: "Designer",
  photographer: "Photographer",
  system: "ระบบ",
  factory: "Factory",
  mgmt: "ผู้บริหาร",
};

export type MainStatus = "Open" | "Draft AW" | "Final AW" | "Production" | "Goods Received" | "Cancelled";
export const STATUS_LIST: MainStatus[] = ["Open", "Draft AW", "Final AW", "Production", "Goods Received", "Cancelled"];

export const STATUS_COLORS: Record<MainStatus, string> = {
  "Open": "#8A94A6",
  "Draft AW": "#5B8BD0",
  "Final AW": "#2E5FB0",
  "Production": "#1F3A5F",
  "Goods Received": "#2F8F6B",
  "Cancelled": "#B4410C",
};

export type SubStatus =
  | "Info Checking" | "Photo Shoot" | "Info Incomplete"
  | "Drafting" | "Import Review" | "MDSG Review" | "Revising"
  | "Present AW" | "EVP Review" | "EVP Revising"
  | "Final AW" | "Send to Factory" | "In Production"
  | "Goods Received" | "Cancelled";

export interface SubStatusDef {
  st: MainStatus;
  roles: string[];
  sla: number | null;
  label: string;
}

export const SUB_MAP: Record<SubStatus, SubStatusDef> = {
  "Info Checking": { st: "Open", roles: ["designer"], sla: 2, label: "ตรวจข้อมูล & Brief (Y/N)" },
  "Photo Shoot": { st: "Open", roles: ["photographer"], sla: 7, label: "ถ่ายรูปสินค้า" },
  "Info Incomplete": { st: "Open", roles: ["import"], sla: 2, label: "ส่งข้อมูล / รูปเพิ่มเติม" },
  "Drafting": { st: "Draft AW", roles: ["designer"], sla: 7, label: "ออกแบบ Draft" },
  "Import Review": { st: "Draft AW", roles: ["import"], sla: 2, label: "Import ตรวจ Draft" },
  "MDSG Review": { st: "Draft AW", roles: ["mdsg"], sla: 2, label: "MDSG ตรวจ Draft (Buyer / GM / VP) · รวม Import 2 วัน" },
  "Revising": { st: "Draft AW", roles: ["designer"], sla: 3, label: "แก้ไข Draft" },
  "Present AW": { st: "Draft AW", roles: ["designer"], sla: 1, label: "Present AW ให้ EVP" },
  "EVP Review": { st: "Draft AW", roles: ["evp"], sla: 1, label: "EVP พิจารณาอนุมัติ" },
  "EVP Revising": { st: "Draft AW", roles: ["designer"], sla: 1, label: "แก้ไขตามคอมเมนต์ EVP" },
  "Final AW": { st: "Final AW", roles: ["designer"], sla: 1, label: "Submit Final AW" },
  "Send to Factory": { st: "Production", roles: ["import"], sla: 1, label: "ส่ง AW ให้โรงงาน + ใส่ Leadtime & SKU number" },
  "In Production": { st: "Production", roles: ["factory"], sla: null, label: "โรงงานผลิต / ขนส่ง (รอ Sync PO)" },
  "Goods Received": { st: "Goods Received", roles: [], sla: null, label: "สินค้าเข้าแล้ว" },
  "Cancelled": { st: "Cancelled", roles: [], sla: null, label: "ยกเลิกงาน" },
};

export const STEP_SUBS: SubStatus[] = [
  "Info Checking", "Photo Shoot", "Info Incomplete",
  "Drafting", "Import Review", "MDSG Review", "Revising",
  "Present AW", "EVP Review", "EVP Revising",
  "Final AW", "Send to Factory",
];

export const NEXT_ACTION_LABEL: Partial<Record<SubStatus, string>> = {
  "Info Checking": "ตรวจข้อมูล",
  "Photo Shoot": "ถ่ายรูปสินค้า",
  "Info Incomplete": "ส่งข้อมูลเพิ่ม",
  "Drafting": "ส่ง Draft",
  "Import Review": "Import ตรวจ Draft",
  "MDSG Review": "MDSG ตรวจ Draft",
  "Revising": "ส่ง Draft แก้ไข",
  "Present AW": "Present AW",
  "EVP Review": "EVP อนุมัติ",
  "EVP Revising": "แก้ตาม EVP",
  "Final AW": "Submit Final AW",
};

export function sdeptLabel(code: number): string {
  const found = SDEPT_MASTER.find((x) => x.code === code);
  return found ? `${found.code} ${found.name}` : String(code);
}
