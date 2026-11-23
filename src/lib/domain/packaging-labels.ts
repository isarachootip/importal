import type {
  ApprovalDecision,
  ArtworkStageKind,
  ImportStage,
  PackagingStepKey,
  PiFileSlot,
  RoleCode,
  TimelineBoardStatus,
} from "@prisma/client";

export const STAGE_LABELS: Record<ImportStage, string> = {
  SOURCING: "1. Sourcing",
  PACKAGING: "2. PI & Packaging",
  PURCHASE_ORDER: "3. Purchase Order",
  PRODUCTION: "4. Production",
  LOGISTIC: "5. Inspection & Logistic",
  CLOSED: "ปิดงานแล้ว",
};

export const STEP_LABELS: Record<PackagingStepKey, string> = {
  INFO: "เตรียมข้อมูล & ลงทะเบียน PI",
  PRE_QC: "Graphic Pre QC / ตรวจรับบรีฟ",
  AW_DRAFT_1: "ออกแบบ Artwork (Draft 1)",
  PROOF_1: "ตรวจแบบครั้งที่ 1 (Proof 1)",
  REVISE_1: "แก้ไขแบบครั้งที่ 1 (Revise 1)",
  PROOF_2: "ตรวจแบบครั้งที่ 2 (Proof 2)",
  REVISE_2: "แก้ไขแบบครั้งที่ 2 (Revise 2)",
  PROOF_3: "ตรวจแบบครั้งที่ 3 (Proof 3)",
  REVISE_3: "แก้ไขแบบครั้งที่ 3 (Revise 3)",
  APPROVE_GM_VP: "อนุมัติ Final (GM / VP)",
  APPROVE_EVP: "อนุมัติ Final (EVP)",
  REVISE_FINAL: "แก้ไข Final (Buffer)",
  FINAL_FILE: "อัปโหลด Final File ส่งโรงงาน",
  COMPLETED: "เสร็จสิ้น Packaging",
};

export const BOARD_STATUS_LABELS: Record<TimelineBoardStatus, string> = {
  PENDING_IMPORT: "รอดำเนินการ (Import)",
  PRE_QC_GD: "Pre QC (GD)",
  ON_PROCESS: "กำลังออกแบบ",
  SENT_DRAFT_1: "Sent Draft 1",
  SENT_DRAFT_2: "Sent Draft 2",
  SENT_DRAFT_3: "Sent Draft 3",
  APPROVE_FINAL: "รออนุมัติ Final",
  APPROVED_FINAL: "อนุมัติ Final แล้ว",
};

export const PI_FILE_SLOTS: ReadonlyArray<{
  slot: PiFileSlot;
  labelTh: string;
  hint: string;
  accept: string;
}> = [
  { slot: "EXCEL_DATA", labelTh: "1. ข้อมูลสินค้า (Excel)", hint: "SKU, ชื่อสินค้า, ขนาด, บาร์โค้ด", accept: ".xlsx,.xls,.csv,.pdf" },
  { slot: "DICUT_DIMENSION", labelTh: "2. ไดคัท & ขนาด (Dicut)", hint: "ไฟล์ AI / PDF ขนาดกล่องจริง", accept: ".pdf,.ai,.eps,.png,.jpg,.jpeg,.zip" },
  { slot: "PICTURE_DATA", labelTh: "3. รูปถ่ายสินค้า", hint: "ภาพสินค้า HD / ไฟล์ภาพประกอบ", accept: ".jpg,.jpeg,.png,.webp,.zip,.pdf" },
  { slot: "MANUAL_DATA", labelTh: "4. คู่มือ & ฉลาก สคบ.", hint: "คำแนะนำการใช้งาน / คำเตือน / มอก.", accept: ".pdf,.docx,.doc,.xlsx,.txt" },
  { slot: "OLD_PATTERN_REF", labelTh: "5. ตัวอย่างแพทเทิร์นเดิม", hint: "ไฟล์เดิมสำหรับ Repeat / แตกไซส์", accept: ".pdf,.ai,.png,.jpg,.jpeg,.zip" },
  { slot: "REF_OTHER", labelTh: "6. เอกสารอ้างอิงเพิ่มเติม", hint: "Reference สี, ฟอนต์ หรือไฟล์อื่นๆ", accept: ".pdf,.png,.jpg,.jpeg,.xlsx,.zip" },
];

export const ARTWORK_STAGE_LABELS: Record<ArtworkStageKind, string> = {
  DRAFT_1: "Draft 1",
  REVISE_1: "Revise 1 (Draft 2)",
  DRAFT_2: "Draft 2",
  REVISE_2: "Revise 2 (Draft 3)",
  DRAFT_3: "Draft 3",
  REVISE_3: "Revise 3 (Final Check)",
  REVISE_FINAL: "Revise Final",
  FINAL_FILE: "Final File (ส่งโรงงาน)",
};

export const ROLE_LABELS: Record<RoleCode, string> = {
  IMPORT: "Import",
  MER: "MER",
  GD: "Graphic",
  GM: "GM",
  VP: "VP",
  EVP: "EVP",
  VENDOR: "โรงงาน",
  FORWARDER: "Forwarder",
  ADMIN: "Admin",
};

export const APPROVAL_DECISION_LABELS: Record<ApprovalDecision, string> = {
  PENDING: "รอตรวจ",
  APPROVED: "ผ่าน",
  REVISION_REQUESTED: "แจ้งแก้",
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  CASE_CREATED: "สร้าง Case และลงทะเบียน PI",
  PI_UPDATED: "บันทึกข้อมูล PI / Checklist",
  PI_FILE_UPLOADED: "อัปโหลดไฟล์ข้อมูล PI",
  SUBMIT_PI: "ส่งข้อมูล PI ให้ Graphic Pre QC",
  PRE_QC_ACCEPT: "Graphic Pre QC ผ่าน (รับงานออกแบบ)",
  PRE_QC_REJECT: "Graphic Pre QC ตีกลับให้ Import แก้ไข",
  ARTWORK_UPLOADED: "อัปโหลดไฟล์ Artwork",
  UPLOAD_DRAFT_1: "ส่ง Artwork Draft 1 ให้ตรวจแบบ",
  APPROVE_STEP: "อนุมัติผ่านขั้นตอน",
  REQUEST_REVISION: "แจ้งแก้ไขแบบ",
  SUBMIT_REVISION: "ส่งไฟล์ Artwork ฉบับแก้ไข",
  SUBMIT_FINAL_REVISION: "ส่งไฟล์ Artwork ฉบับแก้ไข Final",
  UPLOAD_FINAL_FILE: "อัปโหลด Final File ปิดงาน Packaging",
  COMMENT_ADDED: "เพิ่มคอมเมนต์บนแบบ",
  QUOTATION_ADDED: "เพิ่มใบเสนอราคา (Quotation)",
  SOURCING_UPDATED: "อัปเดตสถานะ Sourcing",
  PI_ATTACHED: "ลงทะเบียน PI & เปิดงาน Packaging",
  PO_UPDATED: "อัปเดตข้อมูล / สถานะ PO",
  PRODUCTION_UPDATED: "อัปเดตความคืบหน้าการผลิต / QC",
  LOGISTIC_UPDATED: "อัปเดตสถานะขนส่ง / ศุลกากร",
  CASE_CLOSED: "คลังตรวจรับครบ — ปิดงานนำเข้า",
  CASE_DOC_UPLOADED: "อัปโหลดเอกสารนำเข้า",
};
