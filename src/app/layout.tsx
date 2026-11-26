import type { Metadata } from "next";
import { IBM_Plex_Sans_Thai } from "next/font/google";
import { TrackerProvider } from "@/components/context/tracker-context";
import { TrackerShell } from "@/components/shell/tracker-shell";
import { getTrackerSession } from "@/lib/auth/session";
import { getBootstrapState } from "@/lib/services/settings-service";
import "./globals.css";

const ibmPlexThai = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-thai",
});

export const metadata: Metadata = {
  title: "AW Packaging Tracker — งานออกแบบบรรจุภัณฑ์ สินค้า Import",
  description: "ระบบติดตามงานออกแบบบรรจุภัณฑ์ สินค้า Import (AW Packaging Tracker)",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getTrackerSession();
  const initial = await getBootstrapState(session);

  return (
    <html lang="th" className={ibmPlexThai.variable}>
      <body>
        <TrackerProvider initial={initial}>
          <TrackerShell>{children}</TrackerShell>
        </TrackerProvider>
      </body>
    </html>
  );
}
