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

declare global {
  interface Window {
    __kayartInstallPrompt?: BeforeInstallPromptEvent;
    __kayartPwaBootstrap?: boolean;
  }
}

const dismissedKey = "kayart-pwa-install-dismissed";

export function PwaInstallPrompt() {
  const pathname = usePathname();
  const installPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    function revealSavedPrompt() {
      if (!window.__kayartInstallPrompt) {
        return;
      }

      installPrompt.current = window.__kayartInstallPrompt;

      if (!wasDismissedThisSession()) {
        setCanInstall(true);
      }
    }

    function handleInstallPrompt(event: Event) {
      event.preventDefault();
      installPrompt.current = event as BeforeInstallPromptEvent;
      window.__kayartInstallPrompt = event as BeforeInstallPromptEvent;

      if (!wasDismissedThisSession()) {
        setCanInstall(true);
      }
    }

    function handleInstalled() {
      installPrompt.current = null;
      delete window.__kayartInstallPrompt;
      setCanInstall(false);
    }

    revealSavedPrompt();
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("kayart:pwa-install-ready", revealSavedPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("kayart:pwa-install-ready", revealSavedPrompt);
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
    delete window.__kayartInstallPrompt;
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
