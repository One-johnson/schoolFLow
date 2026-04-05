"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    out[i] = rawData.charCodeAt(i);
  }
  return out;
}

export function WebPushPrompt(): React.ReactNode {
  const [supported, setSupported] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [permission, setPermission] =
    useState<NotificationPermission | "unsupported">("unsupported");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);
    if (!ok) return;
    setPermission(Notification.permission);
    void fetch("/api/push/vapid-public-key", { credentials: "include" })
      .then((r) => r.json() as Promise<{ configured?: boolean }>)
      .then((d) => setConfigured(d.configured === true))
      .catch(() => setConfigured(false));
  }, []);

  const subscribe = useCallback(async () => {
    if (!supported || !configured) return;
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        toast.message("Notifications are blocked in your browser settings.");
        return;
      }
      const { publicKey } = (await fetch("/api/push/vapid-public-key").then((r) =>
        r.json(),
      )) as { publicKey?: string };
      if (!publicKey) {
        toast.error("Push is not configured on this server.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error("Invalid push subscription");
      }
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: {
            endpoint: json.endpoint,
            keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
          },
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
      toast.success("Browser alerts enabled for this device");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not enable alerts");
    } finally {
      setBusy(false);
    }
  }, [configured, supported]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint }),
        });
        await sub.unsubscribe();
      }
      setPermission(Notification.permission);
      toast.success("Browser alerts turned off for this device");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not disable alerts");
    } finally {
      setBusy(false);
    }
  }, [supported]);

  if (!supported || !configured) return null;
  if (permission === "denied") {
    return (
      <p className="text-xs text-muted-foreground max-w-xs">
        Notifications are blocked. Allow them in your browser site settings to get alerts.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {permission === "granted" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => void unsubscribe()}
          className="gap-1.5"
        >
          <BellOff className="h-3.5 w-3.5" />
          Turn off alerts
        </Button>
      ) : (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => void subscribe()}
          className="gap-1.5"
        >
          <Bell className="h-3.5 w-3.5" />
          Get browser alerts
        </Button>
      )}
    </div>
  );
}
