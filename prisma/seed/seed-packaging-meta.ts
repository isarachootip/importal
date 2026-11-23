import { ChecklistCategory, PatternGroup, PrismaClient, RoleCode, SkuCategory } from "@prisma/client";

const DEFAULT_WEIGHTS = { aw: 7, p1: 2, r1: 3, p2: 2, r2: 3, p3: 2, r3: 3 };

const CASE_CONFIGS: Array<{
  caseNumber: number;
  patternGroup: PatternGroup;
  skuCategory: SkuCategory;
  name: string;
  descriptionTh: string;
  infoDays: number;
  designDays: number;
}> = [
  { caseNumber: 1, patternGroup: "APPROVAL_PATTERN", skuCategory: "REPEAT_SKU", name: "No Change AW", descriptionTh: "SKU เก่า & Pattern ที่ผ่านแล้ว", infoDays: 2, designDays: 0 },
  { caseNumber: 2, patternGroup: "APPROVAL_PATTERN", skuCategory: "REPEAT_SKU", name: "Old SKUs & Use approval Pattern", descriptionTh: "SKU เก่า ทำใส่ Pattern ล่าสุด", infoDays: 4, designDays: 15 },
  { caseNumber: 3, patternGroup: "APPROVAL_PATTERN", skuCategory: "NEW_SKU", name: "New SKUs & Use approval Pattern", descriptionTh: "SKU ใหม่ ทำใส่ Pattern ล่าสุด", infoDays: 9, designDays: 15 },
  { caseNumber: 4, patternGroup: "NEW_PATTERN", skuCategory: "REPEAT_SKU", name: "Old SKUs & Design New Pattern", descriptionTh: "SKU เก่า ออกแบบ Pattern ใหม่", infoDays: 4, designDays: 25 },
  { caseNumber: 5, patternGroup: "NEW_PATTERN", skuCategory: "NEW_SKU", name: "New SKUs & Design New Pattern", descriptionTh: "SKU ใหม่ ออกแบบ Pattern ใหม่", infoDays: 9, designDays: 25 },
  { caseNumber: 6, patternGroup: "NEW_PATTERN", skuCategory: "NEW_SKU", name: "New Pattern Design", descriptionTh: "ออกแบบนำเสนอใหม่ทั้งหมด", infoDays: 14, designDays: 30 },
];

const PACKAGING_TYPES: Array<{ code: string; nameTh: string; nameEn: string }> = [
  { code: "BOX_COLOR", nameTh: "Box (งานกล่องสี)", nameEn: "Color Box" },
  { code: "BOX_WHITE", nameTh: "Box (งานกล่องขาว)", nameEn: "White Box" },
  { code: "BOX_BROWN", nameTh: "Box (งานกล่องน้ำตาล)", nameEn: "Brown Box" },
  { code: "BAG", nameTh: "Bag (งานถุง)", nameEn: "Bag" },
  { code: "INSERT_CARD", nameTh: "Insert Card (กระดาษสอด)", nameEn: "Insert Card" },
  { code: "STICKER_LABEL", nameTh: "Sticker Label (สติ๊กเกอร์แปะ)", nameEn: "Sticker Label" },
  { code: "WASHING_LABEL", nameTh: "Washing Label (ป้ายผ้า)", nameEn: "Washing Label" },
  { code: "HANG_TAG", nameTh: "Hang Tag (ป้ายห้อย)", nameEn: "Hang Tag" },
  { code: "HEADER_CARD", nameTh: "Header Card (ป้ายแขวน)", nameEn: "Header Card" },
  { code: "STICKER_QR_TISI", nameTh: "Sticker QR TISI งานมอก.", nameEn: "TISI QR Sticker" },
  { code: "STICKER_PRODUCT_INSP", nameTh: "Sticker (Products & Inspiration)", nameEn: "Product & Inspiration Sticker" },
  { code: "EDIT_TEXT", nameTh: "Edit Text (แก้ไขข้อความ)", nameEn: "Edit Text" },
  { code: "EDIT_COLOR", nameTh: "Edit Color (แก้ไขสี)", nameEn: "Edit Color" },
  { code: "EDIT_TEXT_COLOR", nameTh: "Edit Text & Color (แก้ไขข้อความและสี)", nameEn: "Edit Text & Color" },
  { code: "LASER", nameTh: "Laser (เลเซอร์)", nameEn: "Laser" },
  { code: "SCREEN", nameTh: "Screen (สกรีน)", nameEn: "Screen" },
  { code: "MANUAL", nameTh: "Manual (คู่มือ)", nameEn: "Manual" },
  { code: "WARRANTY", nameTh: "ใบรับประกันสินค้า (Warranty)", nameEn: "Warranty Card" },
];

const CHECKLIST_ITEMS: Array<{ category: ChecklistCategory; code: string; labelTh: string; isRequired: boolean }> = [
  { category: "IMPORT_PRE_SUBMIT", code: "IMP_01_DIECUT", labelTh: "Die-cut AW: ประเภท Packaging / ฝาปิดแบบไหน / อัปเดตอีกครั้ง", isRequired: true },
  { category: "IMPORT_PRE_SUBMIT", code: "IMP_02_PATTERN", labelTh: "Pattern ที่ต้องการ (พร้อมแนบรูปแบบเก่าด้วย)", isRequired: true },
  { category: "IMPORT_PRE_SUBMIT", code: "IMP_03_NAME_BI", labelTh: "ชื่อสินค้า 2 ภาษา: ไทย, Eng", isRequired: true },
  { category: "IMPORT_PRE_SUBMIT", code: "IMP_04_ICON_BI", labelTh: "icon 2 ภาษา: ไทย, Eng", isRequired: true },
  { category: "IMPORT_PRE_SUBMIT", code: "IMP_05_SPEC_BI", labelTh: "คุณสมบัติสินค้า / รายละเอียด 2 ภาษา: ไทย, Eng", isRequired: true },
  { category: "IMPORT_PRE_SUBMIT", code: "IMP_06_OCPB", labelTh: "สคบ.: ข้อมูลที่ถูกต้อง ชื่อ/รุ่น/ขนาด/SKU/Barcode/ฯลฯ", isRequired: true },
  { category: "IMPORT_PRE_SUBMIT", code: "IMP_07_DIMENSION", labelTh: "Drawing & Dimension", isRequired: true },
  { category: "IMPORT_PRE_SUBMIT", code: "IMP_08_PHOTOS", labelTh: "Product Photos & Inspiration Images (ตรงกับสินค้าที่ขายจริง)", isRequired: true },
  { category: "IMPORT_PRE_SUBMIT", code: "IMP_09_SERIES", labelTh: "ชื่อ Series ที่ GM / VP / Head of MDSG อนุมัติเรียบร้อยแล้ว", isRequired: true },
  { category: "GD_PRE_QC_REJECT", code: "PREQC_NO_SKU_BARCODE", labelTh: "ไม่มี SKU / Barcode", isRequired: true },
  { category: "GD_PRE_QC_REJECT", code: "PREQC_NO_QR_VIDEO", labelTh: "ไม่มี QR Code VDO การติดตั้ง", isRequired: false },
  { category: "GD_PRE_QC_REJECT", code: "PREQC_NO_QR_TISI", labelTh: "ไม่มี ลิ้งข้อมูล QR มอก.", isRequired: false },
  { category: "GD_PRE_QC_REJECT", code: "PREQC_NO_SAMPLE_PHOTO", labelTh: "ไม่มีสินค้าตัวอย่างถ่ายภาพ", isRequired: true },
  { category: "GD_PRE_QC_REJECT", code: "PREQC_MISMATCH_PRODUCT", labelTh: "สินค้าไม่ตรงการขายจริง", isRequired: true },
  { category: "GD_PRE_QC_REJECT", code: "PREQC_NO_MANUAL", labelTh: "ไฟล์ Manual (คู่มือ) ไม่ครบ", isRequired: false },
];

const APPROVAL_RULES: Array<{
  stageKey: string;
  stepOrder: number;
  role: RoleCode;
  isParallel: boolean;
  slaDays: number;
  isEnabled: boolean;
}> = [
  // Default Mockup flow: Proof by Import & MER; GM/VP & EVP at final stages (Admin can enable GM/VP on p1..p3 anytime)
  ...["p1", "p2", "p3"].flatMap((stageKey) => [
    { stageKey, stepOrder: 1, role: "IMPORT" as RoleCode, isParallel: true, slaDays: 2, isEnabled: true },
    { stageKey, stepOrder: 1, role: "MER" as RoleCode, isParallel: true, slaDays: 2, isEnabled: true },
    { stageKey, stepOrder: 2, role: "GM" as RoleCode, isParallel: false, slaDays: 1, isEnabled: false },
    { stageKey, stepOrder: 3, role: "VP" as RoleCode, isParallel: false, slaDays: 1, isEnabled: false },
  ]),
  ...["r1", "r2", "r3"].map((stageKey) => ({
    stageKey,
    stepOrder: 1,
    role: "GM" as RoleCode,
    isParallel: false,
    slaDays: 1,
    isEnabled: false,
  })),
  { stageKey: "approve_gm_vp", stepOrder: 1, role: "GM", isParallel: true, slaDays: 1, isEnabled: true },
  { stageKey: "approve_gm_vp", stepOrder: 1, role: "VP", isParallel: true, slaDays: 1, isEnabled: true },
  { stageKey: "approve_evp", stepOrder: 1, role: "EVP", isParallel: false, slaDays: 1, isEnabled: true },
  { stageKey: "rfinal", stepOrder: 1, role: "GM", isParallel: false, slaDays: 1, isEnabled: true },
  { stageKey: "rfinal", stepOrder: 2, role: "EVP", isParallel: false, slaDays: 1, isEnabled: true },
];

const SYSTEM_SETTINGS: Array<{ key: string; value: object | number | boolean; description: string }> = [
  { key: "repeat_order_minor_change_enabled", value: true, description: "อนุญาต Minor change สำหรับ Repeat Order ใช้ Case 1 ไม่ต้องส่ง EVP ดูซ้ำ" },
  { key: "sku_batch_size", value: 30, description: "จำนวน SKU ต่อรอบที่บวกวันส่ง Info เพิ่ม" },
  { key: "sku_batch_extra_days", value: 7, description: "จำนวนวันทำการที่บวกเพิ่มทุกๆ sku_batch_size" },
  { key: "new_photo_extra_days", value: 7, description: "จำนวนวันทำการที่บวกเพิ่มเมื่อถ่ายรูปสินค้าใหม่" },
  { key: "sourcing_default_days", value: 10, description: "แผนวันปฏิทินขั้น Sourcing & Offer" },
  { key: "po_default_days", value: 5, description: "แผนวันปฏิทินขั้น Purchase Order" },
  { key: "daily_digest_hour", value: 8, description: "ชั่วโมงแจ้งเตือนสรุปงานเลยกำหนด (Asia/Bangkok)" },
];

export async function seedPackagingMeta(prisma: PrismaClient) {
  const caseConfigByNum = new Map<number, string>();
  for (const cfg of CASE_CONFIGS) {
    const rec = await prisma.packagingCaseConfig.upsert({
      where: { caseNumber: cfg.caseNumber },
      update: { ...cfg, designWeights: DEFAULT_WEIGHTS },
      create: { ...cfg, designWeights: DEFAULT_WEIGHTS },
    });
    caseConfigByNum.set(cfg.caseNumber, rec.id);
  }

  const pkgTypeByCode = new Map<string, string>();
  for (let i = 0; i < PACKAGING_TYPES.length; i++) {
    const t = PACKAGING_TYPES[i]!;
    const rec = await prisma.packagingType.upsert({
      where: { code: t.code },
      update: { nameTh: t.nameTh, nameEn: t.nameEn, sortOrder: i + 1 },
      create: { ...t, sortOrder: i + 1 },
    });
    pkgTypeByCode.set(t.code, rec.id);
  }

  for (let i = 0; i < CHECKLIST_ITEMS.length; i++) {
    const item = CHECKLIST_ITEMS[i]!;
    await prisma.checklistItemConfig.upsert({
      where: { code: item.code },
      update: { category: item.category, labelTh: item.labelTh, isRequired: item.isRequired, sortOrder: i + 1 },
      create: { ...item, sortOrder: i + 1 },
    });
  }

  for (const rule of APPROVAL_RULES) {
    await prisma.approvalRuleConfig.upsert({
      where: { stageKey_stepOrder_role: { stageKey: rule.stageKey, stepOrder: rule.stepOrder, role: rule.role } },
      update: { isParallel: rule.isParallel, slaDays: rule.slaDays, isEnabled: rule.isEnabled },
      create: rule,
    });
  }

  const finalApprovers = [
    { email: "BhChodok@chg.co.th", displayName: "K.Chodok", role: "EVP" as RoleCode },
    { email: "UaWarunee@chg.co.th", displayName: "K.Warunee", role: "EVP" as RoleCode },
  ];
  for (const fa of finalApprovers) {
    await prisma.finalApproverConfig.upsert({
      where: { email: fa.email },
      update: { displayName: fa.displayName, role: fa.role },
      create: fa,
    });
  }

  for (const s of SYSTEM_SETTINGS) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: { key: s.key, value: s.value, description: s.description },
    });
  }

  return { caseConfigByNum, pkgTypeByCode };
}
