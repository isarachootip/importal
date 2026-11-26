import type { MainStatus, SubStatus } from "./aw-constants";

export type HistoryMark = "create" | "info" | "fail" | "confirm" | "final" | "gr";

export interface HistoryEntry {
  id?: string;
  sub: SubStatus;
  d: string;
  by: string;
  act: string;
  note: string;
  mark?: HistoryMark | null;
}

export interface EditLogEntry {
  id?: string;
  d: string;
  by: string;
  user: string;
  ch: string[];
  sla: string;
}

export interface JobFileEntry {
  id?: string;
  name: string;
  storageKey?: string | null;
  link?: boolean;
  mimeType?: string | null;
  sizeBytes?: number | null;
  by: string;
  d: string;
}

export interface JobSkuEntry {
  id?: string;
  sku: string;
  created: string;
  gr: string | null;
}

export interface JobRecord {
  id: string;
  jobCode: string;
  pi: string;
  piDate: string;
  bu: string;
  supplier: string;
  brand: string;
  pattern: number;
  sdept: number;
  sdepts: number[];
  folder: string;
  items: number;
  license: string;
  packages: string[];
  importer: string;
  designer: string;
  brief: "Y" | "N";
  photo: boolean;
  leadtime?: number | null;
  poNumber?: string | null;
  skuFile?: string | null;
  history: HistoryEntry[];
  edits: EditLogEntry[];
  files: JobFileEntry[];
  skus: JobSkuEntry[];
}

export interface DraftData {
  key: string;
  v: Record<string, string | boolean>;
  files: string[];
  d: string;
  t: string;
  by: string;
}

export interface OutboxMail {
  id: string;
  t: string;
  key: string;
  jid: string | null;
  pi: string;
  to: string[];
  toEmails: string[];
  cc: string[];
  ccEmails: string[];
  subj: string;
  head: string;
  todo: string;
  due: string | null;
  info: Array<[string, string]>;
  note: string;
  mode: string;
  smtpDelivered?: boolean;
}
