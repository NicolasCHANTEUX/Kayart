"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type InstallChoice = {
  outcome: "accepted" | "dismissed";
  platform: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<InstallChoice>;
};

const dismissedKey = "kayart-pwa-install-dismissed";

export function PwaInstallPrompt() {
  const pathname = usePathname();
  const installPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    function handleInstallPrompt(event: Event) {
      event.preventDefault();
      installPrompt.current = event as BeforeInstallPromptEvent;

      if (!wasDismissedThisSession()) {
        setCanInstall(true);
      }
    }

    function handleInstalled() {
      installPrompt.current = null;
      setCanInstall(false);
    }

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // The site remains fully usable when service workers are unavailable.
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (!canInstall || pathname !== "/") {
    return null;
  }

  function dismiss() {
    try {
      window.sessionStorage.setItem(dismissedKey, "1");
    } catch {
      // Session storage can be unavailable in restrictive browser modes.
    }

    setCanInstall(false);
  }

  async function install() {
    const prompt = installPrompt.current;

    if (!prompt) {
      return;
    }

    await prompt.prompt();
    const choice = await prompt.userChoice;
    installPrompt.current = null;
    setCanInstall(false);

    if (choice.outcome === "dismissed") {
      try {
        window.sessionStorage.setItem(dismissedKey, "1");
      } catch {
        // The native prompt has already been dismissed; no fallback is required.
      }
    }
  }

  return (
    <aside className="pwa-install-prompt" aria-labelledby="pwa-install-title">
      <button
        aria-label="Fermer la proposition d’installation"
        className="pwa-install-prompt__close"
        onClick={dismiss}
        type="button"
      >
        ×
      </button>
      <span className="pwa-install-prompt__eyebrow">Application KayArt</span>
      <strong id="pwa-install-title">Gardez l’atelier à portée de main.</strong>
      <p>Installez KayArt pour retrouver la boutique dans une fenêtre dédiée.</p>
      <button className="button button--primary" onClick={() => void install()} type="button">
        Installer l’application
      </button>
    </aside>
  );
}

function wasDismissedThisSession() {
  try {
    return window.sessionStorage.getItem(dismissedKey) === "1";
  } catch {
    return false;
  }
}
