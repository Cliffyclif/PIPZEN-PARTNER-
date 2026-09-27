"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";

// CryMad CRM chat widget (contract §2). Signed-in partners are identified with
// a short-lived token from /api/crymad-crm/identity-token (contract §3).

interface CryMadCrmApi {
  identify(options: { getToken: () => Promise<string> }): void;
  logout(): void;
  open(): void;
  close(): void;
  setContext(context: Record<string, unknown>): void;
  on(event: string, handler: (...args: unknown[]) => void): void;
}

declare global {
  interface Window {
    CryMadCRM?: CryMadCrmApi;
  }
}

async function fetchIdentityToken() {
  const res = await fetch("/api/crymad-crm/identity-token", { cache: "no-store", credentials: "same-origin" });
  if (!res.ok) throw new Error(`Identity token request failed (${res.status})`);
  const { token } = (await res.json()) as { token: string };
  return token;
}

interface CrmWidgetProps {
  src: string;
  platform: string;
  widgetKey: string;
  identify: boolean;
}

export function CrmWidget({ src, platform, widgetKey, identify }: CrmWidgetProps) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) window.CryMadCRM?.setContext({ page: pathname });
  }, [ready, pathname]);

  return (
    <Script
      id="crymad-crm-widget"
      src={src}
      strategy="afterInteractive"
      data-platform={platform}
      data-key={widgetKey}
      onReady={() => {
        const crm = window.CryMadCRM;
        if (!crm) return;
        if (identify) crm.identify({ getToken: fetchIdentityToken });
        setReady(true);
      }}
    />
  );
}

// Clears the widget's session on sign-out so a shared device never shows the
// previous partner's conversations.
export function crmLogout() {
  try {
    window.CryMadCRM?.logout();
  } catch (error) {
    console.error("[crymad-crm] Widget logout failed", error);
  }
}

export function openCrmChat() {
  if (!window.CryMadCRM) return false;
  window.CryMadCRM.open();
  return true;
}
