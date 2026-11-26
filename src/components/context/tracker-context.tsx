"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import type { TrackerSession } from "@/lib/auth/types";
import type { TrackerRoleKey } from "@/lib/domain/directory-import-design";
import type { DraftData, JobRecord, OutboxMail } from "@/lib/domain/job-types";
import type { NotifMode } from "@/lib/domain/rules-metadata";
import type {
  BootstrapPayload,
  Dash2FilterState,
  GlobalFilterState,
  MailModalState,
  TasksFilterState,
  TrackerContextValue,
} from "./tracker-context-types";

export type { BootstrapPayload, GlobalFilterState, MailModalState, StaffClientEntry } from "./tracker-context-types";

const DEFAULT_FILTER: GlobalFilterState = { year: "", month: "", sdept: "", importer: "", designer: "", brand: "" };
const TrackerContext = createContext<TrackerContextValue | null>(null);

export function TrackerProvider({ initial, children }: { initial: BootstrapPayload; children: React.ReactNode }) {
  const [state, setState] = useState<BootstrapPayload>(initial);
  const [filter, setFilter] = useState<GlobalFilterState>({ ...DEFAULT_FILTER, year: initial.today.slice(0, 4) });
  const [jobsTab, setJobsTab] = useState("");
  const [jobsQuery, setJobsQuery] = useState("");
  const [tasksFilter, setTasksFilter] = useState<TasksFilterState>({ importer: "", designer: "", sdept: "" });
  const [dash2Filter, setDash2Filter] = useState<Dash2FilterState>({ sdept: "", designer: "", importer: "", brand: "" });
  const [showMailPopOnSend, setShowMailPopOnSend] = useState(true);
  const [mailPop, setMailPop] = useState<OutboxMail | null>(null);
  const [mailModal, setMailModal] = useState<MailModalState | null>(null);
  const [cancelJobId, setCancelJobId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 3400);
  }, []);

  const refreshAll = useCallback(async () => {
    const res = await fetch("/api/bootstrap", { cache: "no-store" });
    if (res.ok) setState((await res.json()) as BootstrapPayload);
  }, []);

  const switchSession = useCallback(async (role: TrackerRoleKey, userDisplayName?: string) => {
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, userDisplayName }),
    });
    if (res.ok) {
      const data = (await res.json()) as { session: TrackerSession };
      setState((prev) => ({ ...prev, session: data.session }));
    }
  }, []);

  const upsertJobState = useCallback(
    (job: JobRecord, mail?: OutboxMail | null) => {
      setState((prev) => {
        const exists = prev.jobs.some((j) => j.id === job.id);
        const jobs = exists ? prev.jobs.map((j) => (j.id === job.id ? job : j)) : [job, ...prev.jobs];
        return { ...prev, jobs, outbox: mail ? [mail, ...prev.outbox] : prev.outbox };
      });
      if (mail && showMailPopOnSend && mail.mode !== "สรุปรายวัน") setMailPop(mail);
    },
    [showMailPopOnSend]
  );

  const saveDraftRemote = useCallback(
    async (key: string, values: Record<string, string | boolean>, fileNames: string[] = []) => {
      const res = await fetch("/api/drafts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, values, fileNames }),
      });
      const data = (await res.json()) as { draft?: DraftData; error?: string };
      if (!res.ok || !data.draft) throw new Error(data.error ?? "บันทึกร่างไม่สำเร็จ");
      setState((prev) => ({ ...prev, drafts: { ...prev.drafts, [key]: data.draft! } }));
      showToast(`บันทึกร่างแล้ว · กลับมากรอกต่อได้ทุกเมื่อ${fileNames.length ? " · บันทึกรายชื่อไฟล์แนบไว้แล้ว" : ""}`);
    },
    [showToast]
  );

  const deleteDraftRemote = useCallback(async (key: string) => {
    await fetch(`/api/drafts?key=${encodeURIComponent(key)}`, { method: "DELETE" });
    setState((prev) => {
      const next = { ...prev.drafts };
      delete next[key];
      return { ...prev, drafts: next };
    });
  }, []);

  const updateHolidaysRemote = useCallback(
    async (dates: string[], resetDefault?: boolean) => {
      const res = await fetch("/api/settings/holidays", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dates, resetDefault }),
      });
      const data = (await res.json()) as { holidays?: string[]; error?: string };
      if (!res.ok || !data.holidays) throw new Error(data.error ?? "บันทึกวันหยุดไม่สำเร็จ");
      setState((prev) => ({ ...prev, holidays: data.holidays! }));
      showToast(`บันทึกวันหยุด ${data.holidays.length} วัน · คำนวณ SLA ใหม่ทั้งระบบแล้ว`);
    },
    [showToast]
  );

  const saveReviewRemote = useCallback(async (key: string, st: string, note: string) => {
    setState((prev) => ({ ...prev, reviews: { ...prev.reviews, [key]: { st, note } } }));
    await fetch("/api/settings/reviews", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, status: st, note }),
    });
  }, []);

  const updateNotifModeRemote = useCallback(async (eventKey: string, mode: NotifMode) => {
    setState((prev) => ({ ...prev, notifModes: { ...prev.notifModes, [eventKey]: mode } }));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventKey, mode }),
    });
  }, []);

  const resetDemoRemote = useCallback(async () => {
    const res = await fetch("/api/demo/reset", { method: "POST" });
    if (res.ok) {
      await refreshAll();
      setJobsTab("");
      setJobsQuery("");
      showToast("รีเซ็ตข้อมูล Demo เรียบร้อยแล้ว");
    }
  }, [refreshAll, showToast]);

  const holidaySet = useMemo(() => new Set(state.holidays), [state.holidays]);
  const resetFilter = useCallback(() => setFilter({ ...DEFAULT_FILTER, year: state.today.slice(0, 4) }), [state.today]);

  return (
    <TrackerContext.Provider
      value={{
        ...state, holidaySet, filter, setFilter, resetFilter, jobsTab, setJobsTab, jobsQuery, setJobsQuery,
        tasksFilter, setTasksFilter, dash2Filter, setDash2Filter, showMailPopOnSend, setShowMailPopOnSend,
        mailPop, setMailPop, mailModal, setMailModal, cancelJobId, setCancelJobId, toast, showToast,
        switchSession, upsertJobState, saveDraftRemote, deleteDraftRemote, updateHolidaysRemote,
        saveReviewRemote, updateNotifModeRemote, resetDemoRemote,
      }}
    >
      {children}
    </TrackerContext.Provider>
  );
}

export function useTracker(): TrackerContextValue {
  const ctx = useContext(TrackerContext);
  if (!ctx) throw new Error("useTracker must be used inside TrackerProvider");
  return ctx;
}
