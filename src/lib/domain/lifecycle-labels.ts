import type {
  CaseDocType,
  LogisticStatus,
  PoStatus,
  ProductionStatus,
  SourcingStatus,
} from "@prisma/client";

export const SOURCING_STATUS_ORDER: readonly SourcingStatus[] = [
  "DRAFT",
  "RFQ_SENT",
  "QUOTE_RECEIVED",
  "NEGOTIATING",
  "OFFER_SELECTED",
  "APPROVED",
];

export const SOURCING_STATUS_LABELS: Record<SourcingStatus, string> = {
  DRAFT: "ร่างข้อมูลสินค้า",
  RFQ_SENT: "ส่งขอราคา (RFQ)",
  QUOTE_RECEIVED: "รับใบเสนอราคาแล้ว",
  NEGOTIATING: "เจรจาต่อรองราคา",
  OFFER_SELECTED: "เลือกผู้ผลิตแล้ว",
  APPROVED: "อนุมัติ Sourcing แล้ว",
};

export const PO_STATUS_ORDER: readonly PoStatus[] = [
  "NOT_STARTED",
  "PO_DRAFT",
  "PO_APPROVED",
  "PO_SENT",
  "PO_ACCEPTED",
];

export const PO_STATUS_LABELS: Record<PoStatus, string> = {
  NOT_STARTED: "ยังไม่เริ่ม",
  PO_DRAFT: "ร่างใบสั่งซื้อ (PO Draft)",
  PO_APPROVED: "อนุมัติ PO แล้ว",
  PO_SENT: "ส่ง PO ให้โรงงานแล้ว",
  PO_ACCEPTED: "โรงงานยืนยันรับ PO แล้ว",
};

export const PRODUCTION_STATUS_ORDER: readonly ProductionStatus[] = [
  "NOT_STARTED",
  "PO_ACCEPTED",
  "DEPOSIT_PAID",
  "MATERIAL_PREP",
  "IN_PRODUCTION",
  "QC_INSPECTION",
  "READY_TO_SHIP",
];

export const PRODUCTION_STATUS_LABELS: Record<ProductionStatus, string> = {
  NOT_STARTED: "ยังไม่เริ่ม",
  PO_ACCEPTED: "โรงงานรับออเดอร์",
  DEPOSIT_PAID: "ชำระมัดจำแล้ว",
  MATERIAL_PREP: "เตรียมวัตถุดิบ & แพ็กเกจ",
  IN_PRODUCTION: "กำลังผลิต (MTO)",
  QC_INSPECTION: "ตรวจ QC ก่อนส่ง",
  READY_TO_SHIP: "พร้อมส่งออก (Ready to Ship)",
};

export const LOGISTIC_STATUS_ORDER: readonly LogisticStatus[] = [
  "NOT_STARTED",
  "BOOKED",
  "EXPORT_CLEARED_CN",
  "DEPARTED",
  "ARRIVED_TH",
  "CUSTOMS_CLEARED_TH",
  "DELIVERED_TO_WH",
  "RECEIVED_COMPLETE",
];

export const LOGISTIC_STATUS_LABELS: Record<LogisticStatus, string> = {
  NOT_STARTED: "ยังไม่เริ่ม",
  BOOKED: "จองเรือ / เที่ยวบินแล้ว",
  EXPORT_CLEARED_CN: "ผ่านพิธีการส่งออกจีน",
  DEPARTED: "เรือ/เครื่องบินออกแล้ว (ETD)",
  ARRIVED_TH: "ถึงท่าเรือ/สนามบินไทย (ETA)",
  CUSTOMS_CLEARED_TH: "ผ่านพิธีการศุลกากรไทย",
  DELIVERED_TO_WH: "ส่งถึงคลังสินค้า (WH)",
  RECEIVED_COMPLETE: "คลังตรวจรับครบ — ปิดงาน",
  ISSUE_REPORTED: "พบปัญหาที่คลัง (Claim/Shortage)",
};

export const CASE_DOC_TYPE_LABELS: Record<CaseDocType, string> = {
  QUOTATION: "ใบเสนอราคา (Quotation)",
  PO_FILE: "ใบสั่งซื้อ (PO File)",
  QC_REPORT: "รายงานตรวจคุณภาพ (QC Report)",
  COMMERCIAL_INVOICE: "Commercial Invoice (CI)",
  PACKING_LIST: "Packing List (PL)",
  BILL_OF_LADING: "Bill of Lading / AWB",
  FORM_E: "Form E (ลดหย่อนภาษี)",
  IMPORT_DECLARATION: "ใบขนสินค้าขาเข้า",
  OTHER: "เอกสารอื่นๆ",
};

export const REQUIRED_LOGISTIC_DOCS: readonly CaseDocType[] = [
  "COMMERCIAL_INVOICE",
  "PACKING_LIST",
  "BILL_OF_LADING",
  "FORM_E",
  "IMPORT_DECLARATION",
];
