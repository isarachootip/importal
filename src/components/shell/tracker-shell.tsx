"use client";

import React from "react";
import { OverlayModalsLayer } from "@/components/ui/email-modals";
import { TrackerSidebar } from "./tracker-sidebar";
import { TrackerTopbar } from "./tracker-topbar";

export function TrackerShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="app">
        <TrackerSidebar />
        <div>
          <TrackerTopbar />
          <main className="main">{children}</main>
        </div>
      </div>
      <OverlayModalsLayer />
    </>
  );
}
