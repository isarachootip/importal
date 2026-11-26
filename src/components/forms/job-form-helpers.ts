import {
  BRANDS,
  BU_LIST,
  DESIGNER_NAMES,
  LICENSE_LIST,
  OTHER_SUPPLIER,
  PACKAGES,
  SUPPLIERS,
} from "@/lib/domain/aw-constants";
import type { JobRecord } from "@/lib/domain/job-types";

export interface JobFormValues {
  pi: string;
  piDate: string;
  bu: string;
  supplierSelect: string;
  supplierOther: string;
  brand: string;
  items: number;
  sd1: string;
  sd2: string;
  sd3: string;
  pattern: number;
  license: string;
  designer: string;
  brief: "" | "Y" | "N";
  packages: string[];
  folder: string;
}

export function buildInitialFormValues(today: string, job?: JobRecord): JobFormValues {
  if (!job) {
    return {
      pi: "",
      piDate: today,
      bu: BU_LIST[0],
      supplierSelect: SUPPLIERS[0],
      supplierOther: "",
      brand: BRANDS[0],
      items: 12,
      sd1: "",
      sd2: "",
      sd3: "",
      pattern: 3,
      license: LICENSE_LIST[0],
      designer: DESIGNER_NAMES[0] ?? "คุณพีท",
      brief: "",
      packages: [PACKAGES[0]],
      folder: "",
    };
  }
  const isKnownSup = (SUPPLIERS as readonly string[]).includes(job.supplier);
  return {
    pi: job.pi,
    piDate: job.piDate,
    bu: job.bu,
    supplierSelect: isKnownSup ? job.supplier : OTHER_SUPPLIER,
    supplierOther: isKnownSup ? "" : job.supplier,
    brand: job.brand,
    items: job.items,
    sd1: job.sdepts[0] ? String(job.sdepts[0]) : "",
    sd2: job.sdepts[1] ? String(job.sdepts[1]) : "",
    sd3: job.sdepts[2] ? String(job.sdepts[2]) : "",
    pattern: job.pattern,
    license: job.license,
    designer: job.designer,
    brief: job.brief,
    packages: [...job.packages],
    folder: job.folder,
  };
}

export function serializeFormDraft(v: JobFormValues): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {
    pi: v.pi,
    piDate: v.piDate,
    bu: v.bu,
    supplierSelect: v.supplierSelect,
    supplierOther: v.supplierOther,
    brand: v.brand,
    items: String(v.items),
    sd1: v.sd1,
    sd2: v.sd2,
    sd3: v.sd3,
    pattern: String(v.pattern),
    license: v.license,
    designer: v.designer,
    brief: v.brief,
    folder: v.folder,
  };
  PACKAGES.forEach((pkg) => {
    out[`pkg|${pkg}`] = v.packages.includes(pkg);
  });
  return out;
}

export function deserializeFormDraft(raw: Record<string, string | boolean>, fallback: JobFormValues): JobFormValues {
  const pkgs = PACKAGES.filter((pkg) => raw[`pkg|${pkg}`] === true);
  return {
    pi: typeof raw.pi === "string" ? raw.pi : fallback.pi,
    piDate: typeof raw.piDate === "string" ? raw.piDate : fallback.piDate,
    bu: typeof raw.bu === "string" ? raw.bu : fallback.bu,
    supplierSelect: typeof raw.supplierSelect === "string" ? raw.supplierSelect : fallback.supplierSelect,
    supplierOther: typeof raw.supplierOther === "string" ? raw.supplierOther : fallback.supplierOther,
    brand: typeof raw.brand === "string" ? raw.brand : fallback.brand,
    items: raw.items ? Math.max(1, Number(raw.items) || 1) : fallback.items,
    sd1: typeof raw.sd1 === "string" ? raw.sd1 : fallback.sd1,
    sd2: typeof raw.sd2 === "string" ? raw.sd2 : fallback.sd2,
    sd3: typeof raw.sd3 === "string" ? raw.sd3 : fallback.sd3,
    pattern: raw.pattern ? Number(raw.pattern) || 3 : fallback.pattern,
    license: typeof raw.license === "string" ? raw.license : fallback.license,
    designer: typeof raw.designer === "string" ? raw.designer : fallback.designer,
    brief: raw.brief === "Y" || raw.brief === "N" ? raw.brief : fallback.brief,
    packages: pkgs.length > 0 ? pkgs : fallback.packages,
    folder: typeof raw.folder === "string" ? raw.folder : fallback.folder,
  };
}

export function validateAndBuildApiPayload(v: JobFormValues) {
  if (!v.pi.trim() || !v.piDate) return { err: "กรุณาระบุ PI Number และ PI approval date" };
  if (!v.sd1) return { err: "กรุณาเลือก Sdept & Sdept Name 1" };
  const sdepts = [v.sd1, v.sd2, v.sd3].filter(Boolean).map(Number);
  if (new Set(sdepts).size !== sdepts.length) return { err: "เลือก Sdept ซ้ำกัน" };
  const supplier = v.supplierSelect === OTHER_SUPPLIER ? v.supplierOther.trim() : v.supplierSelect;
  if (!supplier) return { err: "กรุณาระบุชื่อ Supplier" };
  if (v.brief !== "Y" && v.brief !== "N") return { err: "กรุณาเลือกว่าต้องประชุม Brief กับ Designer หรือไม่ (Y/N)" };
  if (!/^https?:\/\/\S+$/i.test(v.folder.trim())) {
    return { err: "กรุณากรอก Link Share Folder (ขึ้นต้นด้วย http:// หรือ https://)" };
  }
  return {
    data: {
      pi: v.pi.trim(),
      piDate: v.piDate,
      bu: v.bu,
      supplier,
      brand: v.brand,
      pattern: Number(v.pattern),
      sdepts,
      items: Math.max(1, Math.floor(Number(v.items) || 1)),
      license: v.license,
      designer: v.designer,
      brief: v.brief,
      packages: v.packages,
      folder: v.folder.trim(),
    },
  };
}
