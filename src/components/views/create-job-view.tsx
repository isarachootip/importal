"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useTracker } from "@/components/context/tracker-context";
import {
  buildInitialFormValues,
  deserializeFormDraft,
  JobFormFields,
  serializeFormDraft,
  validateAndBuildApiPayload,
} from "@/components/forms/job-form-fields";
import { SlaPreviewCard } from "@/components/forms/sla-preview-card";
import { DraftBanner, SaveDraftButton } from "@/components/ui/status-badges";
import type { JobRecord, OutboxMail } from "@/lib/domain/job-types";

export function CreateJobView() {
  const router = useRouter();
  const {
    session,
    today,
    holidaySet,
    drafts,
    switchSession,
    saveDraftRemote,
    deleteDraftRemote,
    upsertJobState,
    showToast,
  } = useTracker();

  const draftKey = `create:${session.role}`;
  const activeDraft = drafts[draftKey];

  const [values, setValues] = useState(() => {
    const base = buildInitialFormValues(today);
    return activeDraft ? deserializeFormDraft(activeDraft.v, base) : base;
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const base = buildInitialFormValues(today);
    setValues(activeDraft ? deserializeFormDraft(activeDraft.v, base) : base);
  }, [draftKey, activeDraft, today]);

  if (session.role !== "import" && session.role !== "mgmt") {
    return (
      <div className="notice">
        การแจ้งงานใหม่ทำได้โดย <b>Import</b> เท่านั้น{" "}
        <button
          type="button"
          className="btn sm"
          style={{ marginLeft: 8 }}
          onClick={() => void switchSession("import")}
        >
          สลับเป็น Import (Demo)
        </button>
      </div>
    );
  }

  async function handleSubmit() {
    const checked = validateAndBuildApiPayload(values);
    if ("err" in checked) {
      showToast(checked.err ?? "ข้อมูลไม่ครบถ้วน");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checked.data),
      });
      const json = (await res.json()) as { job?: JobRecord; mail?: OutboxMail | null; error?: string };
      if (!res.ok || !json.job) throw new Error(json.error ?? "แจ้งงานไม่สำเร็จ");
      upsertJobState(json.job, json.mail);
      await deleteDraftRemote(draftKey);
      showToast(`ส่งงาน ${json.job.pi} แล้ว · รอ Designer ตรวจข้อมูลภายใน 2 วันทำงาน`);
      router.push(`/jobs/${json.job.id}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="grid create-grid"
      style={{ gridTemplateColumns: "minmax(0, 1fr) 340px", alignItems: "start" }}
    >
      <div className="card">
        <DraftBanner
          draft={activeDraft}
          onDelete={() => {
            void deleteDraftRemote(draftKey);
            setValues(buildInitialFormValues(today));
            showToast("ลบร่างแล้ว");
          }}
        />
        <h2>ข้อมูลงาน</h2>
        <div className="hint" style={{ marginBottom: 16 }}>
          ช่องที่มี <span style={{ color: "var(--org-d)" }}>*</span> ต้องระบุ · Timeline: แจ้งงานภายใน 2 วัน (Old SKU) / 7 วัน (New SKU) หลัง EVP อนุมัติ PI
        </div>
        <JobFormFields values={values} today={today} onChange={setValues} />
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, flexWrap: "wrap" }}>
          <button type="button" className="btn" onClick={() => router.push("/")}>
            ยกเลิก
          </button>
          <SaveDraftButton
            onClick={() => void saveDraftRemote(draftKey, serializeFormDraft(values))}
          />
          <button type="button" className="btn pri" disabled={busy} onClick={() => void handleSubmit()}>
            Send · แจ้งงานออกแบบ
          </button>
        </div>
      </div>

      <SlaPreviewCard
        patternId={values.pattern}
        items={values.items}
        license={values.license}
        piDate={values.piDate || today}
        holidays={holidaySet}
      />
    </div>
  );
}
