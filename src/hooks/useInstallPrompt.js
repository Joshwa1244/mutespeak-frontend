import { useEffect, useState } from "react";

export default function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();

    const choice = await deferredPrompt.userChoice;

    setDeferredPrompt(null);

    return choice.outcome === "accepted";
  };

  return {
    canInstall: !!deferredPrompt,
    install,
  };
}