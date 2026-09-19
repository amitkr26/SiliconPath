"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const PRIMARY_ORIGIN = "https://berojgardegreewala.vercel.app";
const TOKEN_KEY = "sb-aqauempuwmbizqoaolop-auth-token";

export function AuthSync() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const { hostname, protocol, origin } = window.location;

    // If we are on the primary origin, we don't need to load the iframe to sync from ourselves.
    if (origin === PRIMARY_ORIGIN) {
      return;
    }

    // Local dev / plain HTTP gets no sync bridge: the iframe target lives on an
    // https origin and would be blocked by the page CSP (frame-src) anyway.
    // Preview deployments (https origins other than primary) keep the bridge.
    const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0" || hostname.endsWith(".local");
    if (isLocalHost || protocol !== "https:") {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from primary origin
      if (event.origin !== PRIMARY_ORIGIN) return;

      const data = event.data;
      if (!data || typeof data !== "object") return;

      if (data.type === "SYNC_BRIDGE_READY") {
        setIframeReady(true);
        // Request token from primary origin
        iframeRef.current?.contentWindow?.postMessage(
          { type: "GET_TOKEN" },
          PRIMARY_ORIGIN
        );
      } else if (data.type === "TOKEN_RESPONSE") {
        const primaryToken = data.token;
        const localToken = localStorage.getItem(TOKEN_KEY);

        if (primaryToken && primaryToken !== localToken) {
          // Sync token to preview domain and reload to apply session
          localStorage.setItem(TOKEN_KEY, primaryToken);
          // Force a page refresh to let Supabase Auth pick up the new session
          window.location.reload();
        } else if (!primaryToken && localToken) {
          // If logged in on preview but not primary, sync to primary
          iframeRef.current?.contentWindow?.postMessage(
            { type: "SET_TOKEN", token: localToken },
            PRIMARY_ORIGIN
          );
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Also listen to auth changes locally to sync login/logout back to primary origin
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (iframeReady && iframeRef.current?.contentWindow) {
        const localToken = localStorage.getItem(TOKEN_KEY);
        iframeRef.current.contentWindow.postMessage(
          { type: "SET_TOKEN", token: localToken },
          PRIMARY_ORIGIN
        );
      }
    });

    return () => {
      window.removeEventListener("message", handleMessage);
      subscription.unsubscribe();
    };
  }, [isClient, iframeReady]);

  // Render iframe only in preview environments (https, non-primary origin)
  if (
    !isClient ||
    window.location.origin === PRIMARY_ORIGIN ||
    ["localhost", "127.0.0.1", "0.0.0.0"].some((h) => window.location.hostname === h || window.location.hostname.endsWith(".local")) ||
    window.location.protocol !== "https:"
  ) {
    return null;
  }

  return (
    <iframe
      ref={iframeRef}
      src={`${PRIMARY_ORIGIN}/auth-sync.html`}
      style={{ display: "none", width: 0, height: 0, border: 0 }}
      title="auth-sync-bridge"
    />
  );
}

export default AuthSync;
